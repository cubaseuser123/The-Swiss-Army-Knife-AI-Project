# Chat Route Implementation

## Overview

This document covers the complete chat route implementation with:
- **Conversation sidebar** with history management
- **Persistent message storage** in Neon DB
- **Cross-conversation RAG** integration
- **File attachments** inline in chat
- **Streaming responses** with tool call display

---

## 📁 File Directory Structure

```
the-sakai-proj/
├── app/
│   ├── chat/
│   │   ├── page.tsx                    [MODIFY] - Main chat wrapper
│   │   ├── [conversationId]/
│   │   │   └── page.tsx                [NEW] - Individual conversation
│   │   └── layout.tsx                  [NEW] - Chat layout with sidebar
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts                [MODIFY] - Add auth + persistence
│   │   └── conversations/
│   │       ├── route.ts                [EXISTS] - List/create
│   │       └── [id]/
│   │           ├── route.ts            [NEW] - Get/update/delete
│   │           └── messages/
│   │               └── route.ts        [NEW] - Get messages
├── components/
│   └── chat/
│       ├── chat-sidebar.tsx            [NEW]
│       ├── conversation-list.tsx       [NEW]
│       ├── chat-interface.tsx          [NEW]
│       └── message-list.tsx            [NEW]
├── lib/
│   └── hooks/
│       ├── use-conversations.ts        [NEW]
│       └── use-messages.ts             [NEW]
```

---

## ✏️ Modifications

### 1. Chat API Route (`app/api/chat/route.ts`)

**BEFORE:**
```typescript
import { gateway } from '@ai-sdk/gateway'
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs } from 'ai';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';

const tools = {
    searchKonwledgeBase: tool({
        // ... existing tool
    })
}

export async function POST(req: Request) {
    try {
        const { messages }: { messages: ChatMessage[] } = await req.json();

        const result = streamText({
            model: gateway("google/gemini-2.0-flash"),
            messages: await convertToModelMessages(messages),
            tools,
            system: "...",
            stopWhen: stepCountIs(2),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        // ...
    }
}
```

**AFTER:**
```typescript
import { gateway } from '@ai-sdk/gateway';
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs } from 'ai';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { saveMessage, getMessages } from '@/lib/services/messages';
import { updateConversation } from '@/lib/services/conversations';

const tools = {
    searchKnowledgeBase: tool({
        description: "Search the knowledge base for relevant information from documents and past conversations",
        parameters: z.object({
            query: z.string().describe("The search query to find relevant documents"),
        }),
        execute: async ({ query }, { userId }) => {
            try {
                const results = await searchDocuments(userId, query, {
                    limit: 5,
                    threshold: 0.4,
                });
                
                if (results.length === 0) {
                    return "No relevant documents found in your knowledge base.";
                }
                
                const formattedResults = results.map((r, i) => {
                    const source = r.conversationTitle 
                        ? `${r.sourceType} - ${r.conversationTitle}`
                        : r.sourceType;
                    return `[${i + 1}] (${source}): ${r.content}`;
                }).join("\n\n");
                
                return formattedResults;
            } catch (error) {
                console.error("Search error:", error);
                return "Error searching the knowledge base.";
            }
        }
    }),
};

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
    try {
        // Authenticate user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { messages, conversationId }: { messages: ChatMessage[]; conversationId?: number } = await req.json();

        // Get the last user message
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        // Save user message to DB if conversationId provided
        if (conversationId && lastUserMessage) {
            await saveMessage({
                conversationId,
                role: 'user',
                content: lastUserMessage.parts.find(p => p.type === 'text')?.text || '',
            });
        }

        const result = streamText({
            model: gateway("google/gemini-2.0-flash"),
            messages: await convertToModelMessages(messages),
            tools,
            toolContext: { userId: session.user.id },
            system: `You are a helpful AI assistant for Swiss Army Knife AI. You have access to the user's knowledge base which includes uploaded documents and past conversation history.

When users ask questions:
1. Search the knowledge base for relevant information using the searchKnowledgeBase tool
2. Base your answers on the search results when available
3. Be concise and directly answer what the user is asking
4. If no relevant documents are found, answer based on your general knowledge

The user's name is ${session.user.name || 'there'}.`,
            stopWhen: stepCountIs(3),
            onFinish: async ({ text }) => {
                // Save assistant response to DB
                if (conversationId && text) {
                    await saveMessage({
                        conversationId,
                        role: 'assistant',
                        content: text,
                    });

                    // Update conversation title if it's the first message
                    const existingMessages = await getMessages(conversationId);
                    if (existingMessages.length <= 2) {
                        // Generate title from first user message
                        const firstUserMsg = existingMessages.find(m => m.role === 'user');
                        if (firstUserMsg) {
                            const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
                            await updateConversation(conversationId, session.user.id, title);
                        }
                    }
                }
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error streaming chat completion:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
```

---

## ✨ New Code

### 1. Chat Layout (`app/chat/layout.tsx`)

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ChatSidebar userId={session.user.id} />
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
```

---

### 2. Chat Page (`app/chat/page.tsx`)

**REPLACE ENTIRELY:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createConversation } from "@/lib/services/conversations";

export default async function ChatPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Create a new conversation and redirect to it
    const conversation = await createConversation(session.user.id);
    redirect(`/chat/${conversation.id}`);
}
```

---

### 3. Conversation Page (`app/chat/[conversationId]/page.tsx`)

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getConversation } from "@/lib/services/conversations";
import { getMessages } from "@/lib/services/messages";
import { ChatInterface } from "@/components/chat/chat-interface";

type Props = {
    params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
    const { conversationId } = await params;
    
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const id = parseInt(conversationId);
    if (isNaN(id)) {
        notFound();
    }

    try {
        const conversation = await getConversation(id, session.user.id);
        if (!conversation) {
            notFound();
        }

        const messages = await getMessages(id);

        return (
            <ChatInterface
                conversationId={id}
                initialMessages={messages}
                conversationTitle={conversation.title}
            />
        );
    } catch (error) {
        notFound();
    }
}
```

---

### 4. Chat Sidebar (`components/chat/chat-sidebar.tsx`)

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Conversation = {
    id: number;
    title: string;
    updatedAt: Date;
};

type ChatSidebarProps = {
    userId: number;
};

export function ChatSidebar({ userId }: ChatSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const handleNewChat = async () => {
        try {
            const res = await fetch("/api/conversations", { method: "POST" });
            if (res.ok) {
                const conversation = await res.json();
                router.push(`/chat/${conversation.id}`);
                fetchConversations();
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchConversations();
                // If we deleted the current conversation, go to /chat
                if (pathname === `/chat/${id}`) {
                    router.push("/chat");
                }
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const currentConversationId = pathname.match(/\/chat\/(\d+)/)?.[1];

    return (
        <aside className="w-64 border-r bg-muted/30 flex flex-col h-full">
            <div className="p-4 border-b">
                <Button onClick={handleNewChat} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No conversations yet</div>
                    ) : (
                        conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.id}`}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group",
                                    currentConversationId === conv.id.toString()
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                )}
                            >
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                <span className="truncate flex-1">{conv.title}</span>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={(e) => handleDelete(conv.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Link>
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
```

---

### 5. Chat Interface (`components/chat/chat-interface.tsx`)

```typescript
"use client";

import { useState, useEffect, Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
    PromptInputSubmit,
    type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Tool } from "@/components/ai-elements/tool";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Paperclip } from "lucide-react";

type DBMessage = {
    id: number;
    conversationId: number;
    role: string;
    content: string;
    toolCalls: unknown;
    createdAt: Date;
};

type ChatInterfaceProps = {
    conversationId: number;
    initialMessages: DBMessage[];
    conversationTitle: string;
};

export function ChatInterface({
    conversationId,
    initialMessages,
    conversationTitle,
}: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [uploadOpen, setUploadOpen] = useState(false);

    // Convert DB messages to UI format
    const formattedInitialMessages = initialMessages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
    }));

    const { messages, sendMessage, status } = useChat({
        api: "/api/chat",
        body: { conversationId },
        initialMessages: formattedInitialMessages,
    });

    const handleSubmit = (message: PromptInputMessage) => {
        if (!message.text?.trim()) return;
        sendMessage({ text: message.text });
        setInput("");
    };

    const handleUploadComplete = () => {
        setUploadOpen(false);
    };

    return (
        <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold truncate max-w-md">
                    {conversationTitle}
                </h1>
            </div>

            {/* Messages */}
            <Conversation className="flex-1 min-h-0">
                <ConversationContent>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
                            <p className="text-muted-foreground mb-4">
                                Ask anything or upload documents to chat with
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setUploadOpen(true)}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Upload Document
                            </Button>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id}>
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                        case "text":
                                            return (
                                                <Fragment key={`${message.id}-${i}`}>
                                                    <Message from={message.role}>
                                                        <MessageContent>
                                                            <MessageResponse>
                                                                {part.text}
                                                            </MessageResponse>
                                                        </MessageContent>
                                                    </Message>
                                                </Fragment>
                                            );
                                        case "tool-invocation":
                                            return (
                                                <Tool
                                                    key={`${message.id}-${i}`}
                                                    name={part.toolInvocation.toolName}
                                                    state={part.toolInvocation.state}
                                                    input={part.toolInvocation.args}
                                                    output={part.toolInvocation.result}
                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        ))
                    )}
                    {(status === "submitted" || status === "streaming") && <Loader />}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            {/* Input */}
            <PromptInput onSubmit={handleSubmit} className="mt-4">
                <PromptInputTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <PromptInputFooter>
                    <PromptInputTools>
                        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Document</DialogTitle>
                                </DialogHeader>
                                <FileUpload
                                    conversationId={conversationId}
                                    onUploadComplete={handleUploadComplete}
                                />
                            </DialogContent>
                        </Dialog>
                    </PromptInputTools>
                    <PromptInputSubmit status={status} />
                </PromptInputFooter>
            </PromptInput>
        </div>
    );
}
```

---

### 6. Conversation API - Individual (`app/api/conversations/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    getConversation,
    updateConversation,
    deleteConversation,
} from "@/lib/services/conversations";

type Props = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversationId = parseInt(id);
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const conversation = await getConversation(conversationId, session.user.id);
        if (!conversation) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversationId = parseInt(id);
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const { title } = await request.json();
        const updated = await updateConversation(conversationId, session.user.id, title);

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating conversation:", error);
        return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversationId = parseInt(id);
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        await deleteConversation(conversationId, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
}
```

---

### 7. Messages API (`app/api/conversations/[id]/messages/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMessages } from "@/lib/services/messages";
import { getConversation } from "@/lib/services/conversations";

type Props = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversationId = parseInt(id);
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Verify user owns the conversation
        const conversation = await getConversation(conversationId, session.user.id);
        if (!conversation) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const messages = await getMessages(conversationId);

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}
```

---

## 🔧 Required shadcn Components

Make sure these are installed:

```bash
npx shadcn@latest add scroll-area dropdown-menu dialog
```

---

## 🚀 Implementation Steps

1. **Create directory structure:**
   ```bash
   mkdir -p app/chat/[conversationId]
   mkdir -p app/api/conversations/[id]/messages
   mkdir -p components/chat
   ```

2. **Create all new files** as listed above

3. **Update existing files:**
   - Modify `app/api/chat/route.ts`
   - Replace `app/chat/page.tsx`

4. **Install any missing shadcn components:**
   ```bash
   npx shadcn@latest add scroll-area dropdown-menu dialog
   ```

5. **Test the flow:**
   - Go to `/chat` → should create and redirect to new conversation
   - Send a message → should appear and persist
   - Refresh page → messages should load from DB
   - Create another conversation → previous should appear in sidebar
   - Delete conversation → should remove from sidebar

---

## ✅ Verification Checklist

- [ ] `/chat` creates new conversation and redirects
- [ ] Messages persist after page refresh
- [ ] Conversation list shows in sidebar
- [ ] Can switch between conversations
- [ ] Can delete conversations
- [ ] File upload dialog works
- [ ] Tool calls (searchKnowledgeBase) display properly
- [ ] Streaming responses work
- [ ] Unauthorized users redirected to sign-in
- [ ] Conversation title auto-generates from first message

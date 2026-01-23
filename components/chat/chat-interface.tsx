"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { Paperclip, ArrowUp, Square, Search, CheckCircle, MessageSquare, Loader2 } from "lucide-react";

type Message = {
    id: number;
    role: string;
    content: string;
    createdAt: string | null;
};

type ChatInterfaceProps = {
    conversationId: number;
    initialMessages: Message[];
    conversationTitle: string;
};

export function ChatInterface({ conversationId, initialMessages, conversationTitle }: ChatInterfaceProps) {
    const [input, setInput] = useState("");

    const initialMessagesMapped = initialMessages.map(m => ({
        id: m.id.toString(),
        role: m.role as "user" | "assistant",
        content: m.content,
        parts: [{ type: 'text' as const, text: m.content }],
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
    }));

    const { messages, sendMessage, status, setMessages } = useChat({
        api: "/api/chat",
        id: conversationId.toString(),
        body: { conversationId },
        initialMessages: initialMessagesMapped,
    });

    useEffect(() => {
        if (messages.length === 0 && initialMessages.length > 0) {
            setMessages(initialMessagesMapped);
        }
    }, [initialMessages, setMessages]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input }, { body: { conversationId } });
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-landing-background via-landing-background to-landing-background-lighter overflow-hidden h-full">
            {/* Header */}
            <header className="h-14 border-b border-landing-border/50 flex items-center justify-between px-6 bg-landing-text-main/[0.02] backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-landing-primary animate-pulse" />
                        <h1 className="text-sm font-semibold text-landing-text-main tracking-tight">
                            {conversationTitle}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-landing-text-main/40 bg-landing-text-main/5 px-2 py-1 rounded-full">
                        Gemini 2.0
                    </span>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="size-12 bg-landing-text-main rounded-lg flex items-center justify-center mb-4 shadow-md">
                                    <MessageSquare className="size-6 text-landing-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-landing-text-main mb-1">
                                    Start the conversation
                                </h2>
                                <p className="text-sm text-landing-text-muted">
                                    Send a message to begin chatting.
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id}>
                                {message.parts?.map((part, i) => {
                                    if (part.type === "text") {
                                        return message.role === "user" ? (
                                            <UserMessage key={`${message.id}-${i}`} text={part.text} />
                                        ) : (
                                            <AssistantMessage key={`${message.id}-${i}`} text={part.text} />
                                        );
                                    }
                                    if (part.type === "tool-invocation") {
                                        return (
                                            <ToolCall
                                                key={`${message.id}-${i}`}
                                                // @ts-ignore
                                                name={part.toolInvocation?.toolName || "Tool"}
                                                // @ts-ignore
                                                state={part.toolInvocation?.state || "call"}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        ))
                    )}

                    {/* Loading State */}
                    {(status === "submitted" || status === "streaming") && (
                        <LoadingIndicator />
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="px-6 pb-6 pt-4 shrink-0">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
                    <div className="relative bg-landing-surface border border-landing-border rounded-2xl flex items-end p-2 min-h-[56px] shadow-lg shadow-landing-text-main/5 focus-within:shadow-xl focus-within:shadow-landing-text-main/10 focus-within:border-landing-text-main/30 transition-all">
                        <button
                            type="button"
                            className="p-3 text-landing-text-main/40 hover:text-landing-primary transition-colors rounded-lg hover:bg-landing-text-main/5"
                        >
                            <Paperclip className="size-5" />
                        </button>

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-landing-text-main placeholder-landing-text-main/40 py-3 px-2 resize-none max-h-36 custom-scrollbar font-medium text-[14px]"
                            placeholder="Message Swiss Army AI..."
                            rows={1}
                        />

                        <div className="flex items-center gap-1.5 pr-1 pb-1">
                            <button
                                type="submit"
                                disabled={!input.trim() || status === "streaming"}
                                className={cn(
                                    "size-10 bg-landing-primary hover:bg-landing-primary-dark text-white rounded-xl flex items-center justify-center transition-all",
                                    (!input.trim() || status === "streaming") && "opacity-40 cursor-not-allowed"
                                )}
                            >
                                {status === "streaming" ? (
                                    <Square className="size-4" />
                                ) : (
                                    <ArrowUp className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-landing-text-main/30 mt-3 font-medium">
                        Swiss Army AI can make mistakes. Verify important information.
                    </p>
                </form>
            </div>
        </div>
    );
}

function UserMessage({ text }: { text: string }) {
    return (
        <div className="flex justify-end mb-4">
            <div className="max-w-[80%] bg-landing-surface px-3 py-2 rounded-lg text-landing-text-main shadow-blocky border border-landing-border">
                <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

function AssistantMessage({ text }: { text: string }) {
    return (
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0 bg-landing-text-main rounded-md flex items-center justify-center mt-0.5 shadow-sm">
                <svg className="size-3.5 text-landing-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                    <path d="M18 6h.01" />
                    <path d="M6 18h.01" />
                    <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                    <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                </svg>
            </div>
            <div className="max-w-[80%] bg-landing-surface/50 px-3 py-2 rounded-lg border border-landing-border shadow-blocky">
                <p className="text-[14px] leading-relaxed text-landing-text-main whitespace-pre-wrap font-body font-medium">{text}</p>
            </div>
        </div>
    );
}

function ToolCall({ name, state }: { name: string; state: string }) {
    const isLoading = state === "partial-call" || state === "call";

    return (
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0" />
            <div className="flex-1">
                <div className="border border-landing-border rounded-lg overflow-hidden bg-landing-surface/40 relative">
                    {isLoading && <div className="shimmer absolute inset-0 pointer-events-none" />}
                    <div className="px-4 py-2.5 flex items-center gap-3 relative z-10">
                        {isLoading ? (
                            <Search className="size-4 text-landing-primary" />
                        ) : (
                            <CheckCircle className="size-4 text-landing-primary" />
                        )}
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-landing-text-main/70">
                            {isLoading ? `Searching knowledge base...` : `Found relevant documents`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoadingIndicator() {
    return (
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0 bg-landing-text-main rounded-md flex items-center justify-center mt-0.5 shadow-sm">
                <svg className="size-3.5 text-landing-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                    <path d="M18 6h.01" />
                    <path d="M6 18h.01" />
                    <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                    <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                </svg>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 text-landing-text-muted">
                    <div className="flex gap-1">
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] font-semibold">Thinking...</span>
                </div>
            </div>
        </div>
    );
}

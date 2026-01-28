# Phase 2: Knowledge Base (RAG) & Tools - Final Implementation Guide

This document captures the **final, approved plan** for implementing the Knowledge Base using our **Single-Table Embeddings Architecture**.

**Strategy**:
*   **One Table**: All embeddings (Memories & Documents) live in `embeddings`.
*   **Virtual Partition**:
    *   **Local Context**: Query by `conversationId` (for pinned memories).
    *   **Global Context**: Query by `userId` (for uploaded documents).

---

## 🛠️ Step 1: Backend Utilities (The Foundation)

We need utilities to parse files and perform secure searches.

### 1.1 [NEW] `lib/file-processors.ts`
**Goal**: Cleanly handle PDF and Text parsing.

```typescript
import pdf from 'pdf-parse';

export async function parseFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (file.type === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    }

    if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${file.type}`);
}
```

### 1.2 [MODIFY] `lib/search.ts`
**Goal**: Implement strict security (User Isolation) in search.

```typescript
import { cosineDistance, desc, gt, sql, and, eq } from "drizzle-orm";
import { db } from "./db-config";
import { embeddings } from "./db-schema";
import { generateEmbedding } from '@/lib/embeddings'

export async function searchDocuments(
    query: string, 
    userId: string, // REQUIRED for security
    limit: number = 5, 
    threshold: number = 0.5
) {
    const embedding = await generateEmbedding(query);

    // 1 - cosineDistance = cosine similarity
    const similarity = sql<number>`1-(${cosineDistance(embeddings.embedding, embedding)})`;

    const similarDocuments = await db.select({
        id: embeddings.id,
        content: embeddings.content,
        metadata: embeddings.metadata,
        similarity,
    }).from(embeddings)
        .where(
            and(
                eq(embeddings.userId, userId), // Strict User Isolation
                gt(similarity, threshold)
            )
        )
        .orderBy(desc(similarity))
        .limit(limit);

    return similarDocuments;
}
```

---

## ⚡ Step 2: Server Actions (The Glue)

We need a Server Action to handle the file upload process from the client.

### 2.1 [NEW] `app/chat/actions.ts`
**Goal**: Receive File -> Parse -> Chunk -> Embed -> Store.

```typescript
'use server';

import { db } from '@/lib/db-config';
import { embeddings as embeddingsTable } from '@/lib/db-schema';
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { parseFile } from "@/lib/file-processors";

export type ProcessResult = {
    success: boolean;
    message?: string;
    error?: string;
    chunksCreated?: number;
};

export async function processProcessedFile(
    formData: FormData, 
    conversationId: number // Link document to this specific conversation context
): Promise<ProcessResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "No file provided" };

        // 1. Parse content
        const text = await parseFile(file);
        
        if (!text || text.trim().length === 0) {
            return { success: false, error: "No text content found" };
        }

        // 2. Chunk & Embed
        const chunks = await chunkContent(text);
        const embeddingVectors = await generateEmbeddings(chunks);

        // 3. Save to DB
        const records = chunks.map((chunk, index) => ({
            userId: session.user.id,
            conversationId: conversationId,
            content: chunk,
            embedding: embeddingVectors[index],
            sourceType: 'document', // Mark as document
            sourceId: file.name,
            metadata: {
                filename: file.name,
                fileType: file.type,
                uploadedAt: new Date().toISOString()
            }
        }));

        await db.insert(embeddingsTable).values(records);

        return {
            success: true,
            message: `Processed ${file.name}`,
            chunksCreated: records.length,
        };

    } catch (error) {
        console.error("Processing error:", error);
        return { success: false, error: "Failed to process file" };
    }
}
```

---

## 🎨 Step 3: Minimal UI Updates

Connect the existing "Paperclip" button to the new action.

### 3.1 [MODIFY] `components/chat/chat-interface.tsx`
**Goal**: Add hidden file input and connect it to the Paperclip icon.

```typescript
// Imports
import { useRef } from "react";
import { processProcessedFile } from "@/app/chat/actions";

// ... Inside ChatInterface component ...
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await processProcessedFile(formData, conversationId);
            
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

// ... JSX Updates ...

    {/* Add the hidden input */}
    <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelect}
        accept=".pdf,.txt,.md"
    />

    {/* Update the Paperclip button to trigger the input */}
    <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading} // Disable while uploading
        className="p-3 text-landing-text-main/40 hover:text-landing-primary transition-colors rounded-lg hover:bg-landing-text-main/5"
    >
        {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
        ) : (
            <Paperclip className="size-5" />
        )}
    </button>
```

---

## 🧠 Step 4: The Brain (Chat API)

Enable the AI to actually USE this data.

### 4.1 [MODIFY] `app/api/chat/route.ts`
**Goal**: Uncomment and fix the `search_knowledge_base` tool.

**Crucial Fix**:
Pass `session.user.id` to `searchDocuments` to ensure the AI only searches *your* data.

```typescript
    search_knowledge_base: tool({
        description: "Search the knowledge base for relevant information...",
        parameters: z.object({
            query: z.string().describe("The search query..."),
        }),
        execute: async ({ query }: { query: string }) => {
            // SECURITY: Pass session.user.id
            const results = await searchDocuments(query, session.user.id);
            // ... format results ...
        }
    }),
```

---

---

## 📍 Step 5: Pin to Memory (Backend Implementation)

**Goal**: Create the API that actually processes the "Pin" request.

### 5.1 [NEW] `app/api/chat/pin/route.ts`

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { auth } from "@/lib/auth"; // Your auth helper
import { headers } from "next/headers";
import { db } from "@/lib/db-config"; // Your db instance
import { embeddings } from "@/lib/db-schema"; // Your schema
import { getMessages } from "@/lib/services/messages"; // Helper to get messages
import { generateEmbedding } from "@/lib/embeddings"; // Your embedding helper

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new Response("Unauthorized", { status: 401 });

        const { conversationId } = await req.json();

        // 1. Fetch Conversation History
        const messages = await getMessages(conversationId);
        if (messages.length < 2) {
             return Response.json({ skipped: true, message: "Conversation too short" });
        }

        // 2. Summarize (Strip Fluff)
        const { text: summary } = await generateText({
            model: google("gemini-1.5-flash"), // Worker Model
            system: "You are an expert archivist. Summarize this conversation into a concise set of factual notes. Remove all greetings, pleasantries, and fluff. Keep only the core information code snippets, and decisions. If there is no useful information, return 'NO_MEMORY_VALUE'.",
            prompt: JSON.stringify(messages),
        });

        if (summary.includes("NO_MEMORY_VALUE")) {
             return Response.json({ skipped: true, message: "No useful content" });
        }

        // 3. Generate Embedding for the Summary
        const vector = await generateEmbedding(summary);

        // 4. Store in Embeddings Table
        await db.insert(embeddings).values({
            userId: session.user.id,
            conversationId: conversationId,
            content: summary,
            embedding: vector,
            sourceType: "memory", // Crucial: Mark as memory
            sourceId: `summary-${conversationId}`,
            metadata: {
                pinnedAt: new Date().toISOString(),
                summaryVersion: "v1"
            }
        });

        return Response.json({ success: true, summary });

    } catch (error) {
        console.error("Pin error:", error);
        return new Response("Internal Error", { status: 500 });
    }
}
```

---

## 🧹 Step 6: Cleanup (Remove Old Routes)

**Goal**: Remove the legacy upload page as we have moved to an inline chat action.

### 6.1 [DELETE] `app/upload/`
*   Delete the entire directory `d:\NextJs Projects\The Swiss Army Knife Project\the-sakai-proj\app\upload` (including `page.tsx`, `layout.tsx`, etc).
*   This route is no longer needed as file upload is now handled directly inside the chat interface via the paperclip icon.

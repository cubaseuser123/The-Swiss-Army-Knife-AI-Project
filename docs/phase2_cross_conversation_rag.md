# Phase 2: Cross-Conversation RAG & Multi-File Support

## 📦 Installations

```bash
# Multi-file processing libraries
npm install mammoth docx-parser xlsx csv-parser markdown-it

# Audio processing (for Gemini audio input)
npm install @google/generative-ai
```

---

## 📁 File Directory Structure

```
the-sakai-proj/
├── lib/
│   ├── embeddings.ts              [MODIFY]
│   ├── search.ts                  [MODIFY]
│   ├── file-processors/           [NEW DIRECTORY]
│   │   ├── index.ts               [NEW]
│   │   ├── pdf.ts                 [NEW]
│   │   ├── docx.ts                [NEW]
│   │   ├── xlsx.ts                [NEW]
│   │   ├── csv.ts                 [NEW]
│   │   ├── markdown.ts            [NEW]
│   │   ├── text.ts                [NEW]
│   │   └── audio.ts               [NEW]
│   ├── services/
│   │   └── embeddings.ts          [NEW]
├── app/
│   ├── upload/
│   │   ├── page.tsx               [MODIFY]
│   │   └── actions.ts             [MODIFY]
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts           [MODIFY]
│   │   └── embeddings/
│   │       └── route.ts           [NEW]
├── components/
│   └── file-upload.tsx            [NEW]
```

---

## ✏️ Modifications

### 1. Embeddings Module (`lib/embeddings.ts`)

**BEFORE:**
```typescript
import { embed, embedMany } from 'ai';

export async function generateEmbedding(text: string) {
    const input = text.replace("\n", " ");

    const { embedding } = await embed({
        model: 'google/text-embedding-005',
        value: input,
    });

    return embedding;
}

export async function generateEmbeddings(texts: string[]) {
    const inputs = texts.map((text) => text.replace("\n", " "));

    const { embeddings } = await embedMany({
        model: 'google/text-embedding-005',
        values: inputs,
    });

    return embeddings;
}
```

**AFTER:**
```typescript
import { embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const embeddingModel = google.textEmbeddingModel('text-embedding-004');

export async function generateEmbedding(text: string): Promise<number[]> {
    const input = text.replace(/\n+/g, " ").trim();
    
    if (!input) {
        throw new Error("Cannot generate embedding for empty text");
    }

    const { embedding } = await embed({
        model: embeddingModel,
        value: input,
    });

    return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const inputs = texts
        .map((text) => text.replace(/\n+/g, " ").trim())
        .filter((text) => text.length > 0);

    if (inputs.length === 0) {
        return [];
    }

    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: inputs,
    });

    return embeddings;
}
```

---

### 2. Search Module (`lib/search.ts`)

**BEFORE:**
```typescript
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "./db-config";
import { embeddings } from "./db-schema";
import { generateEmbedding } from '@/lib/embeddings'

export async function searchDocuments(
    query: string, limit: number = 5, threshold: number = 0.5
) {
    const embedding = await generateEmbedding(query);

    const similarity = sql<number>`1-(${cosineDistance(embeddings.embedding, embedding)})`;

    const similarDocuments = await db.select({
        id: embeddings.id,
        content: embeddings.content,
        similarity,
    }).from(embeddings)
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

    return similarDocuments;
}
```

**AFTER:**
```typescript
import { cosineDistance, desc, gt, sql, eq, and, inArray } from "drizzle-orm";
import { db } from "./db-config";
import { embeddings, conversations } from "./db-schema";
import { generateEmbedding } from '@/lib/embeddings';

export type SearchResult = {
    id: number;
    content: string;
    similarity: number;
    sourceType: string;
    sourceId: string;
    conversationId: number | null;
    conversationTitle: string | null;
    metadata: Record<string, unknown> | null;
};

export type SearchOptions = {
    limit?: number;
    threshold?: number;
    sourceTypes?: string[];      // Filter by 'document' | 'message' | 'audio'
    conversationIds?: number[];  // Filter to specific conversations
    includeCurrentConversation?: boolean;
    currentConversationId?: number;
};

/**
 * Search across all user embeddings with cross-conversation support
 */
export async function searchDocuments(
    userId: number,
    query: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
    const {
        limit = 10,
        threshold = 0.4,
        sourceTypes,
        conversationIds,
        includeCurrentConversation = true,
        currentConversationId,
    } = options;

    const queryEmbedding = await generateEmbedding(query);
    const similarity = sql<number>`1-(${cosineDistance(embeddings.embedding, queryEmbedding)})`;

    // Build where conditions
    const conditions = [
        eq(embeddings.userId, userId),
        gt(similarity, threshold),
    ];

    // Filter by source types if specified
    if (sourceTypes && sourceTypes.length > 0) {
        conditions.push(inArray(embeddings.sourceType, sourceTypes));
    }

    // Filter by conversation IDs if specified
    if (conversationIds && conversationIds.length > 0) {
        conditions.push(inArray(embeddings.conversationId, conversationIds));
    }

    // Exclude current conversation if specified
    if (!includeCurrentConversation && currentConversationId) {
        conditions.push(sql`${embeddings.conversationId} != ${currentConversationId}`);
    }

    const results = await db
        .select({
            id: embeddings.id,
            content: embeddings.content,
            similarity,
            sourceType: embeddings.sourceType,
            sourceId: embeddings.sourceId,
            conversationId: embeddings.conversationId,
            conversationTitle: conversations.title,
            metadata: embeddings.metadata,
        })
        .from(embeddings)
        .leftJoin(conversations, eq(embeddings.conversationId, conversations.id))
        .where(and(...conditions))
        .orderBy(desc(similarity))
        .limit(limit);

    return results;
}

/**
 * Search only within a specific conversation
 */
export async function searchInConversation(
    userId: number,
    conversationId: number,
    query: string,
    limit: number = 5
): Promise<SearchResult[]> {
    return searchDocuments(userId, query, {
        limit,
        conversationIds: [conversationId],
    });
}

/**
 * Search across all conversations except the current one
 * Useful for finding related context from past conversations
 */
export async function searchAcrossConversations(
    userId: number,
    query: string,
    excludeConversationId?: number,
    limit: number = 10
): Promise<SearchResult[]> {
    return searchDocuments(userId, query, {
        limit,
        includeCurrentConversation: false,
        currentConversationId: excludeConversationId,
    });
}
```

---

### 3. Upload Actions (`app/upload/actions.ts`)

**BEFORE:**
```typescript
'use server';

import { PDFParse } from 'pdf-parse';
import { db } from '@/lib/db-config';
import { embeddings as embeddingsTable } from '@/lib/db-schema';
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";

export async function processPdfFile(formData: FormData) {
    // ... PDF-only processing
}
```

**AFTER:**
```typescript
'use server';

import { db } from '@/lib/db-config';
import { embeddings as embeddingsTable } from '@/lib/db-schema';
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";
import { processFile, getSupportedExtensions } from "@/lib/file-processors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ProcessResult = {
    success: boolean;
    message?: string;
    error?: string;
    chunksCreated?: number;
};

export async function processUploadedFile(formData: FormData): Promise<ProcessResult> {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const conversationId = formData.get("conversationId") as string | null;
        
        // Process file based on type
        const { text, metadata } = await processFile(file);

        if (!text || text.trim().length === 0) {
            return { success: false, error: "No text content found in file" };
        }

        // Chunk the content
        const chunks = await chunkContent(text);
        const embeddingVectors = await generateEmbeddings(chunks);

        // Create embedding records with user context
        const records = chunks.map((chunk, index) => ({
            userId: session.user.id,
            content: chunk,
            embedding: embeddingVectors[index],
            sourceType: 'document',
            sourceId: file.name,
            conversationId: conversationId ? parseInt(conversationId) : null,
            metadata: {
                ...metadata,
                filename: file.name,
                fileType: file.type,
                uploadedAt: new Date().toISOString(),
            },
        }));

        await db.insert(embeddingsTable).values(records);

        return {
            success: true,
            message: `Processed ${file.name}: ${records.length} searchable chunks created`,
            chunksCreated: records.length,
        };
    } catch (error) {
        console.error("File processing error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process file",
        };
    }
}

export async function getSupportedFileTypes(): Promise<string[]> {
    return getSupportedExtensions();
}
```

---

### 4. Chat API Route (`app/api/chat/route.ts`)

Add cross-conversation RAG context to the chat:

**Add to existing route:**
```typescript
import { searchDocuments, searchAcrossConversations } from "@/lib/search";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Inside your POST handler, before calling streamText:

const session = await auth.api.getSession({
    headers: await headers(),
});

if (!session) {
    return new Response("Unauthorized", { status: 401 });
}

// Search for relevant context across all user's data
const relevantDocs = await searchDocuments(session.user.id, lastUserMessage, {
    limit: 10,
    threshold: 0.4,
});

// Build context string
const ragContext = relevantDocs.length > 0
    ? `\n\nRelevant context from your documents and past conversations:\n${relevantDocs
        .map((doc, i) => `[${i + 1}] (${doc.sourceType}${doc.conversationTitle ? ` - ${doc.conversationTitle}` : ''}): ${doc.content}`)
        .join("\n\n")}`
    : "";

// Prepend context to system message
const systemWithContext = `${baseSystemMessage}${ragContext}`;
```

---

## ✨ New Code

### 1. File Processor Index (`lib/file-processors/index.ts`)

```typescript
import { processPdf } from './pdf';
import { processDocx } from './docx';
import { processXlsx } from './xlsx';
import { processCsv } from './csv';
import { processMarkdown } from './markdown';
import { processText } from './text';
import { processAudio } from './audio';

export type ProcessedFile = {
    text: string;
    metadata: Record<string, unknown>;
};

type FileProcessor = (file: File) => Promise<ProcessedFile>;

const processors: Record<string, FileProcessor> = {
    // PDF
    'application/pdf': processPdf,
    
    // Word Documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': processDocx,
    'application/msword': processDocx,
    
    // Excel
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': processXlsx,
    'application/vnd.ms-excel': processXlsx,
    
    // CSV
    'text/csv': processCsv,
    
    // Markdown
    'text/markdown': processMarkdown,
    
    // Plain text
    'text/plain': processText,
    
    // Audio (for transcription)
    'audio/mpeg': processAudio,
    'audio/wav': processAudio,
    'audio/webm': processAudio,
    'audio/mp4': processAudio,
};

const extensionMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
    '.m4a': 'audio/mp4',
};

export async function processFile(file: File): Promise<ProcessedFile> {
    // Try to get processor by MIME type first
    let processor = processors[file.type];
    
    // Fall back to extension-based detection
    if (!processor) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeType = extensionMap[ext];
        if (mimeType) {
            processor = processors[mimeType];
        }
    }
    
    if (!processor) {
        throw new Error(`Unsupported file type: ${file.type || file.name}`);
    }
    
    return processor(file);
}

export function getSupportedExtensions(): string[] {
    return Object.keys(extensionMap).map(ext => ext.slice(1));
}

export function isSupported(filename: string): boolean {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return ext in extensionMap;
}
```

---

### 2. PDF Processor (`lib/file-processors/pdf.ts`)

```typescript
import { PDFParse } from 'pdf-parse';
import type { ProcessedFile } from './index';

export async function processPdf(file: File): Promise<ProcessedFile> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();

    return {
        text: data.text || '',
        metadata: {
            pageCount: data.numPages || 0,
            fileType: 'pdf',
        },
    };
}
```

---

### 3. DOCX Processor (`lib/file-processors/docx.ts`)

```typescript
import mammoth from 'mammoth';
import type { ProcessedFile } from './index';

export async function processDocx(file: File): Promise<ProcessedFile> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const result = await mammoth.extractRawText({ buffer });
    
    return {
        text: result.value,
        metadata: {
            fileType: 'docx',
            warnings: result.messages.filter(m => m.type === 'warning').map(m => m.message),
        },
    };
}
```

---

### 4. Excel Processor (`lib/file-processors/xlsx.ts`)

```typescript
import * as XLSX from 'xlsx';
import type { ProcessedFile } from './index';

export async function processXlsx(file: File): Promise<ProcessedFile> {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    
    const textParts: string[] = [];
    const sheetNames: string[] = [];
    
    for (const sheetName of workbook.SheetNames) {
        sheetNames.push(sheetName);
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to CSV-like text
        const csv = XLSX.utils.sheet_to_csv(sheet);
        textParts.push(`## Sheet: ${sheetName}\n${csv}`);
    }
    
    return {
        text: textParts.join('\n\n'),
        metadata: {
            fileType: 'xlsx',
            sheetCount: workbook.SheetNames.length,
            sheetNames,
        },
    };
}
```

---

### 5. CSV Processor (`lib/file-processors/csv.ts`)

```typescript
import type { ProcessedFile } from './index';

export async function processCsv(file: File): Promise<ProcessedFile> {
    const text = await file.text();
    
    // Count rows and columns for metadata
    const lines = text.split('\n').filter(line => line.trim());
    const columnCount = lines[0]?.split(',').length || 0;
    
    return {
        text,
        metadata: {
            fileType: 'csv',
            rowCount: lines.length,
            columnCount,
        },
    };
}
```

---

### 6. Markdown Processor (`lib/file-processors/markdown.ts`)

```typescript
import MarkdownIt from 'markdown-it';
import type { ProcessedFile } from './index';

const md = new MarkdownIt();

export async function processMarkdown(file: File): Promise<ProcessedFile> {
    const text = await file.text();
    
    // Extract plain text from markdown (strip formatting)
    const html = md.render(text);
    const plainText = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Count headers for structure metadata
    const headers = text.match(/^#{1,6}\s.+$/gm) || [];
    
    return {
        text: plainText,
        metadata: {
            fileType: 'markdown',
            rawMarkdown: text,
            headerCount: headers.length,
        },
    };
}
```

---

### 7. Text Processor (`lib/file-processors/text.ts`)

```typescript
import type { ProcessedFile } from './index';

export async function processText(file: File): Promise<ProcessedFile> {
    const text = await file.text();
    
    return {
        text,
        metadata: {
            fileType: 'text',
            charCount: text.length,
            lineCount: text.split('\n').length,
        },
    };
}
```

---

### 8. Audio Processor (`lib/file-processors/audio.ts`)

> [!IMPORTANT]
> Audio transcription uses Google Gemini's multimodal capabilities. Requires `GOOGLE_API_KEY` in environment.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProcessedFile } from './index';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function processAudio(file: File): Promise<ProcessedFile> {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    
    // Determine MIME type
    const mimeType = file.type || 'audio/mpeg';
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent([
        {
            inlineData: {
                mimeType,
                data: base64,
            },
        },
        {
            text: 'Please transcribe this audio file accurately. Include speaker labels if there are multiple speakers. Format the transcription with proper punctuation and paragraphs.',
        },
    ]);
    
    const transcription = result.response.text();
    
    return {
        text: transcription,
        metadata: {
            fileType: 'audio',
            originalMimeType: mimeType,
            transcribedAt: new Date().toISOString(),
            duration: null, // Could be extracted with additional libraries
        },
    };
}
```

---

### 9. Embeddings Service (`lib/services/embeddings.ts`)

```typescript
import { db } from "@/lib/db-config";
import { embeddings, type InsertEmbedding } from "@/lib/db-schema";
import { eq, and } from "drizzle-orm";
import { generateEmbedding, generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";

export async function createEmbeddingsFromText(
    userId: number,
    text: string,
    sourceType: 'document' | 'message' | 'audio',
    sourceId: string,
    conversationId?: number,
    metadata?: Record<string, unknown>
) {
    const chunks = await chunkContent(text);
    const vectors = await generateEmbeddings(chunks);
    
    const records: InsertEmbedding[] = chunks.map((chunk, index) => ({
        userId,
        content: chunk,
        embedding: vectors[index],
        sourceType,
        sourceId,
        conversationId: conversationId || null,
        metadata: metadata || null,
    }));
    
    await db.insert(embeddings).values(records);
    
    return records.length;
}

export async function createMessageEmbedding(
    userId: number,
    messageId: number,
    content: string,
    conversationId: number
) {
    const vector = await generateEmbedding(content);
    
    await db.insert(embeddings).values({
        userId,
        content,
        embedding: vector,
        sourceType: 'message',
        sourceId: messageId.toString(),
        conversationId,
        metadata: { messageId },
    });
}

export async function deleteEmbeddingsForSource(
    userId: number,
    sourceType: string,
    sourceId: string
) {
    await db.delete(embeddings).where(
        and(
            eq(embeddings.userId, userId),
            eq(embeddings.sourceType, sourceType),
            eq(embeddings.sourceId, sourceId)
        )
    );
}

export async function deleteEmbeddingsForConversation(
    userId: number,
    conversationId: number
) {
    await db.delete(embeddings).where(
        and(
            eq(embeddings.userId, userId),
            eq(embeddings.conversationId, conversationId)
        )
    );
}
```

---

### 10. Embeddings API Route (`app/api/embeddings/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { searchDocuments } from "@/lib/search";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { query, options = {} } = body;

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const results = await searchDocuments(session.user.id, query, options);

        return NextResponse.json({
            results,
            count: results.length,
        });
    } catch (error) {
        console.error("Embeddings search error:", error);
        return NextResponse.json(
            { error: "Failed to search embeddings" },
            { status: 500 }
        );
    }
}
```

---

### 11. File Upload Component (`components/file-upload.tsx`)

```typescript
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { processUploadedFile } from "@/app/upload/actions";

const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'md', 'txt', 'mp3', 'wav', 'webm', 'm4a'];

type FileUploadProps = {
    conversationId?: number;
    onUploadComplete?: (result: { filename: string; chunksCreated: number }) => void;
};

export function FileUpload({ conversationId, onUploadComplete }: FileUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = async (file: File) => {
        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (conversationId) {
                formData.append("conversationId", conversationId.toString());
            }

            const result = await processUploadedFile(formData);

            if (result.success) {
                setMessage({ type: "success", text: result.message || "File processed successfully" });
                onUploadComplete?.({ filename: file.name, chunksCreated: result.chunksCreated || 0 });
            } else {
                setMessage({ type: "error", text: result.error || "Failed to process file" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "An error occurred during upload" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const acceptTypes = SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).join(',');

    return (
        <div className="space-y-4">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Processing file...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-primary hover:underline">Click to upload</span>
                            <span className="text-muted-foreground"> or drag and drop</span>
                        </Label>
                        <Input
                            id="file-upload"
                            type="file"
                            accept={acceptTypes}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Supports: PDF, Word, Excel, CSV, Markdown, Text, Audio
                        </p>
                    </>
                )}
            </div>

            {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
```

---

## 🔧 Environment Variables

Ensure these are in your `.env.local`:

```bash
# Existing
NEON_DATABASE_URL=your_neon_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_API_KEY=your_google_api_key

# The GOOGLE_API_KEY is used for both:
# 1. Gemini LLM calls
# 2. Audio transcription
```

---

## 🚀 Migration Steps

1. **Install dependencies:**
   ```bash
   npm install mammoth xlsx markdown-it @google/generative-ai
   ```

2. **Create file processor directory and files:**
   - Create `lib/file-processors/` directory
   - Create all processor files as listed above

3. **Update existing files:**
   - Modify `lib/embeddings.ts`
   - Modify `lib/search.ts`
   - Modify `app/upload/actions.ts`
   - Update chat API to include RAG context

4. **Create new files:**
   - `lib/services/embeddings.ts`
   - `app/api/embeddings/route.ts`
   - `components/file-upload.tsx`

5. **Test file uploads:**
   - Upload a PDF
   - Upload a DOCX
   - Upload an Excel file
   - Upload an audio file (test transcription)

6. **Test cross-conversation search:**
   - Create multiple conversations
   - Upload documents to different conversations
   - Verify search returns results from all conversations

---

## ✅ Verification Checklist

- [ ] All file processor dependencies installed
- [ ] PDF upload works
- [ ] DOCX upload works
- [ ] Excel upload works
- [ ] CSV upload works
- [ ] Markdown upload works
- [ ] Audio transcription works
- [ ] Files are associated with correct user
- [ ] Cross-conversation search returns results
- [ ] Chat includes RAG context from all sources
- [ ] Search filters by source type work
- [ ] Search filters by conversation work

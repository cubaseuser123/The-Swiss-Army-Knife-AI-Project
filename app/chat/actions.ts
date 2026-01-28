'use server';

import { PDFParse } from 'pdf-parse';
import { db } from '@/lib/db-config';
import { embeddings as embeddingsTable } from '@/lib/db-schema';
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ProcessResult = {
    success: boolean;
    message?: string;
    error?: string;
    chunksCreated?: number;
};

export async function processProcessedFile(formData: FormData, conversationId: number): Promise<ProcessResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get("file") as File;

        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();

        if (!data.text || data.text.trim().length === 0) {
            return {
                success: false,
                error: "No text content found in the PDF",
            };
        }

        const chunks = await chunkContent(data.text);
        const embeddingVectors = await generateEmbeddings(chunks);

        if (chunks.length !== embeddingVectors.length) {
            throw new Error("Embedding generation failed to match chunk count");
        }

        const records = chunks.map((chunk, index) => {
            return {
                userId: session.user.id,
                conversationId: conversationId,
                content: chunk,
                embedding: embeddingVectors[index],
                sourceType: 'document',
                sourceId: file.name,
                metadata: {
                    filename: file.name,
                    fileType: file.type || 'application/pdf',
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        await db.insert(embeddingsTable).values(records);

        return {
            success: true,
            message: `Processed ${file.name}: ${records.length} chunks indexed.`,
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

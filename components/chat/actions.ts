'use server';

import { db } from '@/lib/db-config';
import { embeddings as embeddingsTable } from '@/lib/db-schema';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkContent } from '@/lib/chunking';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { parseFile } from '@/lib/file-processors';

export type ProcessResult = {
    success: boolean;
    message?: string;
    error?: string,
    chunksCreated?: number;
};

export async function processFile(formData: FormData, conversationId: number): Promise<ProcessResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'No file provided' };

        const text = await parseFile(file);

        if (!text || text.trim().length === 0) {
            return { success: false, error: 'No text content found' };
        }

        const chunks = await chunkContent(text);
        const embeddingVectors = await generateEmbeddings(chunks);

        const records = chunks.map((chunk, index) => ({
            userId: session.user.id,
            conversationId: conversationId,
            content: chunk,
            embedding: embeddingVectors[index],
            sourceType: 'document',
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
        console.error("Processing error", error);
        return { success: false, error: "Failed to process file" };
    }
}

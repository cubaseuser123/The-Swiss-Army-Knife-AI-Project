import { embed, embedMany } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export async function generateEmbedding(text: string) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input for embedding');
    }
    const input = text.replace(/\n/g, " ");

    try {
        const { embedding } = await embed({
            model: gateway.textEmbeddingModel('google/text-embedding-005'),
            value: input,
        });
        return embedding;
    } catch (error) {
        console.error("Embedding generation error:", error);
        throw error;
    }
}

export async function generateEmbeddings(texts: string[]) {
    const inputs = texts.map((text) => text.replace(/\n/g, " "));

    try {
        const { embeddings } = await embedMany({
            model: gateway.textEmbeddingModel('google/text-embedding-005'),
            values: inputs,
        });
        return embeddings;
    } catch (error) {
        console.error("Batch embedding generation error:", error);
        throw error;
    }
}


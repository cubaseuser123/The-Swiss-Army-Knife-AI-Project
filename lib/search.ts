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

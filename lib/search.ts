import { cosineDistance, desc, gt, sql, and, eq } from "drizzle-orm";
import { db } from "./db-config";
import { embeddings } from "./db-schema";
import { generateEmbedding } from '@/lib/embeddings'

export async function searchDocuments(
    query: string, userId: string, limit: number = 5, threshold: number = 0.3
) {
    console.log(`Searching for: "${query}" (userId: ${userId})`);

    const embedding = await generateEmbedding(query);

    const similarity = sql<number>`1-(${cosineDistance(embeddings.embedding, embedding)})`;

    const similarDocuments = await db.select({
        id: embeddings.id,
        content: embeddings.content,
        metadata: embeddings.metadata,
        similarity,
    }).from(embeddings)
        .where(and(
            eq(embeddings.userId, userId),
            gt(similarity, threshold)
        )
        )
        .orderBy(desc(similarity))
        .limit(limit);

    console.log(`Found ${similarDocuments.length} documents above threshold ${threshold}`);

    return similarDocuments;
}


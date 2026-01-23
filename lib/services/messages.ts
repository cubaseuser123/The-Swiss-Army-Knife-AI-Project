import { db } from "../db-config";
import { messages, type InsertMessage } from "../db-schema";
import { eq, desc } from "drizzle-orm";

export async function saveMessage(message: InsertMessage) {
    const [saved] = await db
        .insert(messages)
        .values(message)
        .returning();

    return saved;
}

export async function getMessages(conversationId: number) {
    return db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
}

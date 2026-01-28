import { db } from "@/lib/db-config";
import { conversations, messages, embeddings, type InsertConversation } from '@/lib/db-schema';
import { eq, desc, and } from 'drizzle-orm';

export async function createConversation(userId: string, title: string = 'New Chat') {
    const [conversation] = await db
        .insert(conversations)
        .values({ userId, title })
        .returning();

    return conversation;
}

export async function getConversations(userId: string) {
    return db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number, userId: string) {
    const [conversation] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

    return conversation;
}

export async function updateConversation(id: number, userId: string, title: string) {
    const [updated] = await db
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .returning();
    return updated;
}

export async function deleteConversation(id: number, userId: string) {
    const conversation = await getConversation(id, userId);

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // Delete embeddings first (foreign key constraint)
    await db.delete(embeddings).where(eq(embeddings.conversationId, id));

    // Delete messages
    await db.delete(messages).where(eq(messages.conversationId, id));

    // Delete conversation
    await db
        .delete(conversations)
        .where(eq(conversations.id, id));

    return conversation;
}


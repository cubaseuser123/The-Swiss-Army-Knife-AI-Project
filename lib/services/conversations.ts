import { db } from "@/lib/db-config";
import { conversations, type InsertConversation } from '@/lib/db-schema';
import { eq, desc } from 'drizzle-orm';

export async function createConversation(userId: number, title: string = 'New Chat') {
    const [conversation] = await db
        .insert(conversations)
        .values({ userId, title })
        .returning();

    return conversation;
}

export async function getConversations(userId: number) {
    return db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number, userId: number) {
    const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));

    if (conversation && conversation.userId !== userId) {
        throw new Error("Unauthorized");
    }

    return conversation;
}

export async function updateConversation(id: number, userId: number, title: string) {
    const [updated] = await db
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
    return updated;
}

export async function deleteConversation(id: number, userId: number) {
    const conversation = await getConversation(id, userId);

    await db
        .delete(conversations)
        .where(eq(conversations.id, id));

    return conversation;
}


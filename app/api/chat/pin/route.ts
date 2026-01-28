import { gateway } from "@ai-sdk/gateway";
import { generateText } from 'ai';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db-config';
import { embeddings } from '@/lib/db-schema';
import { getMessages } from '@/lib/services/messages';
import { generateEmbedding } from "@/lib/embeddings";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return new Response("Unauthorised", { status: 401 });

        const { conversationId } = await req.json();

        const messages = await getMessages(conversationId);
        if (messages.length < 2) {
            return Response.json({ skipped: true, message: "Conversation too short" });
        }

        const { text: summary } = await generateText({
            model: gateway('google/gemini-2.5-flash'),
            system: "You are an expert archivist. Summarize this conversation into a concise set of factual notes. Remove all greetings, pleasantries, and fluff. Keep only the core information code snippets, and decisions. If there is no useful information, return 'NO_MEMORY_VALUE.",
            prompt: JSON.stringify(messages),
        });

        if (summary.includes("NO_MEMORY_VALUE")) {
            return Response.json({ skipped: true, message: "No useful content" });
        }

        const vector = await generateEmbedding(summary);

        await db.insert(embeddings).values({
            userId: session.user.id,
            conversationId: conversationId,
            content: summary,
            embedding: vector,
            sourceType: "memory",
            sourceId: `summary-${conversationId}`,
            metadata: {
                pinnedAt: new Date().toISOString(),
                summaryVersion: "v1"
            }
        });
        return Response.json({ success: true, summary });
    } catch (error) {
        console.error("Pin to memory error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
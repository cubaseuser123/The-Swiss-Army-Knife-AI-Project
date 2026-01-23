import { gateway } from '@ai-sdk/gateway';
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs } from 'ai';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { saveMessage } from '@/lib/services/messages';

const tools = {
    // Tool commented out for debugging/stability until Phase 2
    /*
    search_knowledge_base: tool({
        description: "Search the knowledge base for the relevant information",
        parameters: z.object({
            query: z.string().describe("The search query to find relevant documents"),
        }),
        execute: async ({ query }: { query: string }) => {
            try {
                const results = await searchDocuments(query, 3, 0.5);
                if (results.length === 0) {
                    return "No relevant documents found";
                }
                const formattedResults = results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
                return formattedResults;
            } catch (error) {
                console.error("Search error:", error);
                return "Error searching the knowledge base";
            }
        }
    } as any)
    */
};

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
    try {
        // Authenticate user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { messages, conversationId }: { messages: ChatMessage[]; conversationId?: number } = body;

        // Get the last user message
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        // Save user message to DB if conversationId provided
        if (conversationId && lastUserMessage) {
            const textPart = lastUserMessage.parts?.find(p => p.type === 'text');
            if (textPart && 'text' in textPart) {
                try {
                    await saveMessage({
                        conversationId,
                        role: 'user',
                        content: textPart.text,
                    });
                } catch (e) {
                    console.error("Failed to save user message", e);
                }
            }
        }

        const result = streamText({
            model: gateway("google/gemini-2.0-flash"),
            messages: await convertToModelMessages(messages),
            tools,
            system: `You are a helpful assistant for Swiss Army Knife AI. When users ask questions, search the knowledge base for relevant information. Always search before answering if the question might relate to uploaded documents. Base your answers on the search results when available. Give concise answers that directly answer what the user is asking for.

The user's name is ${session.user.name || 'there'}.`,
            stopWhen: stepCountIs(3),
            onFinish: async ({ text }) => {
                // Save assistant response to DB
                if (conversationId && text) {
                    try {
                        await saveMessage({
                            conversationId,
                            role: 'assistant',
                            content: text,
                        });
                    } catch (e) {
                        console.error("Failed to save assistant message", e);
                    }
                }
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error streaming chat completion", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

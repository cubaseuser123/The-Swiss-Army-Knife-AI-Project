import { gateway } from '@ai-sdk/gateway';
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs, jsonSchema } from 'ai';
import { searchDocuments } from '@/lib/search';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { saveMessage } from '@/lib/services/messages';

// Define tools outside for type inference using jsonSchema for Gemini compatibility
const tools = {
    search_knowledge_base: tool({
        description: "Search the knowledge base for relevant information",
        inputSchema: jsonSchema<{ query: string }>({
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query' }
            },
            required: ['query']
        }),
        execute: async ({ query }: { query: string }) => {
            return "Search unavailable";
        },
    }),
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
            model: gateway("mistral/devstral-2"),
            messages: await convertToModelMessages(messages),
            tools: {
                search_knowledge_base: tool({
                    description: "Search the knowledge base for relevant information",
                    inputSchema: jsonSchema<{ query: string }>({
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The search query' }
                        },
                        required: ['query']
                    }),
                    execute: async (input: { query: string }) => {
                        try {
                            console.log("Tool input received:", JSON.stringify(input));
                            const query = input?.query;
                            if (!query || typeof query !== 'string') {
                                return "Invalid search query provided";
                            }
                            // SECURITY: Pass session.user.id
                            const results = await searchDocuments(query, session.user.id);
                            if (results.length === 0) {
                                return "No relevant documents found";
                            }
                            const formattedResults = results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
                            return formattedResults;
                        } catch (error) {
                            console.error("Search error:", error);
                            return "Error searching the knowledge base";
                        }
                    },
                }),
            },
            system: `You are a helpful assistant for Swiss Army Knife AI. You have access to a persistent memory system via the search_knowledge_base tool.

CRITICAL RULE: You MUST call search_knowledge_base FIRST before answering ANY of these types of questions:
1. Questions about the user's preferences (food, colors, hobbies, etc.)
2. Questions about facts the user may have shared (their job, location, interests)
3. Questions about uploaded documents or files
4. ANY question where the user implies prior shared information
5. Questions phrased as "what do I like", "what is my", "do you remember", etc.

DO NOT say "I don't have memory" or "I can't remember" before searching. ALWAYS search first.
If the search returns no results, THEN you may ask the user to tell you.

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

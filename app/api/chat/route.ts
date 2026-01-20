import { gateway } from '@ai-sdk/gateway'
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs } from 'ai';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';

const tools = {
    searchKonwledgeBase: tool({
        description: "Search the knowledge base for the relevant information",
        inputSchema: z.object({
            query: z.string().describe("The search query to find relevant documents"),
        }),
        execute: async ({ query }) => {
            try {
                const results = await searchDocuments(query, 3, 0.5);
                if (results.length === 0) {
                    return "No relevant documents found"
                }
                const formattedResults = results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
                return formattedResults;
            } catch (error) {
                console.error("Search error:", error);
                return "Error searching the knowledge base";
            }
        }
    })
}

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
    try {
        const { messages }: { messages: ChatMessage[] } = await req.json();

        const result = streamText({
            model: gateway("google/gemini-2.0-flash"),
            messages: await convertToModelMessages(messages),
            tools,
            system: "You are a helpful assistant that can answer questions based on the knowledge base. When users ask questions, search the knowledge base. When users ask questions, search the knowledge base for relevant information. Always search before answering if the question might relate to uploaded documents. Base your answers on the search results when available. Give concise answers that correctly answer what the user is asking for. Do not flood them with all the information from the search results.",
            stopWhen: stepCountIs(2),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error streaming chat completion stage:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
import { tool, jsonSchema, generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { searchDocuments } from '@/lib/search';

//1.Document Summarizer

export const summarize_document = tool({
    description: `Summarize a document or text. Use this when:
- User asks for a summary of uploaded content
- User wants key points from a document
- User asks "what is this document about?"
First search the knowledge base to find the document content, then summarize it.`,
    inputSchema: jsonSchema<{
        query: string;
        length?: 'brief' | 'detailed';
    }>({
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query to find the document to summarize (eg., filename or topic)'
            },
            length: {
                type: 'string',
                enum: ['brief', 'detailed'],
                description: 'Summary length : brief (2-3 sentences) or detailed (full paragraph)'
            }
        },
        required: ['query']
    }),
    execute: async ({ query, length = 'brief' }, { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            const results = await searchDocuments(query, userId, 10, 0.3);

            if (results.length === 0) {
                return "No documents found matching your query. Please upload a document first or try a different search term.";
            }
            const combinedContent = results.map(r => r.content).join('\n\n');
            const lengthInstruction = length === 'brief'
                ? 'Provide a 2-3 sentence summary.'
                : 'Provide a comprehensive summary with key points.';

            const { text: summary } = await generateText({
                model: gateway("mistral/devstral-2"),
                system: `You are a document summarization expert. ${lengthInstruction} Be concise and focus on the main ideas.`,
                prompt: `Summarize the following content:\n\n${combinedContent}`,
            });

            return `**Summary:**\n${summary}`;
        } catch (error) {
            console.error("Summarization error:", error);
            return "Error summarizing document. Please try again.";
        }
    }
});

//2. Document comparison

export const compare_documents = tool({
    description: `Compare two or more documents to find similarities and differences. Use this when:
- User asks to compare documents
- User wants to find differences between versions
- User asks "what changed between X and Y?"`,
    inputSchema: jsonSchema<{
        query1: string;
        query2: string;
        comparison_type?: 'differences' | 'similarities' | 'both';
    }>({
        type: 'object',
        properties: {
            query1: {
                type: 'string',
                description: 'Search query for the first document'
            },
            query2: {
                type: 'string',
                description: 'Search query for the second document'
            },
            comparison_type: {
                type: 'string',
                enum: ['differences', 'similarities', 'both'],
                description: 'Type of comparison to perform'
            }
        },
        required: ['query1', 'query2']
    }),
    execute: async ({ query1, query2, comparison_type = 'both' },
        { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            const results1 = await searchDocuments(query1, userId, 5, 0.3);
            const results2 = await searchDocuments(query2, userId, 5, 0.3);

            if (results1.length === 0) {
                return `Could not find document matching "${query1}". Please upload it or try a different search term.`;
            }
            if (results2.length === 0) {
                return `Could not find document matching "${query2}". Please upload it or try a different search term.`;
            }

            const content1 = results1.map(r => r.content).join('\n\n');
            const content2 = results2.map(r => r.content).join('\n\n');

            const comparisonInstruction = comparison_type === 'differences'
                ? 'Focus only on differences.'
                : comparison_type === 'similarities'
                    ? 'Focus only on similarities.'
                    : 'Identify both similarities and differences.';
            const { text: comparison } = await generateText({
                model: gateway("mistral/devstral-2"),
                system: `You are a document comparison expert. ${comparisonInstruction} Format your response with clear sections.`,
                prompt: `Compare these two documents:

                **Document 1:**
                    ${content1}

                **Document 2:**
                    ${content2}`,
            });
            return `**Comparison Results:**\n${comparison}`;
        } catch (error) {
            console.error('Comparison error:', error);
            return "Error comparing documents. Please try again.";
        }
    }
});
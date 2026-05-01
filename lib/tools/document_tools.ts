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

//3. Extract specific info 

export const extract_info = tool({
    description: `Extract specific information from documents like emails, phone numbers, dates, URLs, names, or custom patterns. Use this when:
        - User asks to find all emails in a document
        - User wants to extract dates or phone numbers
        - User asks for a list of URLs or links
        - User wants to extract specific entities`,
    inputSchema: jsonSchema<{
        query: string;
        extract_type: 'emails' | 'phones' | 'urls' | 'dates' | 'names' | 'custom';
        custom_pattern?: string,
    }>({
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query to find the document to extract from'
            },
            extract_type: {
                type: 'string',
                enum: ['emails', 'phones', 'urls', 'dates', 'names', 'custom'],
                description: 'Type of information to extract'
            },
            custom_pattern: {
                type: 'string',
                description: 'Custom description of what to extract (only used when extract_type is custom)'
            }
        },
        required: ['query', 'extract_type']
    }),
    execute: async ({ query, extract_type, custom_pattern }, { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            const results = await searchDocuments(query, userId, 10, 0.3);
            if (results.length === 0) {
                return "No documents found matching your query."
            }
            const content = results.map(r => r.content).join('\n\n');
            const patterns: Record<string, RegExp> = {
                emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                phones: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
                urls: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
                dates: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w{3,9}\s+\d{1,2},?\s+\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/g,
            };
            if (extract_type === 'names' || extract_type === 'custom') {
                const extractInstruction = extract_type === 'names' ? 'Extract all person names mentioned in the text.' : `Extract the following : ${custom_pattern}`;
                const { text: extracted } = await generateText({
                    model: gateway("mistral/devstral-2"),
                    system: `You are an information extraction expert. ${extractInstruction} Return results as a bullet list. If nothing is found, say "No matches found."`,
                    prompt: content,
                });
                return `**Extracted ${extract_type === 'names' ? 'Names' : 'Information'}:**\n${extracted}`;
            }


            const pattern = patterns[extract_type];
            const matches = content.match(pattern);

            if (!matches || matches.length === 0) {
                return `No ${extract_type} found in the document.`;
            }


            const uniqueMatches = [...new Set(matches)];

            return `**Found ${uniqueMatches.length} ${extract_type}:**\n${uniqueMatches.map(m => `- ${m}`).join('\n')}`;
        } catch (error) {
            console.error("Extraction error:", error);
            return "Error extracting information. Please try again.";
        }
    }
});

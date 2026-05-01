# Phase 4: Document Intelligence Tools

## Overview

This phase adds **5 document intelligence tools** that enhance the AI's ability to work with documents beyond simple RAG search:

1. **Document Summarizer** - AI-powered summaries of any document
2. **Document Comparison** - Compare 2+ documents for differences/similarities
3. **Extract Specific Info** - Pull emails, dates, URLs, phone numbers
4. **Document Converter** - PDF → Text, Markdown → HTML, etc.
5. **Citation Generator** - Generate APA/MLA/Chicago citations **(MCP Server via FastMCP)**

---

## ⚠️ AI SDK v6 Critical Notes

> [!IMPORTANT]
> **Tool Context in AI SDK v6**: Context must be passed using `experimental_context`, NOT `toolContext`!
> 
> ```typescript
> // In streamText config:
> experimental_context: { userId: session.user.id }
> 
> // In tool execute function:
> execute: async (input, { experimental_context }) => {
>     const { userId } = experimental_context as { userId: string };
>     // ...
> }
> ```
> 
> See `ai_sdk_v6_notes.md` in project root for full reference.

---

## 📦 Dependencies

```bash
# Already installed (verify in package.json)
npm install pdf-parse

# New dependencies for Phase 4
npm install marked          # Markdown → HTML conversion
npm install turndown        # HTML → Markdown conversion
```

---

## 📁 File Directory Structure

```
the-sakai-proj/
├── lib/
│   ├── tools/
│   │   └── document-tools.ts          [NEW] - Document tool definitions (tools 1-4)
│   └── mcp/
│       ├── citation-server.ts         [NEW] - FastMCP Citation Generator server
│       └── citation-client.ts         [NEW] - MCP client bridge → AI SDK tool
├── app/
│   └── api/
│       └── chat/
│           └── route.ts               [MODIFY] - Register tools + MCP client
```

---

## ✨ New Code

### 1. Document Tools (`lib/tools/document-tools.ts`)

> [!NOTE]
> All tools follow the existing pattern from `route.ts`: using `jsonSchema` for input validation and returning string results.

```typescript
import { tool, jsonSchema, generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { searchDocuments } from '@/lib/search';

// ============================================
// 1. DOCUMENT SUMMARIZER
// ============================================
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
                description: 'Search query to find the document to summarize (e.g., filename or topic)' 
            },
            length: { 
                type: 'string', 
                enum: ['brief', 'detailed'],
                description: 'Summary length: brief (2-3 sentences) or detailed (full paragraph)'
            }
        },
        required: ['query']
    }),
    execute: async ({ query, length = 'brief' }, { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            // Search for the document content
            const results = await searchDocuments(query, userId, 10, 0.3);
            
            if (results.length === 0) {
                return "No documents found matching your query. Please upload a document first or try a different search term.";
            }

            // Combine relevant content
            const combinedContent = results
                .map(r => r.content)
                .join('\n\n');

            // Generate summary using AI
            const lengthInstruction = length === 'brief' 
                ? 'Provide a 2-3 sentence summary.' 
                : 'Provide a comprehensive summary with key points.';

            const { text: summary } = await generateText({
                model: gateway("google/gemini-2.0-flash"),
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

// ============================================
// 2. DOCUMENT COMPARISON
// ============================================
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
    execute: async ({ query1, query2, comparison_type = 'both' }, { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            // Search for both documents
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

            // Use AI to compare
            const comparisonInstruction = comparison_type === 'differences' 
                ? 'Focus only on differences.'
                : comparison_type === 'similarities'
                ? 'Focus only on similarities.'
                : 'Identify both similarities and differences.';

            const { text: comparison } = await generateText({
                model: gateway("google/gemini-2.0-flash"),
                system: `You are a document comparison expert. ${comparisonInstruction} Format your response with clear sections.`,
                prompt: `Compare these two documents:

**Document 1:**
${content1}

**Document 2:**
${content2}`,
            });

            return `**Comparison Results:**\n${comparison}`;
        } catch (error) {
            console.error("Comparison error:", error);
            return "Error comparing documents. Please try again.";
        }
    }
});

// ============================================
// 3. EXTRACT SPECIFIC INFO
// ============================================
export const extract_info = tool({
    description: `Extract specific information from documents like emails, phone numbers, dates, URLs, names, or custom patterns. Use this when:
- User asks to find all emails in a document
- User wants to extract dates or phone numbers
- User asks for a list of URLs or links
- User wants to extract specific entities`,
    inputSchema: jsonSchema<{
        query: string;
        extract_type: 'emails' | 'phones' | 'urls' | 'dates' | 'names' | 'custom';
        custom_pattern?: string;
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
                description: 'Custom description of what to extract (only used when extract_type is "custom")'
            }
        },
        required: ['query', 'extract_type']
    }),
    execute: async ({ query, extract_type, custom_pattern }, { experimental_context }) => {
        const { userId } = experimental_context as { userId: string };
        try {
            const results = await searchDocuments(query, userId, 10, 0.3);
            
            if (results.length === 0) {
                return "No documents found matching your query.";
            }

            const content = results.map(r => r.content).join('\n\n');
            
            // Regex patterns for common extractions
            const patterns: Record<string, RegExp> = {
                emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                phones: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
                urls: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
                dates: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w{3,9}\s+\d{1,2},?\s+\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/g,
            };

            if (extract_type === 'names' || extract_type === 'custom') {
                // Use AI for complex extractions
                const extractInstruction = extract_type === 'names' 
                    ? 'Extract all person names mentioned in the text.'
                    : `Extract the following: ${custom_pattern}`;

                const { text: extracted } = await generateText({
                    model: gateway("google/gemini-2.0-flash"),
                    system: `You are an information extraction expert. ${extractInstruction} Return results as a bullet list. If nothing is found, say "No matches found."`,
                    prompt: content,
                });

                return `**Extracted ${extract_type === 'names' ? 'Names' : 'Information'}:**\n${extracted}`;
            }

            // Use regex for structured extractions
            const pattern = patterns[extract_type];
            const matches = content.match(pattern);

            if (!matches || matches.length === 0) {
                return `No ${extract_type} found in the document.`;
            }

            // Remove duplicates
            const uniqueMatches = [...new Set(matches)];
            
            return `**Found ${uniqueMatches.length} ${extract_type}:**\n${uniqueMatches.map(m => `- ${m}`).join('\n')}`;
        } catch (error) {
            console.error("Extraction error:", error);
            return "Error extracting information. Please try again.";
        }
    }
});

// ============================================
// 4. DOCUMENT CONVERTER
// ============================================
export const convert_document = tool({
    description: `Convert document content between formats:
- Markdown → HTML
- HTML → Markdown  
- Text → Bullet points
- Content → Markdown table
Use this when user wants to reformat their content.`,
    inputSchema: jsonSchema<{
        content: string;
        from_format: 'markdown' | 'html' | 'text';
        to_format: 'markdown' | 'html' | 'bullets' | 'table';
    }>({
        type: 'object',
        properties: {
            content: { 
                type: 'string', 
                description: 'The content to convert (user should paste it)' 
            },
            from_format: { 
                type: 'string', 
                enum: ['markdown', 'html', 'text'],
                description: 'Current format of the content'
            },
            to_format: { 
                type: 'string', 
                enum: ['markdown', 'html', 'bullets', 'table'],
                description: 'Target format to convert to'
            }
        },
        required: ['content', 'from_format', 'to_format']
    }),
    execute: async ({ content, from_format, to_format }) => {
        try {
            // For complex conversions, use AI
            if (to_format === 'bullets' || to_format === 'table') {
                const formatInstruction = to_format === 'bullets'
                    ? 'Convert this content into a clean bullet-point list. Group related items if appropriate.'
                    : 'Convert this content into a markdown table. Identify columns and rows from the data.';

                const { text: converted } = await generateText({
                    model: gateway("google/gemini-2.0-flash"),
                    system: `You are a document formatting expert. ${formatInstruction} Return only the formatted content, no explanations.`,
                    prompt: content,
                });

                return `**Converted to ${to_format}:**\n\n${converted}`;
            }

            // Markdown ↔ HTML conversions (basic implementation)
            if (from_format === 'markdown' && to_format === 'html') {
                // Use AI for reliable conversion
                const { text: html } = await generateText({
                    model: gateway("google/gemini-2.0-flash"),
                    system: 'Convert the following Markdown to valid HTML. Return only the HTML, no explanations.',
                    prompt: content,
                });
                return `**HTML Output:**\n\`\`\`html\n${html}\n\`\`\``;
            }

            if (from_format === 'html' && to_format === 'markdown') {
                const { text: markdown } = await generateText({
                    model: gateway("google/gemini-2.0-flash"),
                    system: 'Convert the following HTML to Markdown. Return only the Markdown, no explanations.',
                    prompt: content,
                });
                return `**Markdown Output:**\n${markdown}`;
            }

            return "Conversion not supported for this format combination.";
        } catch (error) {
            console.error("Conversion error:", error);
            return "Error converting document. Please try again.";
        }
    }
});

// ============================================
// 5. CITATION GENERATOR → Moved to MCP Server
//    See: lib/mcp/citation-server.ts (FastMCP)
//    Bridge: lib/mcp/citation-client.ts
// ============================================

// ============================================
// EXPORT ALL TOOLS (inline only — citation is MCP)
// ============================================
export const documentTools = {
    summarize_document,
    compare_documents,
    extract_info,
    convert_document,
};

// Tool types for type inference
export type DocumentTools = typeof documentTools;
```

---

## 📦 Additional Dependencies (Citation MCP Server)

```bash
npm install fastmcp
```

> [!NOTE]
> FastMCP uses Zod for schema validation, which is already installed in this project (`zod@^4.3.5`).
> The `ai` package and `@ai-sdk/gateway` are also already available for the server's internal LLM call.

---

## ✨ Citation Generator — FastMCP MCP Server

As specified in the [master implementation plan](./master_implementation_plan.md#phase-4-document-intelligence-tools-5-features), the Citation Generator is built as a **standalone MCP server** using FastMCP, not an inline AI SDK tool.

This gives us:
- A fully independent, testable unit
- Reusability by any MCP-compatible client (not just our chat)
- A foundation for the FastMCP server architecture outlined in `future_scope.md`

### 2a. MCP Server (`lib/mcp/citation-server.ts`) [NEW]

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";

const citationServer = new FastMCP({
    name: "Swiss Army Citation Server",
    version: "1.0.0",
});

citationServer.addTool({
    name: "generate_citation",
    description: `Generate academic citations in APA, MLA, or Chicago format. Use this when:
- User asks for a citation
- User needs to cite a source
- User asks for bibliography formatting`,
    parameters: z.object({
        source_type: z.enum(["book", "article", "website", "journal"])
            .describe("Type of source being cited"),
        format: z.enum(["apa", "mla", "chicago"])
            .describe("Citation format style"),
        title: z.string()
            .describe("Title of the work"),
        authors: z.string().optional()
            .describe('Author(s) in format "Last, First" or "Last, First & Last, First"'),
        year: z.string().optional()
            .describe("Publication year"),
        url: z.string().optional()
            .describe("URL for websites or online articles"),
        publisher: z.string().optional()
            .describe("Publisher name (for books)"),
        journal_name: z.string().optional()
            .describe("Journal name (for journal articles)"),
        volume: z.string().optional()
            .describe("Volume number (for journals)"),
        pages: z.string().optional()
            .describe('Page range (e.g., "123-145")'),
        access_date: z.string().optional()
            .describe("Date accessed (for websites)"),
    }),
    execute: async (args) => {
        const {
            source_type, format, title, authors, year,
            url, publisher, journal_name, volume, pages, access_date,
        } = args;

        const sourceInfo = [
            `Source Type: ${source_type}`,
            `Title: ${title}`,
            authors && `Authors: ${authors}`,
            year && `Year: ${year}`,
            publisher && `Publisher: ${publisher}`,
            journal_name && `Journal: ${journal_name}`,
            volume && `Volume: ${volume}`,
            pages && `Pages: ${pages}`,
            url && `URL: ${url}`,
            access_date && `Access Date: ${access_date}`,
        ].filter(Boolean).join("\n");

        const { text: citation } = await generateText({
            model: gateway("mistral/devstral-2"),
            system: `You are an academic citation expert. Generate a properly formatted ${format.toUpperCase()} citation. Return ONLY the citation, no explanations. Use italics where appropriate (use *asterisks* for markdown italics).`,
            prompt: `Generate a ${format.toUpperCase()} citation for:\n${sourceInfo}`,
        });

        return `**${format.toUpperCase()} Citation:**\n${citation}`;
    },
});

export { citationServer };
```

### 2b. MCP Client Bridge (`lib/mcp/citation-client.ts`) [NEW]

This file bridges the FastMCP server into a Vercel AI SDK `tool()` so the chat route can consume it alongside the other inline tools.

```typescript
import { tool, jsonSchema } from "ai";
import { citationServer } from "./citation-server";

/**
 * Bridges the FastMCP Citation Server tool into a Vercel AI SDK tool.
 * 
 * The MCP server handles all validation and execution internally.
 * This wrapper simply proxies the call so it can sit alongside
 * other AI SDK tools in the chat route's `tools` object.
 */
export const generate_citation = tool({
    description: `Generate academic citations in APA, MLA, or Chicago format. Use this when:
- User asks for a citation
- User needs to cite a source
- User asks for bibliography formatting`,
    inputSchema: jsonSchema<{
        source_type: "book" | "article" | "website" | "journal";
        format: "apa" | "mla" | "chicago";
        title: string;
        authors?: string;
        year?: string;
        url?: string;
        publisher?: string;
        journal_name?: string;
        volume?: string;
        pages?: string;
        access_date?: string;
    }>({
        type: "object",
        properties: {
            source_type: {
                type: "string",
                enum: ["book", "article", "website", "journal"],
                description: "Type of source being cited",
            },
            format: {
                type: "string",
                enum: ["apa", "mla", "chicago"],
                description: "Citation format style",
            },
            title: { type: "string", description: "Title of the work" },
            authors: { type: "string", description: "Author(s)" },
            year: { type: "string", description: "Publication year" },
            url: { type: "string", description: "URL" },
            publisher: { type: "string", description: "Publisher name" },
            journal_name: { type: "string", description: "Journal name" },
            volume: { type: "string", description: "Volume number" },
            pages: { type: "string", description: "Page range" },
            access_date: { type: "string", description: "Date accessed" },
        },
        required: ["source_type", "format", "title"],
    }),
    execute: async (input) => {
        try {
            // Proxy the call to the FastMCP server's tool
            const result = await citationServer.callTool("generate_citation", input);
            return typeof result === "string" ? result : JSON.stringify(result);
        } catch (error) {
            console.error("Citation MCP error:", error);
            return "Error generating citation. Please try again.";
        }
    },
});
```

> [!IMPORTANT]
> **Why the bridge pattern?** The chat route uses Vercel AI SDK's `streamText` which expects `tool()` definitions.
> FastMCP servers expose tools via the MCP protocol. The bridge wraps the MCP tool call so both 
> systems work together seamlessly. When we add more MCP servers later (Prettier, LanguageTool, etc.),
> each will follow the same pattern: `lib/mcp/{name}-server.ts` + `lib/mcp/{name}-client.ts`.

---

## ✏️ Modifications

### 3. Update Chat Route (`app/api/chat/route.ts`)

**Goal:** Register inline document tools + the MCP-bridged citation tool.

**BEFORE:**
```typescript
const result = streamText({
    model: gateway("mistral/devstral-2"),
    messages: await convertToModelMessages(messages),
    tools: {
        search_knowledge_base: tool({
            // ... existing search tool
        }),
    },
    // ...
});
```

**AFTER:**
```typescript
import { gateway } from '@ai-sdk/gateway';
import { convertToModelMessages, streamText, UIMessage, tool, InferUITools, UIDataTypes, stepCountIs, jsonSchema, generateText } from 'ai';
import { searchDocuments } from '@/lib/search';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { saveMessage } from '@/lib/services/messages';
// NEW: Import inline document tools (summarize, compare, extract, convert)
import { documentTools } from '@/lib/tools/document-tools';
// NEW: Import MCP-bridged citation tool
import { generate_citation } from '@/lib/mcp/citation-client';

// ... existing code ...

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { messages, conversationId }: { messages: ChatMessage[]; conversationId?: number } = body;

        // ... existing message saving code ...

        const result = streamText({
            model: gateway("mistral/devstral-2"),
            messages: await convertToModelMessages(messages),
            // NEW: Tool context for passing userId to tools (AI SDK v6 uses experimental_context)
            experimental_context: { userId: session.user.id },
            tools: {
                // Existing search tool
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
                            const query = input?.query;
                            if (!query || typeof query !== 'string') {
                                return "Invalid search query provided";
                            }
                            const results = await searchDocuments(query, session.user.id);
                            if (results.length === 0) {
                                return "No relevant documents found";
                            }
                            return results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
                        } catch (error) {
                            console.error("Search error:", error);
                            return "Error searching the knowledge base";
                        }
                    },
                }),

                // NEW: Document Intelligence Tools (inline)
                ...documentTools,

                // NEW: Citation Generator (MCP Server via FastMCP)
                generate_citation,
            },
            system: `You are a helpful assistant for Swiss Army Knife AI. You have access to powerful document tools:

**Available Tools:**
1. **search_knowledge_base** - Search documents and memories
2. **summarize_document** - Create summaries of documents
3. **compare_documents** - Compare two documents for differences/similarities  
4. **extract_info** - Extract emails, phones, URLs, dates, names from documents
5. **convert_document** - Convert between formats (Markdown ↔ HTML, text → bullets/table)
6. **generate_citation** - Generate APA/MLA/Chicago citations

**When to use each tool:**
- User asks "summarize this" → use summarize_document
- User asks "compare X and Y" → use compare_documents
- User asks "find all emails/dates/URLs" → use extract_info
- User asks to reformat content → use convert_document
- User needs a citation → use generate_citation
- User asks about document content → use search_knowledge_base first

IMPORTANT: Always search the knowledge base FIRST when users ask about their documents.

The user's name is ${session.user.name || 'there'}.`,
            stopWhen: stepCountIs(5), // Increased to allow multi-step tool use
            onFinish: async ({ text }) => {
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
```

---

## 🧪 Verification

### Test 1: Document Summarizer
```
User: "Summarize my uploaded PDF about auth migration"
Expected: AI searches knowledge base, finds auth-related content, returns summary
```

### Test 2: Document Comparison
```
User: "Compare my notes on React vs Vue"
Expected: AI searches for both topics, provides structured comparison
```

### Test 3: Extract Info
```
User: "Find all email addresses in my contacts document"
Expected: AI extracts and lists unique email addresses
```

### Test 4: Document Converter
```
User: "Convert this to a bullet list: [paste text]"
Expected: AI reformats content as bullets
```

### Test 5: Citation Generator (MCP)
```
User: "Generate an APA citation for the book 'Clean Code' by Robert Martin, 2008"
Expected: AI returns properly formatted APA citation via FastMCP server
```

### Test 6: Citation MCP Server Standalone
```bash
# Test the MCP server independently using FastMCP's built-in inspector
npx fastmcp inspect lib/mcp/citation-server.ts
```

---

## 🔧 Troubleshooting

### "Tool not found" error
- Verify import path is correct: `@/lib/tools/document-tools`
- Check that `documentTools` is spread correctly: `...documentTools`
- Verify `generate_citation` is imported from `@/lib/mcp/citation-client`

### "userId undefined" in tools
- Ensure `experimental_context: { userId: session.user.id }` is set in streamText config
- Tools receive context as second argument: `execute: async (input, { experimental_context }) => {}`
- Cast the context: `const { userId } = experimental_context as { userId: string };`
- Note: Citation tool does NOT need userId (no user-scoped data)

### Summarization returns "No documents found"
- Upload a document first
- Check that the search query matches document content
- Lower threshold in `searchDocuments` if needed

### Citation MCP server errors
- Run `npx fastmcp inspect lib/mcp/citation-server.ts` to test the server in isolation
- Verify `fastmcp` is installed: `npm ls fastmcp`
- Check that `citationServer.callTool` is available in the bridge — this is FastMCP's internal invocation API
- If the bridge fails, the error will be caught and return a user-friendly message

### Citation format incorrect
- The tool uses AI generation — results should be accurate for standard sources
- For edge cases, user can manually adjust the output

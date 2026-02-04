# Swiss Army Knife AI - Implementation Plan

## Project Vision
Transform the existing RAG Chatbot into a comprehensive productivity workspace with **Universal Memory** (cross-conversation RAG), 27+ utility tools, and agentic workflows.

---

## 🧠 Core Innovation: Universal Memory RAG

**The Big Picture:**
Every conversation, document, and message becomes part of your searchable knowledge base. When you're in Chat 10, you can ask about something from Chat 1, and the AI will retrieve and cite it.

**How It Works:**
1. All messages are embedded and stored alongside documents
2. Each embedding tagged with `source_type` ('document' | 'message') and `conversation_id`
3. Search queries retrieve from **both documents AND past conversations**
4. AI responds with context like: *"In your chat from Jan 15th about auth, you mentioned..."*

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **AI SDK:** Vercel AI SDK v6
- **Agent Framework:** LangGraph.js (TypeScript)
- **Database:** Neon Postgres + Drizzle ORM
- **Auth:** Better Auth (replacing Clerk)
- **Deployment:** Vercel

---

## Phase 1: Foundation & Auth Migration

### Goals
- Replace Clerk with Better Auth
- Expand database schema for conversations and workflows
- Update all auth-related UI components

### Key Changes
- Add Better Auth config with Google OAuth
- Create new database tables
- Migrate navigation and layout components
- Create sign-in/sign-up pages

### Success Criteria
- Users can sign up/sign in
- Session persistence works
- User data stored in Neon DB

---

## Phase 2: Chat UI Overhaul

### Goals
- Merge `/upload` route into `/chat`
- Add conversation sidebar
- Enable inline file uploads

### Key Changes
- Remove `/upload` directory
- Build chat sidebar with conversation list
- Add file attachment to chat input
- Implement "New Chat" functionality

### Success Criteria
- Users can upload files directly in chat
- Sidebar shows past conversations
- Switching chats preserves context

---

## Phase 3: Universal Memory RAG System ⭐

### Goals
- Support multiple file formats (PDF, DOCX, CSV, TXT, MD)
- **Enable cross-conversation search (THE KEY FEATURE)**
- Store both documents and messages as embeddings

### Key Changes
- Create file processing pipeline with format detection
- **Update embeddings table: add `source_type`, `source_id`, `conversation_id`**
- **Implement unified search across docs + ALL past messages**
- Store every message in conversations for embedding

### How Cross-Chat Works
```
User in Chat 10: "What did we discuss about auth in earlier chats?"
                     ↓
              Generate query embedding
                     ↓
     Search embeddings WHERE user_id = current_user
                     ↓
    Returns: [Chat 3, Message ID 42] "We discussed Better Auth migration..."
             [Doc: auth-notes.pdf] "OAuth flow diagram..."
                     ↓
         AI synthesizes with source citations
```

### Success Criteria
- ✅ Upload DOCX/CSV and query content
- ✅ **Ask about "Chat 1" from "Chat 10" → Get accurate context**
- ✅ Search returns both documents and past messages with conversation titles/dates

---

## Phase 4: Document Intelligence Tools (5 features)

1. **Document Converter** - PDF → Text, Markdown → HTML
2. **Document Summarizer** - AI-powered summaries
3. **Document Comparison** - Compare 2+ documents
4. **Citation Generator** - APA/MLA citations (MCP)
5. **Extract Specific Info** - Pull emails, dates, URLs

### Implementation Approach
- Most use Vercel AI SDK `tool()` definitions
- Citation generator built as MCP server
- All integrated into main chat API

---

## Phase 5: Utility Tool Bundles

### Text Utilities (7 tools)
Grammar check, paraphrase, tone adjustment, case converter, word/char count, translation, sentiment analysis

### Code Tools (4 tools)
Code formatter (Prettier MCP), code explainer, bug finder, unit test generator

### Data Extraction (3 tools)
Extract emails/phones/URLs, table to JSON/CSV, entity recognition

### Implementation Approach
- Simple functions for case/word count
- AI SDK tools for paraphrase/tone/sentiment
- MCPs for grammar (LanguageTool) and formatting (Prettier)

---

## Phase 6: Web Integration & Link Tools (6 features)

1. **YouTube Transcript** - Extract video transcripts (MCP)
2. **URL Shortener** - TinyURL/Bitly integration (MCP)
3. **QR Code Generator** - Text/URL to QR image (MCP)
4. **Music Converter** - Spotify ↔ Apple Music (Songlink MCP)
5. **yt-dlp Downloads** - Video downloads (MCP)
6. **Link Utilities** - Preview metadata, clean tracking params

---

## Phase 7: Agentic Workflows (LangGraph)

### Research Assistant
**Flow:** Search → Scrape → Analyze → Report
- Multi-step web research
- Automatic source gathering
- AI-powered synthesis
- Add findings to knowledge base

### Meeting Prep Assistant
**Flow:** Calendar → Emails → Docs → Briefing
- Fetch upcoming meetings
- Pull relevant emails/Slack messages
- Search Drive/docs
- Generate comprehensive briefing

---

## Phase 8: Integration & Polish

### Main Chat API Updates
- Register all 27 tools
- Initialize MCP clients
- Add LangGraph agent invocation
- **Implement message storage AND embedding after each exchange**

### UI Enhancements
- Tool output rendering (QR codes, tables, etc.)
- Loading states for long-running workflows
- Error handling and retry logic
- Mobile responsiveness

---

## Database Schema Highlights

### Core Tables for Universal Memory
```typescript
conversations: id, user_id, title, created_at, updated_at
messages: id, conversation_id, role, content, tool_calls, created_at
embeddings: 
  - id, user_id, content, embedding (768-dim)
  - source_type ('document' | 'message')  ← KEY for cross-chat
  - source_id (FK to documents or messages)
  - conversation_id (NULL for docs, set for messages) ← KEY
  - metadata (filename, conversation title, date, etc.)
```

---

## Environment Variables Required

```
NEON_DATABASE_URL
NEXT_PUBLIC_APP_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_API_KEY
BITLY_API_KEY (optional)
BRAVE_SEARCH_API_KEY (optional)
LANGUAGETOOL_API_KEY (optional)
```

---

## Verification Strategy

### Cross-Conversation RAG Test (Critical!)
1. Chat 1: Discuss "Better Auth migration plan"
2. Chat 2: Discuss "LangGraph implementation"
3. Chat 3: Ask "What did I say about auth in my first chat?"
4. ✅ Verify: AI retrieves Chat 1 context and cites it

### Other Testing
- Phase 1: Auth flow works
- Phase 2: Chat UI functional
- Phase 3: File upload + RAG retrieval
- Phase 4-6: Test 3-5 tools from each category
- Phase 7: Run both agents end-to-end
- Phase 8: Full integration test

---

## Next Steps

1. Review this high-level plan
2. Create detailed `.md` guides for each phase
3. Begin Phase 1 implementation

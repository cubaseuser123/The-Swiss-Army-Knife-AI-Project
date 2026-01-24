# RAG Chatbot with Document Intelligence

A Next.js-based AI chatbot with Retrieval-Augmented Generation (RAG) capabilities for intelligent document Q&A and conversation.

## 🚀 Current Features

### Core Functionality
- **Document Upload & Processing** - Upload PDF documents and chat with their content
- **RAG-Powered Q&A** - Ask questions about your uploaded documents with context-aware responses
- **Vector Embeddings** - Semantic search using Neon Postgres with pgvector
- **User Authentication** - Secure auth system powered by Clerk

### Tech Stack
- **Framework:** Next.js (App Router)
- **AI:** Vercel AI SDK
- **Database:** Neon Postgres (with pgvector for embeddings)
- **ORM:** Drizzle ORM
- **Auth:** Clerk
- **Deployment:** Vercel

## 📁 Project Structure
```
/app
  /chat          # Chat interface
  /upload        # Document upload route
/lib
  /db            # Database schema and connections
  /rag           # RAG logic and embeddings
```

## 🎯 Current Capabilities

1. **Upload Documents** - Support for PDF files via dedicated upload route
2. **Generate Embeddings** - Automatic vectorization of document content
3. **Semantic Search** - Query documents using natural language
4. **Conversational AI** - Context-aware responses powered by RAG

---

## 🔮 What's Next: Swiss Army Knife AI

This project is being upgraded into **Swiss Army Knife AI** - a comprehensive AI productivity workspace that goes far beyond document Q&A.

### Upcoming Features

#### 🤖 Agentic Workflows
- **Research Assistant** - Autonomous web research, source finding, and knowledge base building
- **Meeting Prep Assistant** - Auto-generate briefings using Gmail, Calendar, Slack, and Drive

#### 🔧 Utility Tools (27+ features)
- **Document Intelligence** - Summarization, comparison, citation generation, format conversion
- **Text Utilities** - Grammar check, translation, tone adjustment, sentiment analysis
- **Code Tools** - Formatting, explanation, bug finding, test generation
- **Data Extraction** - Email/phone extraction, entity recognition, table conversion
- **Web Integration** - YouTube transcripts, URL shortening, QR codes, music platform conversion, media downloads
- **Link Management** - Preview generation, tracking cleanup, metadata extraction

#### 🏗️ Architecture Upgrades
- **LangGraph.js** - Advanced agent orchestration
- **MCP Integration** - 11+ Model Context Protocol servers for tool connectivity
- **Better Auth** - Migration from Clerk for enhanced auth features
- **Chat History** - Persistent conversation storage and management
- **Unified Interface** - Merged upload + chat experience with sidebar navigation

### Technology Evolution

**Adding:**
- LangGraph.js for agent workflows
- Better Auth for authentication
- Expanded Neon Postgres schema (chat history, user data, workflow runs)
- 11+ MCP servers (YouTube, URL tools, Gmail, Calendar, Slack, Drive, etc.)

**Enhancing:**
- RAG system with multi-document intelligence
- UI/UX with chat history sidebar
- Database schema for comprehensive data storage

---

## 🛠️ Development Status

- ✅ Core RAG chatbot functional
- ✅ Document upload and embedding generation
- ✅ Vector similarity search
- ✅ Basic authentication
- ✅ Migrating to Swiss Army Knife AI architecture
- 🚧 Adding agentic workflows
- 🚧 Building MCP integrations
- 🚧 Implementing utility tools

---

## 📝 Installation
```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys: OpenAI, Neon Postgres, Clerk

# Run database migrations
npx drizzle-kit push:pg

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 🗄️ Database Schema

Current schema includes:
- **documents** - Stores uploaded documents with vector embeddings

Upcoming additions:
- **conversations** - Chat history
- **messages** - Individual messages
- **workflow_runs** - Agent execution tracking
- **users/sessions** - Better Auth tables

---

## 🔑 Environment Variables
```env
# Database
DATABASE_URL=your_neon_postgres_url

# AI
OPENAI_API_KEY=your_openai_key

# Auth (current)
CLERK_SECRET_KEY=your_clerk_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Future additions for Swiss Army Knife
BITLY_API_KEY=
GOOGLE_TRANSLATE_API_KEY=
LANGUAGETOOL_API_KEY=
# ... more API keys for MCPs
```

---

## 🎨 Features Roadmap

### Phase 1: Foundation (In Progress)
- [x] Basic RAG chatbot
- [x] Document upload
- [x] Vector search
- [x] Better Auth migration
- [x] Chat history UI
- [x] Unified chat interface

Phase 1 Completed.

### Phase 2: Document Intelligence
- [ ] Document summarizer
- [ ] Citation generator
- [ ] Document comparison
- [ ] Format converter
- [ ] Info extraction

### Phase 3: Utility Tools
- [ ] Text utilities bundle
- [ ] Code tools bundle
- [ ] Data extraction tools
- [ ] Link utilities
- [ ] YouTube transcript extractor

### Phase 4: Agentic Workflows
- [ ] LangGraph.js integration
- [ ] Research Assistant agent
- [ ] Meeting Prep Assistant agent
- [ ] MCP server integrations

### Phase 5: Polish & Deploy
- [ ] UI/UX improvements
- [ ] Error handling
- [ ] Documentation
- [ ] Production deployment

---

## 🤝 Contributing

This is currently a student project. Contributions, issues, and feature requests are welcome!

---

## 🙏 Acknowledgments

- Vercel AI SDK team
- Neon Postgres
- LangGraph.js
- Model Context Protocol community
- CodeVolution's youtube channel for helping me learn building this project 
---

**Note:** This project is actively being developed. The Swiss Army Knife AI upgrade is underway. Star ⭐ the repo to follow progress!

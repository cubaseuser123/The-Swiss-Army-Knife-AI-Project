# Swiss Army Knife AI

An AI-powered productivity workspace that goes beyond simple document Q&A. Built with RAG architecture, 27+ utility tools, and intelligent agentic workflows.

## 🌟 Features

### Universal Memory RAG
- Chat with documents (PDF, DOCX, CSV, TXT, MD)
- Cross-conversation search - reference Chat 1 from Chat 10
- AI cites sources with conversation context

### 27+ Productivity Tools
- **Document Intelligence**: Summarize, compare, extract citations, convert formats
- **Text Utilities**: Grammar check, paraphrase, tone adjustment, translation
- **Code Tools**: Format, explain, debug, generate tests
- **Web Integration**: URL shortener, QR codes, YouTube transcripts, music platform converter
- **Data Extraction**: Pull emails, phones, URLs, convert tables

### Agentic Workflows (LangGraph)
- **Research Assistant**: Multi-step web research with automatic synthesis
- **Meeting Prep**: Auto-generate briefings from calendar, emails, and docs

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Vercel AI SDK v6 + LangGraph.js
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: Better Auth
- **AI Model**: Google Gemini 2.0 Flash

## 🚀 Getting Started

### Prerequisites
- Node.js 20.12.7+
- npm 9.2.0+
- Neon Postgres database
- Google API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your NEON_DATABASE_URL, GOOGLE_API_KEY, etc.

# Run database migrations
npx drizzle-kit generate
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📚 Documentation

See the `/docs` directory for detailed implementation guides:
- `phase1_auth_migration.md` - Better Auth setup
- `phase2_chat_ui.md` - Chat interface (coming soon)
- And more...

## 🔑 Environment Variables

```bash
NEON_DATABASE_URL=          # Neon Postgres connection string
GOOGLE_API_KEY=             # For Gemini AI
NEXT_PUBLIC_APP_URL=        # Your app URL
GOOGLE_CLIENT_ID=           # OAuth (optional)
GOOGLE_CLIENT_SECRET=       # OAuth (optional)
```

## 📜 License

MIT

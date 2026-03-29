# Future Scope — Swiss Army Knife AI

This document captures all planned advanced enhancements beyond the current Phase 2 (RAG & Tools).

---

## 1. 🔭 Observability

**Goal**: Production-grade monitoring of all LLM calls — cost, latency, errors, traces.

### OpenTelemetry (Industry Standard)
- The universal observability framework — traces, metrics, logs
- Vercel AI SDK has **native OTel support** via `experimental_telemetry`
- Each `streamText` / `generateText` call automatically emits spans with: model, tokens, latency, prompt
- Export to **any backend**: Jaeger, Grafana, Datadog, or self-hosted
- **Integration**: Enable `experimental_telemetry` in AI SDK + configure OTel exporter

### Langfuse (LLM-Specific Tracing)
- Open-source, self-hostable
- Acts as an OTel-compatible collector specifically designed for LLM traces
- See each step of a multi-agent run: which agent ran, how long, what it returned
- **Integration**: Use as an OTel exporter OR use Langfuse SDK directly

### Combined Setup
```
AI SDK call (streamText / generateText)
  → OTel auto-instruments with spans
  → Exported to Langfuse (LLM-specific dashboards)
  → Optionally also to Jaeger/Grafana (general infra monitoring)
```

### Resume Signal
> *"Implemented OpenTelemetry-based LLM observability with Langfuse, providing full trace visibility across multi-agent workflows including token usage, latency, and cost tracking"*

---

## 2. 🛡️ Guardrails

**Goal**: Custom TypeScript middleware wrapping every LLM call with input/output validation.

### Input Guards (Before LLM)
- **Prompt injection detection** — regex + heuristic for "ignore previous instructions" patterns
- **PII redaction** — detect/mask emails, phone numbers, SSNs before sending to LLM
- **Token budget enforcement** — reject if input exceeds cost threshold

### Output Guards (After LLM)
- **Hallucination check** — for RAG responses, verify claims exist in retrieved source documents
- **Structured output validation** — validate tool call JSON against Zod schemas
- **Toxicity filter** — Gemini safety settings + custom blocklist

### Implementation
- `lib/guardrails.ts` module that wraps `streamText`
- Violations logged and visible in observability dashboard

### Resume Signal
> *"Built input/output guardrails with prompt injection detection, PII redaction, and RAG hallucination checking"*

---

## 3. 📊 Evals

**Goal**: Prove our features work with automated, repeatable test suites.

### Eval Categories

| Category | What We Test | Example |
|---|---|---|
| **RAG Quality** | Retrieval precision + answer faithfulness | Upload known doc → ask question → verify answer matches |
| **Tool Accuracy** | Correct tool outputs | Grammar tool fixes known-bad text correctly |
| **Memory Recall** | Pin → new chat → recall | Pin conversation → ask about it in new chat → verify recall |
| **Guardrail Effectiveness** | Blocks bad input/output | Send prompt injection → verify it's blocked |

### Implementation
```
scripts/eval/
  run-evals.ts           # Main runner
  datasets/
    rag-qa.json          # Q&A pairs for RAG
    tool-tests.json      # Input-output pairs for tools
    guardrail-tests.json # Attack vectors
  reporters/
    console.ts           # CLI output
    json.ts              # JSON report for CI
```

### Resume Signal
> *"Built custom evaluation harness testing RAG faithfulness, tool accuracy, and guardrail effectiveness with automated CI reporting"*

---

## 4. 🧠 Memory — Dual Architecture

**Goal**: Combine automatic memory extraction with manual pinning.

### Mem0 (Automatic)
- After every conversation, Mem0 auto-extracts user facts/preferences
- Examples: "User prefers TypeScript", "User is building a fitness app"
- Queried at chat start → injected into system prompt
- **Integration**: Mem0 REST API (no Python needed)

### Pin to Memory (Manual)
- Already built (UI done, backend deferred)
- User explicitly pins important conversations
- Uses existing `embeddings` table with `sourceType: 'memory'`

### Combined Flow
```
New Chat Starts →
  1. Query Mem0 for user preferences/facts
  2. Query embeddings table for relevant pinned memories
  3. Inject both into system prompt as context
```

### Resume Signal
> *"Integrated Mem0 for automatic memory extraction alongside manual conversation pinning, creating a dual-memory architecture"*

---

## 5. 🤖 Multi-Agent — A2A (Agent Teams)

**Goal**: Fully decentralized agent-to-agent communication. No coordinator — agents talk directly to each other.

### Architecture: Google A2A Protocol

Each agent is a standalone endpoint with:
- **Agent Card** — JSON spec declaring capabilities (like OpenAPI for agents)
- **Tasks** — Units of work agents send to each other
- **Artifacts** — Structured outputs agents produce and share

### How It Works (No Orchestrator)

```
User: "Write a blog post about pgvector"

Writer Agent starts drafting
  → realizes it needs data
  → DIRECTLY sends Task to Researcher Agent

Researcher Agent searches web + knowledge base
  → returns findings as Artifact to Writer

Writer incorporates research, finishes draft
  → DIRECTLY sends to Editor Agent

Editor notices a shaky technical claim
  → DIRECTLY asks Fact Checker Agent to verify

Fact Checker confirms/denies
  → sends result back to Editor

Editor finalizes → returns to user
```

**Key difference**: Steps 4-5 happened because the **Editor decided it**, not because a coordinator pre-planned it. Agents are autonomous.

### Agent Roster

| Agent | Capabilities | Model |
|---|---|---|
| **Writer** | Drafts content, requests research | `gemini-2.0` |
| **Researcher** | Web search, knowledge base search | `gemini-1.5-flash` |
| **Editor** | Grammar, tone, structure polish | `gemini-1.5-flash` |
| **Fact Checker** | Verifies claims against sources | `gemini-1.5-flash` |

### Feature Name: **"Content Pipeline"**
- Lives under the existing "AI Agents" category in `features_data.json`
- UI shows a live graph of agent communication as it happens
- Each agent's work is visible and inspectable

### Implementation Options

| Approach | Pros | Cons |
|---|---|---|
| **Google A2A Protocol** | Most impressive, industry-standard | More boilerplate |
| **LangGraph.js with A2A-style routing** | Practical, ships faster | Less "pure" A2A |

### Resume Signal
> *"Implemented Google's A2A protocol for peer-to-peer agent communication with 4 specialized agents collaborating autonomously on content creation"*

---

## 6. 🛠️ High-Impact Free Integrations

**Goal**: Leverage powerful, free API tiers to dramatically improve the platform's capabilities without increasing costs.

### Jina AI Reader (Zero Cost, No API Key)
- **What it does**: Instantly converts any URL into clean, LLM-ready Markdown.
- **Use Case**: Powers the "Web Mode" and "Link Preview" features. When a user pastes a link, Jina extracts the readable content directly (e.g., `https://r.jina.ai/https://example.com`).
- **Impact**: Bypasses the need for complex custom web scrapers or Puppeteer setups.

### Cohere Rerank (Generous Free Tier)
- **What it does**: Takes the initial vector search results from pgvector and re-orders them based on actual semantic relevance to the user's query.
- **Use Case**: Enhances the "Document Mode" (RAG). pgvector finds the top 20 matches quickly, then Cohere Rerank sorts them so the absolute best 5 go to Gemini.
- **Impact**: Massively reduces AI hallucination and improves answer accuracy.
- **Resume Signal**: *"Implemented a two-stage RAG pipeline utilizing pgvector for retrieval and Cohere Rerank for semantic re-ranking, significantly improving output accuracy."*

### YouTube Data API v3 (10,000 units/day Free)
- **What it does**: Fetches video metadata, channel details, and search results.
- **Use Case**: Powers the "YouTube Transcript Extractor" feature. Combined with a transcript fetching library, it allows users to drop a URL and instantly get the video summary, tags, and full parsed text.

---

## 7. 🔌 MCP Servers via FastMCP (TypeScript)

**Goal**: Build all custom MCP servers using FastMCP's TypeScript wrapper for clean, type-safe tool definitions.

### Why FastMCP
- **TypeScript-first** — fits our stack perfectly, no Python sidecar
- Handles all MCP boilerplate: session management, SSE transport, authentication
- Define tools with simple function declarations instead of JSON schemas
- FastMCP 3.0 adds OpenTelemetry instrumentation (ties into our observability layer)

### Where It Applies

Every custom integration in this project that exposes tools to AI agents becomes an MCP server:

| MCP Server | Tools It Exposes |
|---|---|
| **Document Server** | `search_documents`, `upload_file`, `list_documents` |
| **Memory Server** | `pin_conversation`, `retrieve_memories`, `search_memories` |
| **Web Tools Server** | `jina_reader`, `youtube_transcript`, `link_preview` |
| **Code Tools Server** | `format_code`, `explain_code`, `find_bugs` |
| **Utility Server** | `grammar_check`, `translate`, `sentiment_analysis` |

### Example: How Simple It Is

```typescript
import { FastMCP } from "fastmcp";

const server = new FastMCP("Swiss Army Web Tools");

server.addTool({
  name: "jina_reader",
  description: "Convert any URL to clean markdown",
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    const res = await fetch(`https://r.jina.ai/${url}`);
    return await res.text();
  },
});

server.start({ transportType: "sse" });
```

### Architecture Benefit
Each MCP server is an independent, testable unit that any MCP-compatible client can connect to — not just our app. This makes the project a **platform**, not just a monolith.

### Resume Signal
> *"Architected a modular MCP server ecosystem using FastMCP (TypeScript), exposing 27+ tools as independent, composable services consumable by any MCP-compatible AI client"*

---

## 📋 Implementation Priority

| # | Enhancement | Effort | Impact | Depends On |
|---|---|---|---|---|
| 1 | OpenTelemetry + Langfuse | 3-4 hrs | Very High | Nothing |
| 2 | Custom Guardrails | 4-6 hrs | High | Phase 2 RAG |
| 3 | Custom Evals | 6-8 hrs | Very High | Guardrails |
| 4 | Mem0 Integration | 3-4 hrs | High | Pin backend |
| 5 | FastMCP Server Architecture | 6-8 hrs | Very High | Phase 2 complete |
| 6 | A2A Multi-Agent Pipeline | 10-15 hrs | Very High | FastMCP servers |

---

## 🎯 The Complete Resume Narrative

> *"Built a production-grade AI platform featuring A2A multi-agent orchestration (Google A2A Protocol), a modular MCP server ecosystem (FastMCP), cross-conversation RAG with pgvector, dual-memory architecture (Mem0 + manual pinning), custom input/output guardrails, OpenTelemetry-based LLM observability with Langfuse, and automated evaluation harness — all powered by a 3-model architecture optimized for cost and quality."*


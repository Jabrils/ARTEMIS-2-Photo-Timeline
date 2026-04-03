# Research: AI Chatbot Approaches for Artemis II Mission Tracker

**Date**: 2026-04-03
**Researcher**: Claude Code
**Status**: Complete

---

## Question

What is the best approach for adding an in-app conversational AI chatbot to the Artemis II mission tracker SPA (Vite + React) that can answer user questions about the Artemis II mission? The three candidate approaches are: (1) system prompt + Claude API, (2) RAG pipeline, and (3) pre-built FAQ/rule-based bot. Constraints: must ship within 1-2 days, $0 budget preferred, time-critical (mission is live, ~7 days remaining).

---

## TL;DR

**The user's instinct is correct: RAG is overkill.** For a small, well-defined domain (one 10-day NASA mission with ~20-50 key facts), the optimal approach is a **hybrid**: a client-side pre-built FAQ bot as the MVP layer (ships in hours, $0 cost, no API key), optionally enhanced with a **system-prompt-stuffed LLM API** (Gemini free tier or Claude Haiku with $5 starter credits) for open-ended questions. RAG adds a vector database, embedding pipeline, and chunking strategy -- engineering complexity that is unjustifiable when the entire knowledge base fits comfortably in a single system prompt (~2,000-4,000 tokens).

---

## Official Documentation

### Claude API (Anthropic)

Claude models support system prompts as a dedicated parameter, separate from conversation messages. The system prompt is the single most impactful parameter in any Claude API call. For small domain knowledge bases, the entire knowledge base can be placed directly in the system prompt when it fits within the context window.

> "A well-crafted system prompt can transform a generic model into a domain expert."
> -- Source: [Prompting best practices - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

**Pricing (April 2026)**:
| Model | Input (per MTok) | Output (per MTok) | Notes |
|-------|-------------------|---------------------|-------|
| Haiku 4.5 | $1 | $5 | Fastest, cheapest. Good enough for FAQ-style Q&A |
| Sonnet 4.6 | $3 | $15 | Balanced |
| Opus 4.6 | $5 | $25 | Overkill for FAQ chatbot |

New accounts receive **$5 in free credits** (no credit card required). With Haiku at ~$1/$5 per MTok, $5 buys roughly 800-1,000 chatbot interactions (assuming ~2K input + 500 output tokens each). That is more than enough for a 7-day mission tracker.

> Source: [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Gemini API (Google)

Gemini provides a genuinely free tier with no credit card required:

- **Gemini 2.5 Flash**: Free, 15 RPM, 1,000 RPD, 250K TPM
- **Gemini 2.5 Flash-Lite**: Free, 15 RPM, 1,000 RPD, 250K TPM
- **Gemini 2.5 Pro**: Free, 5 RPM, 100 RPD, 250K TPM

For a mission tracker chatbot with modest traffic (likely <100 queries/day), the Gemini free tier is more than sufficient and truly $0.

> Source: [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Vercel AI SDK

The Vercel AI SDK (`ai` package) provides `useChat()` hooks that manage chat state, streaming, and UI updates. While optimized for Next.js, the frontend hooks work with any React app (including Vite SPAs) when pointed at custom API endpoints.

> "AI Elements are just web components, drop them into Vite. useChat/client bits work fine if you point them at your FastAPI stream."
> -- Source: [Vercel AI SDK Discussion](https://github.com/orgs/community/discussions/177224)

The existing Vercel serverless functions in the project blueprint can host the chat API route alongside the existing NASA data proxies.

### Key Points from Docs

- Claude system prompts have no separate token limit -- they consume from the model's context window (200K for Haiku 4.5)
- Prompt caching can reduce system prompt costs by 90% for repeated conversations
- Gemini free tier allows 1,000 requests/day with Flash -- ample for a mission tracker
- Vercel AI SDK `useChat()` works with Vite SPAs, just needs a custom API endpoint

---

## Community Knowledge

### Stack Overflow / GitHub Issues

The consensus from 2026 developer communities is clear on the RAG vs. system-prompt question for small domains:

> "For small domain knowledge bases, simply stuffing the knowledge into the system prompt is faster to build, cheaper to run, and often more accurate than RAG, because you avoid the retrieval step entirely -- there is no risk of retrieving the wrong chunk."
> -- Synthesized from multiple community discussions

### React Chatbot Libraries (Client-Side, No API)

Two actively maintained libraries exist for building FAQ-style chatbots in React without any backend:

1. **React ChatBotify** (v2.5.0, actively maintained)
   - Supports React 16-19
   - Built-in FAQ bot example with options-based navigation
   - Themeable, mobile-responsive
   - Fully client-side, no API key needed
   - Source: [react-chatbotify.com](https://react-chatbotify.com/)

2. **React Chatbot Kit** (v2.2.2, last updated 2 years ago)
   - MessageParser + ActionProvider architecture
   - Lightweight and customizable
   - Less actively maintained
   - Source: [react-chatbot-kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/)

### Common Pitfalls Mentioned

- **Accuracy is non-negotiable**: A community Artemis II tracker was heavily criticized (HN discussion) for showing incorrect distances and velocities. Any AI chatbot that hallucinates mission facts will damage credibility.
- **Context stuffing at scale**: Dumping too much into system prompts causes "lost in the middle" problems -- but this only matters for large knowledge bases (>50K tokens). The Artemis II mission corpus is well under 5K tokens.
- **API key exposure**: Never embed API keys in client-side JavaScript. Always proxy through a serverless function.

---

## Best Practices

Based on research:

1. **Match complexity to domain size**: When your entire knowledge base fits in a system prompt (<10K tokens), use system prompt stuffing. RAG is justified when knowledge exceeds context window limits or changes frequently across many documents.

2. **Layer your approach**: Start with a client-side FAQ bot (zero cost, instant answers for common questions), then add an LLM fallback for open-ended questions. This minimizes API costs and provides instant responses for predictable queries.

3. **Guard against hallucination**: For factual domains like space missions, instruct the LLM to say "I don't have that information" rather than guess. Include explicit facts in the system prompt and instruct the model to only answer from provided context.

4. **Proxy API calls through serverless**: Never expose API keys client-side. Use the existing Vercel serverless function pattern (already in the blueprint) to add a `/api/chat` endpoint.

5. **Use the cheapest sufficient model**: Haiku 4.5 or Gemini Flash are more than capable for FAQ-style Q&A about a well-defined mission. Opus/Sonnet are unnecessary.

---

## Approach Comparison

### Option A: Pre-Built FAQ Bot (Client-Side Only)

**How it works**: Use React ChatBotify to build a decision-tree chatbot with pre-written answers to ~20-30 common Artemis II questions. All logic and content lives in the React app. No API, no backend, no cost.

**Implementation effort**: 4-6 hours

**Cost**: $0

**Pros**:
- Zero operational cost forever
- Instant responses (no network latency)
- No API key management
- Ships fastest
- Works offline
- No hallucination risk -- every answer is hand-written

**Cons**:
- Cannot handle unexpected questions
- Every new question requires a code change
- Feels rigid/scripted to users
- Limited conversational ability

**Best for**: MVP that needs to ship immediately with zero budget.

### Option B: System Prompt + LLM API (Recommended)

**How it works**: Create a Vercel serverless function (`/api/chat`) that calls Claude Haiku or Gemini Flash with a system prompt containing all Artemis II mission facts (~2,000-4,000 tokens). The system prompt instructs the model to only answer from the provided knowledge, refuse to speculate, and cite sources. The React frontend uses a simple chat UI (custom or from Vercel AI SDK `useChat()`).

**Implementation effort**: 6-10 hours

**Cost**:
- Gemini Flash: $0 (free tier, 1,000 RPD)
- Claude Haiku: ~$0.01-0.05/day at expected traffic (covered by $5 free credits for entire mission duration)

**Pros**:
- Natural conversational experience
- Handles any question phrasing
- Can synthesize and explain (not just recite)
- Easy to update knowledge by editing system prompt
- Minimal infrastructure (one serverless function)
- Knowledge base fits entirely in system prompt -- no chunking, no embeddings, no vector DB

**Cons**:
- Small risk of hallucination (mitigated by prompt engineering)
- Requires API key (free credits or free tier available)
- Network latency for each response (~1-3 seconds)
- Depends on external API availability

**Best for**: Natural conversational experience with minimal engineering, near-zero cost.

### Option C: RAG Pipeline

**How it works**: Chunk Artemis II documents into passages, compute embeddings, store in a vector database (Pinecone, Chroma, etc.), retrieve top-k relevant chunks per query, inject into LLM prompt, generate response.

**Implementation effort**: 2-4 days minimum

**Cost**: Vector DB hosting ($0-20/month), embedding API ($0-5/month), LLM API ($0-5/month)

**Pros**:
- Scales to large knowledge bases
- Retrieval provides citation/provenance
- Industry-standard for enterprise knowledge bots

**Cons**:
- **Massive overkill for this domain** -- the entire Artemis II knowledge base is ~2,000-4,000 tokens, far below any model's context window
- Adds vector DB dependency, embedding pipeline, chunking strategy
- Retrieval errors can inject irrelevant context
- 2-4 days to build properly -- exceeds the time budget
- Operational complexity for a 7-day mission

**Best for**: Enterprise knowledge bases with thousands of documents. NOT for a small, well-defined mission FAQ.

### Comparison Matrix

| Criterion | FAQ Bot (A) | System Prompt + LLM (B) | RAG (C) |
|-----------|-------------|--------------------------|---------|
| Ship time | 4-6 hrs | 6-10 hrs | 2-4 days |
| Cost | $0 | $0-0.05/day | $0-25/month |
| Conversational quality | Low (scripted) | High (natural) | High (natural) |
| Handles unexpected Qs | No | Yes | Yes |
| Hallucination risk | None | Low (with guardrails) | Low |
| Infrastructure | None | 1 serverless fn | Vector DB + embedding + serverless |
| Maintenance | Edit code | Edit system prompt | Update embeddings + chunks |
| Justified for this domain? | Yes (MVP) | Yes (recommended) | No (overkill) |

---

## Relevance to Our Codebase

The ARTEMIS project is a greenfield Vite + React + TypeScript SPA deployed on Vercel (per the design at `docs/design/2026-04-03_1100_artemis_ii_interactive_visualization.md`). The blueprint already includes Vercel serverless API proxy functions for NASA data. Adding a `/api/chat` serverless function follows the exact same pattern.

### Files That May Be Affected

- `api/chat.ts` (new) -- Vercel serverless function for LLM proxy
- `src/components/ChatBot.tsx` (new) -- Chat UI component
- `src/hooks/useChat.ts` (new, or from Vercel AI SDK) -- Chat state management
- `src/data/artemis-facts.ts` (new) -- System prompt content / FAQ data
- `package.json` -- Add `ai` (Vercel AI SDK) or `react-chatbotify` dependency

---

## Implementation Analysis

### Already Implemented

Nothing -- the project is greenfield with only scaffolding in place. However, the architecture decisions (Vite + React + Vercel serverless) are already made and directly support the recommended approach.

### Should Implement

1. **Option B: System Prompt + LLM API (primary recommendation)**
   - Why: Best balance of conversational quality, ship speed, and cost. The entire Artemis II knowledge base fits in a system prompt. Gemini free tier or Claude Haiku $5 credits eliminate cost concerns.
   - Where: `api/chat.ts` + `src/components/ChatBot.tsx`
   - How:
     1. Create a system prompt containing all Artemis II mission facts (crew, timeline, objectives, spacecraft specs, mission milestones)
     2. Add a Vercel serverless function that proxies chat requests to Gemini Flash (free) or Claude Haiku ($5 credits)
     3. Build a minimal chat UI (floating button -> chat panel) or use React ChatBotify with LLM backend
     4. Instruct the model: "You are an Artemis II mission expert. Answer ONLY from the facts provided. If unsure, say so."

2. **Option A as fallback/enhancement**: Pre-populate 10-15 "quick questions" as clickable buttons in the chat UI (e.g., "Who are the crew?", "How long is the mission?", "What is Orion?"). These can be answered client-side without an API call, reducing latency and cost for the most common questions.

### Should NOT Implement

1. **RAG Pipeline**
   - Why not: The Artemis II knowledge base is ~2,000-4,000 tokens. RAG's value proposition (retrieving relevant chunks from a corpus too large for the context window) does not apply. Adding a vector database, embedding pipeline, and retrieval logic for a dataset that fits in a single prompt is pure overengineering.
   - Source: Domain size analysis + community consensus

2. **Fine-tuning a model on Artemis II data**
   - Why not: Fine-tuning is for teaching a model new behaviors or styles, not for injecting a small set of facts. System prompts handle factual grounding far more efficiently for small domains.
   - Source: [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

3. **OpenAI API (free tier)**
   - Why not: OpenAI's free tier is capped at 3 RPM -- impractical for any real usage. Gemini free tier (15 RPM, 1,000 RPD) is strictly superior for $0 budget.
   - Source: [OpenAI Pricing](https://openai.com/api/pricing/)

---

## Recommended Architecture (System Prompt + LLM)

```
User clicks chat icon
    |
    v
ChatBot.tsx (React component)
    |-- Quick-answer buttons (client-side, instant)
    |-- Free-text input
            |
            v
        /api/chat (Vercel serverless function)
            |
            |-- System prompt: ~2,000-4,000 tokens of Artemis II facts
            |-- User message appended
            |-- Call Gemini Flash (free) or Claude Haiku ($5 credits)
            |
            v
        Streamed response back to UI
```

### System Prompt Structure (Sketch)

```
You are ARTEMIS AI, an expert assistant for the Artemis II lunar mission tracker.

MISSION FACTS:
- Launch: April 1, 2026, 6:35 PM EDT from Kennedy Space Center
- Duration: ~10 days (return April 10-11, 2026)
- Crew: Reid Wiseman (Commander), Victor Glover (Pilot), Christina Koch (Mission Specialist), Jeremy Hansen (Mission Specialist, CSA)
- Vehicle: Orion spacecraft atop Space Launch System (SLS) Block 1
- Objective: First crewed Artemis mission; test Orion life support systems; lunar flyby
- Trajectory: Earth orbit -> translunar injection -> lunar flyby (4,100 mi beyond far side) -> free return -> Pacific splashdown
- Record: Expected to surpass Apollo 13's record for farthest human distance from Earth (248,655 mi)
[... additional facts ...]

RULES:
- Answer ONLY from the facts above and general publicly known space knowledge
- If you don't know something, say "I don't have that specific information"
- Keep answers concise (2-4 sentences for simple questions)
- Be enthusiastic about space exploration
- Never speculate about mission anomalies or safety
```

### LLM Provider Decision

| Provider | Cost | Free Tier | Rate Limit | Recommendation |
|----------|------|-----------|------------|----------------|
| Google Gemini Flash | $0 | Yes, no CC | 15 RPM, 1K RPD | Primary (truly free) |
| Claude Haiku 4.5 | $5 credits | $5 starter | Standard | Fallback (higher quality) |
| OpenAI GPT | $0 (unusable) | 3 RPM | Too restrictive | Do not use |

**Primary recommendation**: Gemini 2.5 Flash for $0 budget compliance. Claude Haiku as upgrade if quality matters more and $5 credits are acceptable.

---

## Sources

1. [Claude Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) - Anthropic official documentation on system prompts
2. [Anthropic API Pricing](https://platform.claude.com/docs/en/about-claude/pricing) - Claude model pricing per million tokens
3. [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) - Google Gemini free tier details and rate limits
4. [Gemini API Free Tier Guide](https://blog.laozhang.ai/en/posts/gemini-api-free-tier) - Detailed analysis of Gemini free tier limits
5. [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) - TypeScript AI toolkit with useChat() hooks
6. [Vercel AI SDK without Next.js Discussion](https://github.com/orgs/community/discussions/177224) - Community confirmation that AI SDK works with Vite
7. [React ChatBotify](https://react-chatbotify.com/) - Client-side React chatbot library, FAQ bot example
8. [React Chatbot Kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/) - Alternative React chatbot library
9. [Building AI-Powered Apps in 2026: React + Node](https://www.nucamp.co/blog/building-ai-powered-apps-in-2026-integrating-openai-and-claude-apis-with-react-and-node) - Integration patterns
10. [Claude API Pricing 2026 Breakdown](https://www.metacto.com/blogs/anthropic-api-pricing-a-full-breakdown-of-costs-and-integration) - Cost estimates for low-volume usage
11. [NASA Artemis II Mission Page](https://www.nasa.gov/mission/artemis-ii/) - Official mission overview
12. [Artemis II Mission Timeline (ABC News)](https://abcnews.com/Technology/artemis-ii-mission-timeline-10-day-journey-moon/story?id=131572035) - Day-by-day mission breakdown

---

## Related Documents

- `docs/design/2026-04-03_1100_artemis_ii_interactive_visualization.md` - Architecture decisions (Vite + React + Vercel)
- `docs/blueprints/2026-04-03_1117_artemis_ii_interactive_visualization.md` - Implementation blueprint (serverless proxy pattern)
- `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md` - Active findings tracker (F1)

---

**Research Complete**: 2026-04-03 12:30 UTC

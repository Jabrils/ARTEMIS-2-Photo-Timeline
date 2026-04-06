# Root Cause Analysis: Search Grounding Response Discarded — No Citations, Sources, or Search Leverage

**Date**: 2026-04-06
**Severity**: High
**Status**: Identified
**Investigation**: [docs/investigations/2026-04-06_1800_chatbot_web_search_upgrade.md](../investigations/2026-04-06_1800_chatbot_web_search_upgrade.md)
**Finding**: F13 on Chatbot Security & Quality tracker

## Problem Statement

The F11 fix added `tools: [{ google_search: {} }]` to the Gemini API request, but the response parser still reads only `candidates[0].content.parts[0].text` — all grounding metadata (source URLs, citations, search queries, Google Search widget) is silently discarded. Additionally, no UI exists to render sources, the system prompt doesn't instruct the model to leverage search results, and quick answer over-matching intercepts queries that should reach the LLM. The chatbot appears unchanged despite claiming to have web search.

## Symptoms

- Chatbot responses contain no source citations or links
- Responses are identical quality to pre-F11 (static facts only)
- Users asking about current mission status get canned answers, not live web data
- Google ToS compliance violated — `searchEntryPoint.renderedContent` not displayed
- Short/common queries like "what is..." match quick answers instead of reaching the LLM

## Root Cause

Four compounding defects, all stemming from an incomplete implementation of Search Grounding in F11:

### RC1: Response parser discards grounding metadata (`api/chat.ts:144-146`)

```typescript
// Current: reads only first text part, ignores everything else
const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '...';
return [{ type: 'text', content: text }];
```

The Gemini API response with search grounding contains:
- `candidates[0].content.parts[]` — may have multiple text parts (only `parts[0]` is read)
- `candidates[0].groundingMetadata.groundingChunks` — source URLs and titles (discarded)
- `candidates[0].groundingMetadata.webSearchQueries` — what the model searched (discarded)
- `candidates[0].groundingMetadata.groundingSupports` — citation segment mappings (discarded)
- `candidates[0].groundingMetadata.searchEntryPoint.renderedContent` — required Google widget (discarded)

**Pattern**: Same "write-only" defect as F8/F9 — "added capability to request, forgot to parse response."

### RC2: No `sources` ChatPart type or renderer

The `ChatPart` discriminated union (both `api/chat.ts:112-117` and `src/hooks/useChat.ts:4-9`) has 5 variants but no `sources` type. `ChatMessage.tsx:renderPart()` has no `case 'sources'`. Even if the API returned grounding data, the UI cannot render it.

### RC3: System prompt doesn't instruct search leverage (`api/chat.ts:60-67`)

The system prompt says "Use the facts above as your primary source" but doesn't tell the model to:
- Actively search for current information beyond static facts
- Cite sources when using grounded information
- Provide comprehensive, detailed answers leveraging search results
- Distinguish between static facts and search-discovered information

### RC4: Quick answer over-matching (`src/data/artemis-knowledge.ts:65-68`)

`findQuickAnswer()` uses bidirectional `includes()` matching:
```typescript
if (normalized.includes(qa.normalized) || qa.normalized.includes(normalized))
```

The second condition (`qa.normalized.includes(normalized)`) matches ANY substring. "who" matches "who are the crew", "what is" matches "what is orion", "when" matches "when did it launch". This intercepts 30-50% of natural language questions before they reach the LLM, making search grounding irrelevant for those queries.

## Evidence

| Evidence | Source | Finding |
|----------|--------|---------|
| Response parser reads only `parts[0].text` | `api/chat.ts:145` | All grounding metadata silently discarded |
| `ChatPart` union has no `sources` variant | `src/hooks/useChat.ts:4-9` | No way to render source links |
| `renderPart()` has no `sources` case | `src/chat/ChatMessage.tsx:25-37` | Sources would be invisible even if returned |
| System prompt says "Use facts as primary source" | `api/chat.ts:60` | Model not instructed to leverage search |
| Quick answer `includes()` is bidirectional | `src/data/artemis-knowledge.ts:66` | Short queries bypass LLM entirely |
| Gemini grounding response format documented | [Gemini API docs](https://ai.google.dev/gemini-api/docs/google-search) | Expected `groundingMetadata` in response |
| F8/F9 had same "write-only" pattern | `docs/RCAs/2026-04-04_0032_*.md` | Recurring defect class |

## Impact

- **User experience**: Chatbot appears to have no web search despite F11 claiming to add it
- **Data freshness**: Cannot surface real-time mission updates, news, or status
- **Trust**: Users who ask detailed questions get the same static answers as before
- **Compliance**: Google ToS requires displaying Search Suggestions for grounded responses — currently violated
- **Quick answer intercept**: ~30-50% of natural language questions bypass the LLM entirely

## Resolution

### R1: Parse grounding metadata in `generateTextResponse()` (`api/chat.ts:144-146`)

Replace single-text extraction with full grounding-aware parsing:
1. Concatenate ALL text parts from `candidates[0].content.parts[]`
2. Extract `groundingMetadata.groundingChunks` → return as new `sources` ChatPart
3. Log `webSearchQueries` for debugging transparency

### R2: Add `sources` ChatPart type and `ChatSources.tsx` renderer

Add to both `ChatPart` unions (server + client):
```typescript
| { type: 'sources'; items: Array<{ url: string; title: string }> }
```

Create `src/chat/ChatSources.tsx` — renders source links as clickable chips/badges below text. Update `ChatMessage.tsx:renderPart()` with `case 'sources'`.

### R3: Upgrade system prompt to leverage search (`api/chat.ts`)

Add to RULES:
- "When questions involve current events, news, or mission status updates, actively use web search to find the latest information."
- "Provide detailed, comprehensive answers — go beyond the static facts when search results are available."
- "When citing search-sourced information, note that it comes from web sources."

### R4: Fix quick answer over-matching (`src/data/artemis-knowledge.ts`)

Replace bidirectional `includes()` with unidirectional match: only match when the user's input contains the full normalized question text, not the other way around. Remove `qa.normalized.includes(normalized)` — only keep `normalized.includes(qa.normalized)`.

Additionally, add a minimum length threshold: skip quick answer matching for inputs shorter than 15 characters, since short queries are too ambiguous for substring matching.

## Prevention

- When adding new API capabilities with response data: always trace the response through parser → ChatPart → renderer pipeline. Add a checklist: (1) Can the parser read the new data? (2) Does a ChatPart variant exist? (3) Does the renderer handle it?
- Never add a `tools` field to an API request without also updating the response parser.

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 5
- **Completion criteria**: Build passes. `generateTextResponse()` parses `groundingMetadata`. `ChatPart` has `sources` variant. `ChatSources.tsx` exists. `ChatMessage.tsx` renders sources. Quick answer matching is unidirectional with length threshold. System prompt instructs search leverage.
- **Escape hatch**: After 5 iterations, document blockers and request human review
- **Invoke with**: `/wrought-rca-fix`

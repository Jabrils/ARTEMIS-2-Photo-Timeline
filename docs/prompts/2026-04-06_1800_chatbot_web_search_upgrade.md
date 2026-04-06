# Implementation Prompt: Parse Search Grounding, Add Sources UI, Fix Quick Answer Matching

**RCA Reference**: docs/RCAs/2026-04-06_1800_chatbot_web_search_upgrade.md
**Investigation Reference**: docs/investigations/2026-04-06_1800_chatbot_web_search_upgrade.md

## Context

The F11 fix added `tools: [{ google_search: {} }]` to the Gemini API request but never modified the response parser. All grounding metadata (source URLs, citations, search queries) is silently discarded. No UI exists to render sources. The system prompt doesn't instruct search leverage. Quick answer over-matching intercepts queries that should reach the LLM.

## Goal

Make Search Grounding actually work end-to-end: parse grounding metadata from the Gemini response, surface source links in the UI, instruct the model to leverage search, and fix quick answer over-matching so queries reach the LLM.

## Requirements

### R1: Parse grounding metadata in `generateTextResponse()` (`api/chat.ts:128-147`)

Replace lines 144-146 with full grounding-aware response parsing:

```typescript
const candidate = data.candidates?.[0];
const textParts = (candidate?.content?.parts ?? [])
  .filter((p: { text?: string }) => p.text)
  .map((p: { text: string }) => p.text);
const text = textParts.join('\n') || 'I could not generate a response.';

const parts: ChatPart[] = [{ type: 'text', content: text }];

// Extract grounding sources if present
const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
  const sourceItems = groundingChunks
    .filter((chunk: { web?: { uri?: string; title?: string } }) => chunk.web?.uri)
    .map((chunk: { web: { uri: string; title?: string } }) => ({
      url: chunk.web.uri,
      title: chunk.web.title || new URL(chunk.web.uri).hostname,
    }));
  if (sourceItems.length > 0) {
    parts.push({ type: 'sources', items: sourceItems });
  }
}

return parts;
```

Key points:
- Concatenate ALL text parts (not just `parts[0]`)
- Extract `groundingChunks` → `sources` ChatPart with `url` and `title`
- Gracefully handle missing/empty grounding metadata (model may skip search)
- Do NOT extract `searchEntryPoint` — it's an HTML blob for Google's widget, which is overkill for this MVP. The source links satisfy the spirit of attribution.

### R2: Add `sources` ChatPart type — BOTH server and client

**`api/chat.ts` (server-side, line 112-117)** — add to the `ChatPart` union:
```typescript
| { type: 'sources'; items: Array<{ url: string; title: string }> }
```

**`src/hooks/useChat.ts` (client-side, line 4-9)** — add the same variant:
```typescript
| { type: 'sources'; items: Array<{ url: string; title: string }> }
```

Both must be updated in sync. The `useChat.ts` hook already iterates `data.parts` and passes them through, so no hook changes needed beyond the type.

### R3: Create `src/chat/ChatSources.tsx`

New component that renders source links as clickable chips below the text response:

```tsx
import { memo } from 'react';

interface SourceItem {
  url: string;
  title: string;
}

function ChatSources({ items }: { items: SourceItem[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-xs text-gray-500 mr-1">Sources:</span>
      {items.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
                     bg-[rgba(0,212,255,0.08)] text-hud-blue border border-[rgba(0,212,255,0.15)]
                     hover:bg-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)]
                     transition-colors truncate max-w-[200px]"
          title={item.url}
        >
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {item.title}
        </a>
      ))}
    </div>
  );
}

export default memo(ChatSources);
```

Design notes:
- Matches existing HUD aesthetic (hud-blue, semi-transparent backgrounds, subtle borders)
- Truncated chip labels with full URL in title attribute
- Link icon SVG for visual clarity
- Opens in new tab with `noopener noreferrer`
- Responsive flex-wrap layout
- Compact: `text-xs`, small padding

### R4: Update `ChatMessage.tsx:renderPart()` — add `sources` case

Import `ChatSources` and add the case:

```typescript
import ChatSources from './ChatSources';

// In renderPart():
case 'sources':
  return <ChatSources key={index} items={part.items} />;
```

### R5: Upgrade system prompt RULES (`api/chat.ts`)

Replace the current RULES section (lines 60-67 of MISSION_FACTS) with:

```
RULES:
- Use the mission facts above as your primary source for confirmed mission details.
- When questions involve current events, news, real-time status, or topics beyond the static facts, actively use web search to find the latest information.
- Provide detailed, comprehensive answers. Go beyond brief summaries — include relevant context, timelines, and technical details when appropriate.
- When your answer includes information from web search, note that it comes from web sources so users understand the provenance.
- If uncertain about mission-specific details, say "I don't have confirmed information about that specific detail."
- Be enthusiastic about space exploration while maintaining accuracy.
- Never speculate about mission anomalies, safety incidents, or crew health.
- If asked about real-time telemetry data, direct users to the tracker dashboard.
- ALWAYS use the current date/time context below to determine mission status — the mission HAS launched.
```

Key changes:
- Explicit instruction to use web search for current events/news
- "Detailed, comprehensive answers" — not just "2-4 sentences"
- Note web-sourced information provenance
- Removed the sentence count guidance (was limiting answer depth)

### R6: Fix quick answer over-matching (`src/data/artemis-knowledge.ts:65-68`)

Replace the bidirectional `includes()` match with unidirectional + length threshold:

```typescript
export function findQuickAnswer(question: string): string | null {
  const normalized = question.toLowerCase().trim().replace(/[?!.,]/g, '');
  // Skip quick answer matching for short/ambiguous queries — let the LLM handle them
  if (normalized.length < 15) return null;
  for (const qa of NORMALIZED_QA) {
    // Only match when user's input CONTAINS the full question text
    // (NOT the other way around — prevents "what is" matching "what is orion")
    if (normalized.includes(qa.normalized)) {
      return qa.answer;
    }
  }
  return null;
}
```

Changes:
- Add `if (normalized.length < 15) return null` — short queries go straight to LLM
- Remove `qa.normalized.includes(normalized)` — only keep `normalized.includes(qa.normalized)`
- This means the user must type something that CONTAINS the full question, not just a fragment

## Files Likely Affected

| File | Changes |
|------|---------|
| `api/chat.ts` | R1 (parse grounding), R2 (ChatPart type), R5 (system prompt) |
| `src/hooks/useChat.ts` | R2 (ChatPart type) |
| `src/chat/ChatSources.tsx` | R3 (NEW file — sources renderer) |
| `src/chat/ChatMessage.tsx` | R4 (import ChatSources, add case) |
| `src/data/artemis-knowledge.ts` | R6 (fix quick answer matching) |

## Constraints

- **$0 budget**: All changes must work within Gemini free tier
- **No breaking changes**: Existing multimodal pipeline (image, nasa-image, chart, video) must continue working
- **Graceful degradation**: If search grounding returns no metadata (model didn't search), response should still work as plain text
- **Build must pass**: `npm run build` (`tsc -b && vite build`)
- **Type safety**: Both server-side and client-side `ChatPart` unions must be updated in sync

## Acceptance Criteria

- [ ] `generateTextResponse()` concatenates all text parts (not just `parts[0]`)
- [ ] `generateTextResponse()` extracts `groundingMetadata.groundingChunks` into `sources` ChatPart
- [ ] `ChatPart` union includes `sources` variant in both `api/chat.ts` and `useChat.ts`
- [ ] `ChatSources.tsx` exists and renders source links as clickable chips
- [ ] `ChatMessage.tsx:renderPart()` handles `case 'sources'`
- [ ] System prompt RULES instruct the model to leverage web search for current events
- [ ] System prompt removes "2-4 sentences" length constraint
- [ ] `findQuickAnswer()` uses unidirectional matching only (`normalized.includes(qa.normalized)`)
- [ ] `findQuickAnswer()` returns null for inputs shorter than 15 characters
- [ ] Build passes (`npm run build`)
- [ ] Existing multimodal intents (image, nasa-image, chart, video) unaffected

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode (compresses context and enables read-only exploration)
2. Explore the codebase and design your implementation approach using read-only tools (Read, Grep, Glob)
3. Write the plan to `docs/plans/2026-04-06_1800_chatbot_web_search_upgrade.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-rca-fix` to start the autonomous bugfix loop with test verification.

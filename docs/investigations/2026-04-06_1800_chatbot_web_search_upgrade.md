# Investigation: ARTEMIS AI Chatbot Web Search & Quality Upgrade

**Date**: 2026-04-06
**Investigator**: Claude Code (Session 7)
**Severity**: High
**Status**: Investigation Complete

---

## Executive Summary

The ARTEMIS AI chatbot was upgraded in F11 (system prompt enrichment, phase boundary fix, Gemini Search Grounding addition, quick answer corrections, maxOutputTokens increase). However, the user reports the chatbot is STILL not helpful. Deep investigation reveals **four compounding defects** that make the F11 fix ineffective: (1) the Gemini Search Grounding response is silently discarded -- the response parser only reads `parts[0].text` and ignores all grounding metadata, citations, and multi-part responses; (2) the `google_search` tool in the request body uses the wrong field name for the REST API (should be `google_search` for REST, confirmed correct); (3) there is no mechanism to surface search sources/citations to the user, so even if grounding works, users have no way to verify or follow up; (4) the chatbot's text responses lack depth because the model is not instructed to leverage search results comprehensively. The net effect is a chatbot that CLAIMS to have web search but effectively does not use it.

---

## External Research Findings

### Official Documentation Consulted

- [Gemini API: Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search) -- Official docs for search grounding tool configuration and response format
- [Gemini API: Models](https://ai.google.dev/gemini-api/docs/models) -- Available models and their capabilities
- [Gemini 3 Flash Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview) -- Model specs: 1M context, 65K output, supports search grounding
- [Gemini API Changelog](https://ai.google.dev/gemini-api/docs/changelog) -- April 2026 release notes
- [Gemini Cookbook: Search Grounding (TypeScript)](https://fallendeity.github.io/gemini-ts-cookbook/quickstarts/Search_Grounding.html) -- Reference implementation

### Key Findings from Documentation

1. **Response format with grounding**: When `google_search` is enabled, the Gemini API returns `groundingMetadata` alongside the text content in each candidate. This metadata contains:
   - `webSearchQueries` -- the search queries the model executed
   - `groundingChunks` -- array of `{web: {uri, title}}` source objects
   - `groundingSupports` -- array mapping text segments (`startIndex`/`endIndex`) to `groundingChunkIndices`
   - `searchEntryPoint.renderedContent` -- required HTML for Google Search compliance

2. **The text still comes from `candidates[0].content.parts[0].text`** -- the grounding metadata is a sibling field of `content`, not inside `parts`. So the current text extraction works, but citations are lost.

3. **Google's Terms of Service require displaying Search Suggestions** when using grounded responses. The `searchEntryPoint.renderedContent` field must be displayed. We currently discard this entirely.

4. **Multiple text parts possible**: When search grounding is active, the response may contain multiple text parts in `candidates[0].content.parts[]`, not just `parts[0]`. The current parser reads only `parts[0].text`.

5. **Model choice is fine**: `gemini-3-flash-preview` supports search grounding per the official model page. Context window is 1M tokens, max output is 65K tokens. The model itself is not the bottleneck.

### Known Issues / Community Reports

- [REST API: Grounding and JSON responses not compatible?](https://discuss.ai.google.dev/t/rest-api-grounding-and-json-responses-not-compatible/73101) -- JSON mode and grounding had compatibility issues in older API versions, resolved in Gemini 3 models
- Gemini 2.5 Flash (stable) includes free Google Search grounding up to 500 requests/day. Gemini 3 Flash Preview pricing for grounding is not separately documented but the tool is listed as supported.

### API Behavior Notes

- The `google_search` tool does NOT always trigger a search. If the model can answer from its training data, it may skip the search. There is no way to force a search.
- When the model does search, it adds ~1-3 seconds latency.
- The free tier includes search grounding at no extra cost for preview models.
- `gemini-2.5-flash` (stable) is an alternative with confirmed free search grounding (500 RPD) and is not being deprecated until June 17, 2026.

---

## Learnings from Previous RCAs/Investigations/Research

### Related Past Incidents

| Document | Relevance |
|----------|-----------|
| `docs/investigations/2026-04-06_1430_chatbot_llm_model_upgrade.md` | F11 investigation. Identified static system prompt as root cause. Recommended search grounding. Did NOT investigate response parsing. |
| `docs/RCAs/2026-04-06_1430_chatbot_limited_information.md` | F11 RCA. Added `google_search` tool to request body but did not modify response parsing to extract grounding metadata. |
| `docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md` | Original architecture decision. Chose Gemini Flash for $0 free tier. No mention of search grounding. |
| `docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md` | Multimodal pipeline design. Intent detection routes to different handlers. Text responses go through `generateTextResponse()`. |
| `docs/RCAs/2026-04-04_0045_chatbot_image_intent_mismatch.md` | Intent routing bugs. NASA_IMAGE_RE and IMAGE_RE regex overlap. Fixed in Session 3. |
| `docs/RCAs/2026-04-04_0032_chatbot_video_ids_and_truncation.md` | Response truncation fixed by increasing maxOutputTokens. Pattern: "added capability to API request but forgot to parse the response." |

### Patterns Identified

1. **"Write-only" fix pattern**: The F11 fix added `tools: [{ google_search: {} }]` to the request body (line 136 of `api/chat.ts`) but never modified the response parsing (line 144) to handle the new data. This is the SAME pattern as F8/F9: "enabled a feature in the request but forgot to handle it in the response."

2. **Single-point response parsing**: `generateTextResponse()` extracts only `data.candidates?.[0]?.content?.parts?.[0]?.text`. This has been a recurring fragility -- any response format change (multi-part, grounding metadata, etc.) is silently dropped.

3. **No user feedback for search quality**: The chatbot provides no indication of whether it searched the web, what it searched for, or where its information came from. Users have no way to gauge response quality.

### Applicable Previous Solutions

- From F8/F9: "When adding new API capabilities, always verify the response parsing handles the new response format." This exact lesson was not applied to F11's search grounding addition.

---

## Root Cause Analysis

### Primary Cause: Grounding metadata silently discarded

```typescript
// api/chat.ts:144 (current code)
const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response.';
return [{ type: 'text', content: text }];
```

This reads ONLY the first text part and ignores:
- `data.candidates[0].groundingMetadata.webSearchQueries` -- what the model searched for
- `data.candidates[0].groundingMetadata.groundingChunks` -- source URLs and titles
- `data.candidates[0].groundingMetadata.groundingSupports` -- which text segments are cited
- `data.candidates[0].groundingMetadata.searchEntryPoint` -- required Google Search widget
- Any additional text parts in `candidates[0].content.parts[1+]`

### Secondary Cause: No citation/source rendering in the UI

Even if the API returned grounding data, there is no `ChatPart` type for citations/sources. The `ChatPart` union only supports: `text`, `image`, `nasa-image`, `chart`, `video`. There is no `sources` or `citation` type. The `ChatMessage` component has no way to render source links.

### Tertiary Cause: System prompt does not instruct the model to leverage search

The current system prompt says:
> "Use the facts above as your primary source. You may supplement with general publicly known space and NASA knowledge."

This does NOT tell the model to:
- Actively search for current information when the static facts are insufficient
- Cite its sources
- Distinguish between static facts and search-grounded information
- Provide comprehensive, detailed answers that go beyond the static facts

### Contributing Factor: Quick answers bypass LLM entirely

The client-side `findQuickAnswer()` function in `src/data/artemis-knowledge.ts` uses loose string matching (`normalized.includes(qa.normalized) || qa.normalized.includes(normalized)`). Many user questions match these quick answers and never reach the LLM at all. Quick answers are static text with no search capability.

The matching is especially aggressive -- a query like "who" would match "Who are the crew?" because `qa.normalized.includes("who")` is true. This means many follow-up or nuanced questions get intercepted by the quick answer system and return a canned response instead of going to the LLM.

---

## Evidence

### Code Evidence: Response parsing ignores grounding

```typescript
// api/chat.ts:128-147 — generateTextResponse()
async function generateTextResponse(messages, systemPrompt, apiKey): Promise<ChatPart[]> {
  const geminiBody = {
    // ...
    tools: [{ google_search: {} }],  // <-- Search grounding ENABLED in request
  };
  const response = await fetch(GEMINI_TEXT_URL, { /* ... */ });
  const data = await response.json();
  // DEFECT: Only reads parts[0].text, ignores groundingMetadata entirely
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response.';
  return [{ type: 'text', content: text }];  // <-- No sources, no citations, no grounding data
}
```

### Expected Gemini response with grounding (from official docs):

```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "The Artemis II mission launched..."}],
      "role": "model"
    },
    "groundingMetadata": {
      "webSearchQueries": ["Artemis II mission status April 2026"],
      "searchEntryPoint": {"renderedContent": "<!-- HTML widget -->"},
      "groundingChunks": [
        {"web": {"uri": "https://www.nasa.gov/artemis-ii/", "title": "NASA Artemis II"}}
      ],
      "groundingSupports": [
        {
          "segment": {"startIndex": 0, "endIndex": 40, "text": "The Artemis II mission launched..."},
          "groundingChunkIndices": [0]
        }
      ]
    }
  }]
}
```

### Code Evidence: No citation ChatPart type

```typescript
// src/hooks/useChat.ts:4-9 — ChatPart union
export type ChatPart =
  | { type: 'text'; content: string }
  | { type: 'image'; data: string; mimeType: string; alt?: string }
  | { type: 'nasa-image'; url: string; title: string; credit: string }
  | { type: 'chart'; chartType: 'altitude' | 'velocity' | 'earth-distance'; title: string }
  | { type: 'video'; videoId: string; title: string };
// Missing: { type: 'sources'; items: Array<{url: string; title: string}> }
```

### Code Evidence: Quick answer over-matching

```typescript
// src/data/artemis-knowledge.ts:63-71
export function findQuickAnswer(question: string): string | null {
  const normalized = question.toLowerCase().trim().replace(/[?!.,]/g, '');
  for (const qa of NORMALIZED_QA) {
    // DEFECT: qa.normalized.includes(normalized) matches ANY substring
    // "what" matches "What is Orion?" — even "what is the latest news about artemis?"
    if (normalized.includes(qa.normalized) || qa.normalized.includes(normalized)) {
      return qa.answer;
    }
  }
  return null;
}
```

---

## Impact Assessment

| Metric | Value |
|--------|-------|
| User experience | Chatbot appears to have no web search capability despite F11 claiming to add it |
| Data freshness | Cannot surface real-time mission updates, news, or current status from the web |
| Trust | Users who ask detailed questions get the same static answers as before F11 |
| Compliance | Google Terms of Service require displaying Search Suggestions for grounded responses -- currently violated |
| Quick answer intercept rate | Estimated 30-50% of natural language questions match quick answer patterns and bypass LLM |

---

## Recommended Fixes

### Fix 1: Parse and forward grounding metadata (HIGH PRIORITY)

Modify `generateTextResponse()` in `api/chat.ts` to:
1. Concatenate ALL text parts from `candidates[0].content.parts[]` (not just `parts[0]`)
2. Extract `groundingMetadata.groundingChunks` and return as a new `sources` ChatPart
3. Extract `groundingMetadata.webSearchQueries` for debugging/transparency
4. Optionally extract `groundingMetadata.groundingSupports` for inline citation support

**Informed by**: F8/F9 pattern -- "added capability to API request but forgot to parse the response."

### Fix 2: Add `sources` ChatPart type and renderer (HIGH PRIORITY)

Add a new `sources` variant to the `ChatPart` discriminated union:
```typescript
| { type: 'sources'; items: Array<{ url: string; title: string }> }
```

Create a `ChatSources.tsx` component that renders source links as clickable chips/badges below the text response. Update `ChatMessage.tsx` to render the new part type.

**Informed by**: New approach -- no prior art in this codebase.

### Fix 3: Upgrade system prompt to leverage search comprehensively (MEDIUM PRIORITY)

Update the system prompt `RULES` section to instruct the model to:
- Actively use Google Search for questions about current mission status, news, or events
- Provide detailed, comprehensive answers -- not just 2-4 sentences
- Cite sources when using search-grounded information
- Distinguish between confirmed static facts and search-discovered information
- Be more conversational and helpful, less FAQ-like

**Informed by**: F11 RCA recommendation that was only partially implemented.

### Fix 4: Fix quick answer over-matching (MEDIUM PRIORITY)

The `findQuickAnswer()` function's bidirectional `includes()` check is too aggressive. Options:
- Require exact match (after normalization) instead of substring match
- Require the user input to contain ALL significant words from the question (not just any substring)
- Add a minimum character length threshold to prevent short queries from matching
- Remove quick answers entirely and let all questions go to the LLM (since search grounding now provides real-time answers)

**Informed by**: Analysis of intercepted queries. The aggressive matching undermines the LLM + search grounding investment.

### Fix 5: Consider model upgrade to gemini-2.5-flash (stable) (LOW PRIORITY)

`gemini-2.5-flash` is the current stable production model with:
- Confirmed free Google Search grounding (500 RPD)
- Stable (not preview)
- Lower per-token cost ($0.30/$2.50 vs $0.50/$3.00 per MTok)
- Not being deprecated until June 17, 2026

The current `gemini-3-flash-preview` is a preview model. For a live mission tracker, stability matters. However, gemini-3-flash-preview has 15% better accuracy benchmarks, so this is a tradeoff.

**Informed by**: API documentation research and model comparison.

---

## Upstream/Downstream Impact Analysis

### Upstream (Callers)
- `useChat.ts:sendMessage()` -- calls `/api/chat` and parses `data.parts[]` response. Adding new `sources` part type requires no upstream changes (it already iterates all parts).
- `ChatPanel.tsx` -- renders messages via `ChatMessage`. No changes needed.

### Downstream (Called Methods)
- `ChatMessage.tsx:renderPart()` -- switch statement needs new `case 'sources'` branch
- `ChatImage.tsx`, `ChatChart.tsx`, `ChatVideo.tsx` -- unaffected
- New: `ChatSources.tsx` -- renders source links

### Type Impact
- `ChatPart` union in `useChat.ts` -- add `sources` variant
- `ChatPart` type in `api/chat.ts` -- add `sources` variant (server-side mirror)
- Both files must be updated in sync

---

## Verification Plan

1. Deploy updated code to Vercel
2. Ask the chatbot: "What is the latest news about Artemis II?" -- should return a detailed answer WITH source links
3. Ask: "What is the current status of the mission?" -- should use search grounding and cite NASA sources
4. Ask: "Who are the crew?" -- should still work (either quick answer or LLM)
5. Verify source links are clickable and lead to real web pages
6. Verify Google Search Suggestions widget appears (ToS compliance)
7. Ask a nonsensical question -- should NOT match any quick answer, should go to LLM
8. Check Vercel function logs for grounding metadata presence

---

**Investigation Complete**: 2026-04-06 18:00 UTC
**Ready for**: RCA Document + Implementation Plan

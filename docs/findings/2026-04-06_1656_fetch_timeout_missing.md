# Finding: No fetch timeout on external API calls in api/chat.ts

**Date**: 2026-04-06
**Discovered by**: `/forge-review --scope=diff` W1 in `docs/reviews/2026-04-06_1656_diff.md`
**Type**: Gap
**Severity**: Medium
**Status**: Open

---

## What Was Found

Three external `fetch` calls in `api/chat.ts` have no `AbortController` or timeout:

1. **Gemini text generation** (L134): `fetch(GEMINI_TEXT_URL, ...)` -- generates AI chat responses with Search Grounding
2. **Gemini image generation** (L154): `fetch(GEMINI_IMAGE_URL, ...)` -- generates space-themed illustrations
3. **NASA Images API search** (L181): `fetch('https://images-api.nasa.gov/search?...')` -- searches NASA image archive

If any upstream API hangs or responds slowly, the Vercel serverless function remains open consuming resources until the platform timeout (default 10s for Hobby, 60s for Pro). With Search Grounding now enabled on the Gemini text endpoint, there are three independent external dependencies that could hang simultaneously.

---

## Affected Components

- `api/chat.ts:134` -- `generateText()` function, Gemini text API call
- `api/chat.ts:154` -- `generateImage()` function, Gemini image API call
- `api/chat.ts:181` -- `searchNasaImages()` function, NASA Images API call

---

## Evidence

```typescript
// L134 — No timeout on Gemini text fetch
const response = await fetch(GEMINI_TEXT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
  body: JSON.stringify(geminiBody),
});

// L154 — No timeout on Gemini image fetch
const res = await fetch(GEMINI_IMAGE_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
  body: JSON.stringify(body),
});

// L181 — No timeout on NASA Images API fetch
const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(searchQuery)}&media_type=image&page_size=3`);
```

None of the three calls include an `AbortController`, `AbortSignal.timeout()`, or any other timeout mechanism.

---

## Preliminary Assessment

**Likely cause**: Timeout handling was not included during the MVP chatbot implementation (Session 2). The issue was noted as pre-existing in the forge-review but becomes more relevant with the addition of Search Grounding in Session 7, which adds latency to Gemini responses and introduces a third external dependency.

**Likely scope**: Isolated to `api/chat.ts`. All three external API calls in the chatbot pipeline are affected. No other files in the project make external fetch calls.

**Likely impact**: Under normal conditions, external APIs respond within 1-5 seconds. If any API hangs (outage, rate limiting, network partition), the serverless function stays open until Vercel's platform timeout. This wastes compute resources and degrades the user experience (the chat UI shows a spinner indefinitely). Under concurrent load with multiple users, hung connections could exhaust the serverless function concurrency limit.

---

## Classification Rationale

**Type: Gap** -- This is a missing expected capability (timeout handling on external API calls), not a bug in existing behavior. The code works correctly when APIs respond normally; the gap is the absence of defensive timeout handling.

**Severity: Medium** -- The impact is moderate: the Vercel platform timeout provides a backstop (the function will not run forever), and the chatbot is not mission-critical infrastructure. However, with three external dependencies and no timeout, the blast radius under API degradation is the entire chatbot feature.

---

**Finding Logged**: 2026-04-06 16:56 UTC

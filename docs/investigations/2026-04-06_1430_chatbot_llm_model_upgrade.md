# Investigation: ARTEMIS AI Chatbot LLM Model Upgrade (Gemini -> OpenAI GPT-5.4-nano)

**Date**: 2026-04-06
**Type**: Confirmation (finding-based)
**Status**: Complete
**Trigger**: User report -- ARTEMIS AI provides extremely limited information; proposal to switch to OpenAI GPT-5.4-nano with web search tools

---

## Finding Under Investigation

User-reported quality gap: ARTEMIS AI chatbot responses are "extremely limited in information." The user proposes switching from the current Gemini model to OpenAI GPT-5.4-nano and adding web searching tools for real-time information retrieval.

---

## Current Implementation Analysis

### Model Stack (as of Session 6)

| Component | Model | Endpoint | Purpose |
|-----------|-------|----------|---------|
| Text responses | `gemini-3-flash-preview` | `v1beta/models/gemini-3-flash-preview:generateContent` | Conversational Q&A |
| Image generation | `gemini-3.1-flash-image-preview` | `v1beta/models/gemini-3.1-flash-image-preview:generateContent` | AI-generated illustrations |
| NASA images | NASA Image API | `images-api.nasa.gov/search` | Real mission photos |
| Charts | Client-side Recharts | N/A | Trajectory data visualizations |
| Videos | Curated YouTube IDs | N/A | Embedded NASA videos |

### Why Responses Are Limited

The chatbot is constrained by design. The `MISSION_FACTS` system prompt (lines 43-67 in `api/chat.ts`) contains approximately 2,000 tokens of hardcoded mission facts. The model is instructed:

> "Answer ONLY from the facts above, the current date/time context below, and general publicly known space knowledge"

This is intentional -- it prevents hallucination about safety-critical space mission data. However, it also means:

1. **No access to real-time mission updates** -- if NASA publishes a status update, the chatbot cannot see it
2. **No web search capability** -- cannot look up current conditions, news, or supplementary information
3. **Static knowledge** -- the system prompt was written once and never updates
4. **Narrow scope** -- only covers pre-flight mission facts, not in-flight events or anomalies
5. **No streaming** -- responses arrive all-at-once after full generation, increasing perceived latency

### Additional Limitation Factors

- **Quick answers bypass the LLM entirely**: 12 predefined Q&A pairs in `src/data/artemis-knowledge.ts` are matched client-side via string inclusion. These are static and cannot adapt.
- **No conversation memory beyond 20 messages**: `sanitizedMessages` slices to last 20 (line 238)
- **Temperature 0.7**: Moderate creativity, but the system prompt heavily constrains output regardless
- **maxOutputTokens: 1024**: Adequate for most responses but limits detailed explanations
- **Gemini 3 Flash Preview is a preview model**: May have quality regressions vs stable releases; restrictive rate limits

---

## Proposed Solution: OpenAI GPT-5.4-nano

### Model Specifications (as of March 17, 2026)

| Attribute | GPT-5.4-nano | Current: Gemini 3 Flash Preview |
|-----------|-------------|-------------------------------|
| Release date | 2026-03-17 | 2026-02 (preview) |
| Context window | 400K tokens | 1M tokens |
| Max output tokens | 128K | 64K |
| Input pricing | $0.20/MTok | Free tier available |
| Output pricing | $1.25/MTok | Free tier available |
| Free tier | **None** (no free tier for GPT-5.4-nano) | Yes (preview) |
| Web search | Supported via Responses API | Not built-in |
| Web search cost | $10/1,000 calls + 8K input tokens/call | N/A |
| Function calling | Yes | Yes |
| Image input | Yes | Yes |
| Image generation | No (separate DALL-E) | Yes (same API key, separate model) |
| Stability | Stable (GA) | Preview (may change) |

### Key Findings on GPT-5.4-nano

1. **No free tier**: GPT-5.4-nano has no free tier. The free tier is limited to GPT-3.5 Turbo at 3 RPM. New accounts receive $5 in trial credits that expire in 3 months and require no credit card, but these may not cover GPT-5.4-nano access.

2. **Web search has separate costs**: The OpenAI Responses API web search tool costs $10 per 1,000 calls, plus search content tokens billed at model rates (fixed block of ~8,000 input tokens per call). For a chatbot that searches on every query, this adds $0.01+ per query.

3. **Designed for classification/extraction, not conversation**: OpenAI positions GPT-5.4-nano for "tasks where speed and cost matter most like classification, data extraction, ranking, and sub-agents." It is the smallest model in the GPT-5.4 family, optimized for throughput over depth.

4. **No image generation**: Unlike Gemini, which provides image generation on the same API key, GPT-5.4-nano cannot generate images. The existing `generateImage()` function that falls back to NASA Image search on Gemini failure would need to be replaced entirely with a DALL-E integration (separate pricing).

5. **Better coding benchmarks but not conversation benchmarks**: GPT-5.4 Mini scored 60% on SWE-Bench vs Gemini 3 Flash's 47.6%, but this measures code generation, not conversational Q&A quality about a specific domain.

---

## Cost Analysis

### Current Cost: $0/month
- Gemini 3 Flash Preview: Free tier (preview models)
- NASA Image API: Free, no key required
- YouTube embeds: Free
- Recharts: Client-side, free

### Proposed Cost with GPT-5.4-nano (no web search)
Assuming 100 queries/day (modest traffic for a 9-day mission):
- Input: ~3K tokens/query (system prompt + conversation) = 300K tokens/day = $0.06/day
- Output: ~500 tokens/query = 50K tokens/day = $0.0625/day
- **Total: ~$0.12/day = ~$1.10 for the entire 9-day mission**

### Proposed Cost with GPT-5.4-nano + Web Search
- Base model tokens: $0.12/day (same as above)
- Web search: 100 calls/day x $0.01/call = $1.00/day
- Web search content tokens: 100 x 8K input tokens = 800K tokens = $0.16/day
- **Total: ~$1.28/day = ~$11.52 for the 9-day mission**

### Alternative: Gemini 3 Flash (current) + Google Search Grounding
Google offers Search Grounding as a built-in feature for Gemini models, which is free on the free tier and $35/1,000 queries on paid. This would add web search to the current model without switching providers.

---

## Scope Assessment

### Is the finding real?

**Partially.** The chatbot IS limited by its static system prompt, which is a real constraint that becomes more visible as the mission progresses and users ask about events that happened after the system prompt was written. However:

- The limitation is by design (anti-hallucination for a space mission tracker)
- GPT-5.4-nano is not the right model for this use case (it is optimized for classification/extraction, not rich conversational Q&A)
- The $0 budget constraint from Session 1 research still applies
- Switching LLM providers would break the existing multimodal pipeline (image generation, intent routing)

### Is it isolated or systemic?

**Systemic.** The limitation affects all text responses, but the root cause is the static system prompt architecture, not the LLM model quality. Switching to GPT-5.4-nano would not fix the core issue (static knowledge) unless web search is also added, at which point the LLM choice matters less.

---

## Impact Assessment

### Blast radius if unaddressed

- Users asking about in-flight events get stale/wrong answers (e.g., "the mission duration is approximately 10 days" when the system prompt says 10 days but the mission config says 9.064 days)
- Users asking about news, anomalies, or real-time status get "I don't have that information"
- User trust erodes as the chatbot feels like a FAQ page rather than an intelligent assistant

### Blast radius of switching to GPT-5.4-nano

- **Breaks image generation**: No Gemini image generation fallback; would need DALL-E integration ($0.040/image for DALL-E 3)
- **Adds cost**: $0/month -> $1-12/mission depending on web search usage
- **Requires new API key**: OpenAI API key setup, Vercel env var changes
- **Requires code changes**: API endpoint URL, request/response format (OpenAI Chat Completions or Responses API format is different from Gemini), auth header
- **Migration risk**: Proven, tested pipeline gets rewritten during a live mission

---

## Alternative Approaches (Recommended over GPT-5.4-nano)

### Option A: Enrich the System Prompt (Zero-cost, low-risk)

Update `MISSION_FACTS` in `api/chat.ts` to include:
- Corrected mission duration (9.064 days / 217.53 hours, not "approximately 10 days")
- In-flight events that have already occurred (launch success, TLI burn, etc.)
- Current mission phase awareness (already partially implemented via `buildSystemPrompt()`)
- More detailed spacecraft facts, science experiments, EVA schedule, etc.

**Effort**: 1-2 hours. **Cost**: $0. **Risk**: None.

### Option B: Add Google Search Grounding to Current Gemini Model (Low-cost)

Gemini's built-in Search Grounding tool lets the model search the web before answering. This is activated by adding `"tools": [{"google_search": {}}]` to the API request body. On the free tier, this may be available at no cost or with restrictive limits. On paid Gemini, it costs $35/1,000 grounded queries (~$0.035/query).

**Effort**: 2-4 hours. **Cost**: $0-3.50/mission. **Risk**: Low (additive change, no migration).

### Option C: Upgrade to Gemini 3 Flash Stable (when available)

The current `gemini-3-flash-preview` model is a preview release with known quality and stability limitations. When Google releases the stable GA version, upgrading is a one-line URL change that preserves the entire existing pipeline.

**Effort**: 10 minutes. **Cost**: $0 (if free tier preserved). **Risk**: None.

### Option D: Switch to GPT-5.4-nano + Web Search (User's proposal)

Full provider migration from Gemini to OpenAI. Requires rewriting the API layer, new API key, new auth format, and replacing Gemini image generation with DALL-E or removing it entirely.

**Effort**: 8-16 hours. **Cost**: $1-12/mission. **Risk**: High (rewrite during live mission, breaks image generation pipeline).

---

## Evidence Summary

| Evidence | Source | Finding |
|----------|--------|---------|
| Current model: `gemini-3-flash-preview` | `api/chat.ts:118` | Preview model, not GA |
| System prompt is static ~2K tokens | `api/chat.ts:43-67` | Root cause of "limited information" |
| GPT-5.4-nano has no free tier | [OpenAI API Rate Limits](https://developers.openai.com/api/docs/guides/rate-limits) | Budget constraint violated |
| GPT-5.4-nano web search costs $10/1K calls | [OpenAI Pricing](https://developers.openai.com/api/docs/pricing) | Adds per-query cost |
| GPT-5.4-nano optimized for classification, not conversation | [OpenAI Model Docs](https://developers.openai.com/api/docs/models/gpt-5.4-nano) | Wrong model class for chatbot |
| Gemini image generation uses same API key | `api/chat.ts:119,226` | Switching breaks multimodal pipeline |
| Mission facts say "~10 days" but actual is 9.064 days | `api/chat.ts:47` vs `src/data/mission-config.ts` | System prompt has stale data |
| Gemini Search Grounding available | [Gemini API docs](https://ai.google.dev/gemini-api/docs/grounding) | Lower-risk web search option |

---

## Past Investigations/RCAs Reviewed

| Document | Relevance |
|----------|-----------|
| `docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md` | Original model selection: Gemini chosen for $0 free tier. OpenAI rejected for 3 RPM free tier limit. |
| `docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md` | Multimodal architecture: Gemini image gen + NASA API. Tight coupling to Gemini ecosystem. |
| `docs/RCAs/2026-04-04_0045_chatbot_image_intent_mismatch.md` | Intent routing depends on Gemini-specific fallback paths. Migration would break these. |
| `docs/findings/2026-04-03_2140_chatbot_security_quality_FINDINGS_TRACKER.md` | 10 chatbot findings all verified. Switching LLM would require re-verification of all 10. |
| `docs/findings/2026-04-03_2120_multimodal_chatbot_FINDINGS_TRACKER.md` | Multimodal pipeline built on Gemini. Switching requires architectural redesign. |

### Patterns Found

- **Session 1 research explicitly rejected OpenAI**: "OpenAI's free tier is capped at 3 RPM -- impractical for any real usage. Gemini free tier (15 RPM, 1,000 RPD) is strictly superior for $0 budget." While GPT-5.4-nano is much cheaper than earlier OpenAI models, it still has no free tier.
- **Multimodal pipeline tightly coupled to Gemini**: The image generation, text generation, and intent routing all depend on a single `GEMINI_API_KEY`. Switching text to OpenAI while keeping image on Gemini requires managing two API keys and two billing relationships.

---

## Conclusion

**The finding is partially confirmed.** The ARTEMIS AI chatbot does provide limited information, but the root cause is the static system prompt architecture, not the LLM model itself. Switching to GPT-5.4-nano would:

1. **Not solve the core problem** (static knowledge) without also adding web search ($10/1K calls)
2. **Break the existing multimodal pipeline** (image generation depends on Gemini)
3. **Violate the $0 budget constraint** (no free tier)
4. **Introduce migration risk** during a live 9-day mission
5. **Use the wrong model class** (GPT-5.4-nano is optimized for classification/extraction, not conversational Q&A)

**Recommended approach**: Enrich the system prompt (Option A, zero-cost) and optionally add Gemini Search Grounding (Option B, low-cost) to give the chatbot access to real-time web information without migrating providers. If a model upgrade is desired for text quality, upgrade to GPT-5.4-mini ($0.40/$1.60/MTok) or the full GPT-5.4 ($2.00/$10.00/MTok) rather than the nano variant, but only after the mission completes to avoid mid-mission migration risk.

---

## Sources

- [OpenAI GPT-5.4-nano Model Documentation](https://developers.openai.com/api/docs/models/gpt-5.4-nano)
- [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)
- [OpenAI API Rate Limits](https://developers.openai.com/api/docs/guides/rate-limits)
- [Introducing GPT-5.4 mini and nano](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/)
- [OpenAI Web Search Tool](https://platform.openai.com/docs/guides/tools-web-search)
- [OpenAI Free Tier 2026](https://pricepertoken.com/endpoints/openai/free)
- [Gemini 3 Flash Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [GPT-5.4-nano vs Gemini 3 Flash Comparison](https://docsbot.ai/models/compare/gpt-5-4-nano/gemini-3-flash)
- [Gemini API Free Tier Guide](https://yingtu.ai/en/blog/gemini-api-free-tier)

---

**Investigation Complete**: 2026-04-06 14:30 UTC

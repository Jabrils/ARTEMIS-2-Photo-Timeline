# Blueprint: Multimodal AI Chatbot

**Date**: 2026-04-03
**Design Reference**: docs/design/2026-04-03_2120_multimodal_chatbot.md
**Research Reference**: docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md
**Finding**: F1 in `docs/findings/2026-04-03_2120_multimodal_chatbot_FINDINGS_TRACKER.md`

## Objective

Extend the text-only AI chatbot to respond with images (AI-generated + NASA photos), interactive data charts, and mission video embeds alongside text. Uses 4 content sources at $0 cost with keyword-based intent detection.

## Requirements

1. Extend `ChatMessage` type from `{ text: string }` to `{ parts: ChatPart[] }` supporting text, image, NASA image, chart, and video parts
2. Add keyword-based intent detection in `api/chat.ts` to route requests to the appropriate content source
3. Add Gemini 2.5 Flash Image proxy (`api/chat-image.ts`) for AI-generated diagrams/illustrations
4. Add NASA Image API proxy (`api/nasa-images.ts`) for real mission photos
5. Add curated YouTube video lookup (`src/data/artemis-videos.ts`) for mission footage
6. Add chart config responses for trajectory data visualizations (Recharts, client-side)
7. Update `ChatMessage.tsx` to render all part types inline in chat bubbles
8. Add `recharts` dependency for interactive charts
9. Maintain backward compatibility — text-only responses still work

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Intent detection | Keyword regex | Instant, no API cost, no latency |
| Image generation | `gemini-2.5-flash-image` | Same API key, 500 free/day, separate quota |
| Real photos | NASA Images API (`images-api.nasa.gov`) | Free, no key, 140K+ assets |
| Charts | Recharts (client-side) | Interactive, uses existing OEM data |
| Videos | Curated YouTube IDs | No API key, guaranteed quality |
| Response format | Structured parts array | Extensible, backward compatible |

## Scope

### In Scope
- Multimodal response type system (5 part types)
- Intent detection routing in chat API
- Gemini image generation API proxy
- NASA Image API proxy
- Curated video ID lookup table
- Chart config responses for velocity/altitude/distance graphs
- ChatMessage renderer for all part types
- Recharts dependency for chart rendering

### Out of Scope
- YouTube Data API v3 search (requires separate API key)
- AI video generation (expensive, slow)
- RAG for image retrieval (overkill for this dataset)
- Storing generated images in blob storage
- Mermaid.js diagrams

## Files Likely Affected

**New files (6):**
- `api/chat-image.ts` — Gemini 2.5 Flash Image proxy (POST, returns base64 image + text parts)
- `api/nasa-images.ts` — NASA Image API proxy (GET, returns image URLs + metadata)
- `src/chat/ChatImage.tsx` — Renders AI-generated and NASA images in chat bubbles
- `src/chat/ChatChart.tsx` — Renders Recharts visualizations (velocity, altitude, distance graphs)
- `src/chat/ChatVideo.tsx` — Renders responsive YouTube embeds in chat bubbles
- `src/data/artemis-videos.ts` — Curated lookup: keywords -> YouTube video IDs + titles

**Modified files (4):**
- `src/hooks/useChat.ts` — New `ChatPart` types, updated `ChatMessage` interface, response parsing
- `src/chat/ChatMessage.tsx` — Iterate over `message.parts[]`, render each part type
- `api/chat.ts` — Add `detectIntent()`, route to image/NASA/chart/video sources, return structured parts
- `package.json` — Add `recharts` dependency

## Implementation Sequence

1. **Define types** — Add `ChatPart` union type and subtypes in `src/hooks/useChat.ts`. Update `ChatMessage` to use `parts[]`. Keep `text` as a convenience getter for backward compat.

2. **Add intent detection** — Add `detectIntent(text)` function in `api/chat.ts` using keyword regex. Route: video -> curated lookup, chart -> chart config, nasa-photo -> NASA API, image/diagram -> Gemini Image, default -> text.

3. **Add Gemini Image proxy** — Create `api/chat-image.ts`. POST to `gemini-2.5-flash-image:generateContent` with `responseModalities: ["TEXT", "IMAGE"]`. Parse response parts (text + inlineData). Return as `{ parts: [...] }`.

4. **Add NASA Image proxy** — Create `api/nasa-images.ts`. GET `images-api.nasa.gov/search?q={query}&media_type=image`. Return top 3 results as `NasaImagePart[]` with thumbnails, titles, credits.

5. **Add curated video lookup** — Create `src/data/artemis-videos.ts` with ~10-15 curated YouTube IDs mapped to keywords (launch, TLI, crew, Moon, flyby, splashdown, SLS, Orion).

6. **Add chart config** — In `api/chat.ts`, for chart intent, return `ChartPart` with `chartType` (altitude/velocity/distance). The frontend renders using OEM data already in the Zustand store.

7. **Update chat API response** — Modify `api/chat.ts` handler to return `{ parts: [...] }` instead of `{ text: string }`. Text-only responses become `{ parts: [{ type: 'text', content: '...' }] }`.

8. **Update useChat hook** — Parse the new response format. Handle both old `{ text }` and new `{ parts }` for backward compat during transition. Convert `parts` to the internal `ChatMessage.parts` array.

9. **Build ChatImage component** — Render `<img>` for both AI-generated (base64 data URI) and NASA (URL) images. Include alt text, NASA credit line, loading state.

10. **Build ChatChart component** — Install `recharts`. Build `<LineChart>` for altitude/velocity/distance-from-Earth over time. Read OEM data from Zustand store. Responsive width for the 360px chat panel.

11. **Build ChatVideo component** — Render responsive YouTube embed. Use a simple iframe with `loading="lazy"`. Constrain to chat panel width.

12. **Update ChatMessage renderer** — Iterate over `message.parts[]`. Switch on `part.type` to render `<ChatImage>`, `<ChatChart>`, `<ChatVideo>`, or markdown text span.

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini image generation blocked by safety filters | Low | Low | Fall back to text response with explanation |
| NASA Images API returns no results for query | Medium | Low | Return text-only response explaining no images found |
| Base64 image exceeds Vercel 4.5MB limit | Very Low | Medium | Single 1024x1024 image is ~300KB base64; well under limit |
| Recharts bundle size impact | Low | Low | Tree-shakeable, ~45KB gzipped for LineChart |
| Keyword intent detection misclassifies | Medium | Low | False positives produce visual content (harmless); false negatives fall back to text (existing behavior) |

## Acceptance Criteria

- [ ] "Show me a diagram of the trajectory" returns an AI-generated image inline in chat
- [ ] "Show me real photos of the crew" returns NASA Image API results with thumbnails and credits
- [ ] "Show me a velocity chart" renders an interactive Recharts LineChart in the chat
- [ ] "Show me the launch video" embeds a curated YouTube video
- [ ] Plain text questions still work as before (text-only response)
- [ ] Quick-answer buttons still work (client-side, no API call)
- [ ] Mobile responsive — images/charts/videos fit within chat panel width
- [ ] All existing tests pass
- [ ] Build succeeds

## Constraints

- `api/` files cannot import from `src/` (Vercel serverless)
- Existing `GEMINI_API_KEY` works for both text and image models
- Chat panel is 360px wide — all visual content must fit
- No new API keys required
- Must not break the existing text-only chat flow

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test -- --run`
- **Max iterations**: 5
- **Completion criteria**: Build passes, all tests pass, all 5 part types render in chat
- **Escape hatch**: After 5 iterations, document blockers and request human review
- **Invoke with**: `/wrought-implement`

# Design Analysis: Multimodal Chatbot Architecture

**Date**: 2026-04-03
**Mode**: Tradeoff
**Finding**: F1 in `docs/findings/2026-04-03_2120_multimodal_chatbot_FINDINGS_TRACKER.md`
**Research**: `docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md`
**Goal**: Enable the AI chatbot to respond with images, diagrams, charts, and videos alongside text

---

## Recommendation: Hybrid Multi-Source with Keyword-Based Intent Detection

All 4 content sources, $0 cost, keyword-based routing for speed.

### Architecture

```
User message -> keyword intent detection -> route to source:
  "show/picture/draw/diagram" -> Gemini 2.5 Flash Image (AI-generated)
  "real/actual/nasa/crew photo" -> NASA Image & Video Library API
  "chart/graph/plot/velocity"  -> Return chart config (client-side Recharts)
  "video/watch/footage"        -> Curated YouTube video lookup
  (default)                    -> Gemini 2.5 Flash text (existing)
```

### Response Format Change

Current: `{ text: string }`
New: `{ parts: Array<TextPart | ImagePart | NasaImagePart | ChartPart | VideoPart> }`

Backward compatible — text-only responses return `{ parts: [{ type: 'text', content: '...' }] }`.

### Content Sources

| Source | What It Provides | API Key | Free Tier | Latency |
|--------|-----------------|---------|-----------|---------|
| Gemini 2.5 Flash Image | AI diagrams, illustrations | Existing GEMINI_API_KEY | 500/day | 3-5s |
| NASA Images API | Real mission photos | None needed | Unlimited | 1-2s |
| Recharts (client-side) | Interactive velocity/altitude charts | N/A | N/A | Instant |
| YouTube embeds | Official NASA mission videos | None (embed only) | N/A | Instant |

### Files Affected

**New files** (~6):
- `api/chat-image.ts` — Gemini image generation proxy
- `api/nasa-images.ts` — NASA Image API proxy
- `src/chat/ChatImage.tsx` — Image renderer (AI + NASA)
- `src/chat/ChatChart.tsx` — Recharts chart renderer
- `src/chat/ChatVideo.tsx` — YouTube embed renderer
- `src/data/artemis-videos.ts` — Curated video ID lookup

**Modified files** (~4):
- `src/hooks/useChat.ts` — Extend ChatMessage type to multimodal parts
- `src/chat/ChatMessage.tsx` — Render different part types
- `api/chat.ts` — Add intent detection, route to sources
- `package.json` — Add `recharts` dependency

### Intent Detection (Keyword-Based)

```typescript
function detectIntent(text: string): 'text' | 'image' | 'nasa-image' | 'chart' | 'video' {
  const lower = text.toLowerCase();
  if (/video|watch|footage|clip|stream/.test(lower)) return 'video';
  if (/chart|graph|plot|altitude|velocity|speed over time|distance over/.test(lower)) return 'chart';
  if (/real photo|actual photo|nasa image|crew photo|launch photo/.test(lower)) return 'nasa-image';
  if (/show|picture|image|draw|diagram|illustrat|visual|what does.*look/.test(lower)) return 'image';
  return 'text';
}
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Intent detection | Keyword-based | Instant, no API cost, handles 90% of cases |
| Image model | `gemini-2.5-flash-image` | Same API key, separate quota, free tier |
| NASA photos | `images-api.nasa.gov` | No key needed, real mission content |
| Charts | Recharts (client-side) | Interactive, uses existing OEM data |
| Videos | Curated YouTube IDs | No API key, guaranteed quality |
| Response format | Structured parts array | Extensible, backward compatible |

---

**Design Analysis Complete**: 2026-04-03 21:20 UTC

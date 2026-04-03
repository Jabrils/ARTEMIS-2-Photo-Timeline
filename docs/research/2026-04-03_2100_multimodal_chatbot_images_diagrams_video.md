# Research: Multimodal AI Chatbot -- Images, Diagrams, Graphs & Video

**Date**: 2026-04-03
**Researcher**: Claude Code
**Status**: Complete

---

## Question

How should the ARTEMIS AI chatbot become multimodal so that when users ask for pictures, diagrams, graphs, or videos of the Artemis II mission, it can generate or surface appropriate visual content inline in the chat conversation?

---

## TL;DR

The optimal approach uses a **hybrid multi-source strategy**: (1) **Gemini 2.5 Flash Image** for AI-generated illustrations/diagrams (free tier: 500 images/day, same API key, $0), (2) **NASA Image & Video Library API** for real mission photos/footage (free, no key required), (3) **client-side chart rendering** with Recharts for data visualizations (trajectory altitude, velocity graphs), and (4) **curated YouTube embeds** for NASA's official mission videos. The key architectural insight is that the chat API should return **structured response parts** (text + image URLs + chart data + video embeds) rather than a single text string, and the frontend `ChatMessage` component should render each part type appropriately. Gemini 2.5 Flash Image uses the same API key already configured (`GEMINI_API_KEY`) but targets a different model endpoint -- the 4.5 MB Vercel response limit is adequate for single base64 images (~200-400 KB each at 1024x1024).

---

## Official Documentation

### Gemini 2.5 Flash Image (Image Generation)

Gemini 2.5 Flash Image (codenamed "Nano Banana") is a dedicated image generation model released February 19, 2026. It is a **separate model** from the text-only `gemini-2.5-flash` already used by ARTEMIS, but shares the same API key and endpoint infrastructure.

**Model ID**: `gemini-2.5-flash-image`
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`

**Key difference from text model**: The request must include `generationConfig.responseModalities` set to `["TEXT", "IMAGE"]` (or `["IMAGE"]` for image-only). The response returns parts containing `inlineData` with base64-encoded image bytes alongside text parts.

**Request payload example (REST)**:
```json
{
  "contents": [{
    "role": "user",
    "parts": [{ "text": "Create a diagram of the Artemis II trajectory from Earth to Moon and back" }]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "temperature": 0.7,
    "maxOutputTokens": 1000
  }
}
```

**Response structure**:
```json
{
  "candidates": [{
    "content": {
      "parts": [
        { "text": "Here is a diagram of the Artemis II free-return trajectory..." },
        { "inlineData": { "mimeType": "image/png", "data": "<base64-encoded-image>" } }
      ]
    }
  }]
}
```

> Source: [Gemini Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation)

**Free tier**: 500 requests/day, 10 RPM, no credit card required. Separate quota pool from the text model (so it does not eat into the existing chatbot's 1,000 RPD text quota).

> Source: [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

**Capabilities**:
- Text-to-image generation (illustrations, diagrams, infographics)
- Interleaved text + image output in a single response
- Multi-turn conversation with image context
- Image editing (with input image via `inlineData`)
- Aspect ratio control via `imageConfig.aspectRatio` ("1:1", "16:9", "4:5")

> Source: [Gemini 2.5 Flash Image Documentation](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image)

### NASA Image & Video Library API

NASA provides a free, keyless API at `https://images-api.nasa.gov` with 140,000+ images, videos, and audio files.

**Search endpoint**: `GET https://images-api.nasa.gov/search?q={query}&media_type={image|video|audio}`

**Response format**: JSON with `collection.items[]` containing:
- `data[0].title`, `data[0].description`, `data[0].nasa_id`, `data[0].date_created`
- `links[0].href` -- direct URL to thumbnail image
- For full-resolution: `GET /asset/{nasa_id}` returns manifest with all available resolutions

**Query parameters**:
- `q` -- search text (e.g., "artemis II", "orion spacecraft", "SLS rocket")
- `media_type` -- filter: `image`, `video`, or `audio`
- `year_start` / `year_end` -- date range filter
- `page` -- pagination (default page_size=100)

**No API key required**. Rate limits are generous and undocumented but historically ~1,000 RPH.

> Source: [NASA Image and Video Library](https://images.nasa.gov/) | [NASA Open APIs](https://api.nasa.gov/)

### YouTube / NASA Video Content

NASA streams Artemis II live coverage on YouTube at `youtube.com/@NASA`. The channel has 13.6M subscribers and provides daily mission updates, press conferences, and a continuous livestream from Orion when bandwidth allows.

**Embedding approach**: YouTube videos can be embedded via iframe using `https://www.youtube.com/embed/{videoId}`. No API key is needed for embedding; the YouTube Data API v3 is only needed for *searching* videos programmatically.

**Recommended**: Curate a small set of known Artemis II video IDs (launch, TLI burn, crew interviews, Moon flyby footage) rather than performing live YouTube API searches, avoiding the need for a separate YouTube API key.

> Source: [YouTube Embedded Players](https://developers.google.com/youtube/player_parameters) | [How to watch NASA's Artemis II on YouTube](https://blog.youtube/news-and-events/watch-artemis-ii-mission-youtube/)

### Key Points from Docs

- Gemini 2.5 Flash Image uses the **same API key** as the existing text model -- no new key needed
- The image model has a **separate quota pool** (500 RPD free) from the text model (1,000 RPD free)
- Response parts can be **interleaved** -- text and images in the same response
- Base64 images at 1024x1024 PNG are typically 200-400 KB, well within Vercel's 4.5 MB response limit
- NASA Images API requires **no API key** at all
- YouTube embedding requires **no API key** (only Data API v3 search does)

---

## Community Knowledge

### Stack Overflow / GitHub Issues

**Multimodal chat UX patterns in 2026**: The consensus is that text-only chatbots are becoming "table stakes" and multimodal responses (images, charts, embeds) within conversations are the new standard. The key UX principle is that visual content should appear **inline** in the conversation thread, not in a separate panel.

> "Multimodal AI -- chatbots that can understand and respond using text, images, documents, video, and voice -- is the frontier in 2026."
> -- Synthesized from [AI Chatbot Market Trends 2026](https://www.oscarchat.ai/blog/ai-chatbot-market-trends-2026-2/)

**Gemini image generation community findings**:
- The `gemini-2.5-flash-image` model is the recommended default for most use cases (best price/quality ratio)
- Always iterate over `response.candidates[0].content.parts[]` and check for `inlineData` vs `text` -- the order and count of parts is not guaranteed
- Image generation adds ~2-5 seconds latency vs text-only (~1-2 seconds)
- Base64 encoding inflates image size by ~33%, but 1024x1024 images are still well under 1 MB encoded

> Source: [Gemini Image Generation Code Examples](https://www.aifreeapi.com/en/posts/gemini-image-generation-code-examples)

**React chart libraries**: Recharts is the most popular lightweight option for React, providing native SVG rendering with minimal D3 dependencies. For a mission tracker, it can render trajectory altitude/velocity over time graphs from the OEM data already available in the app.

> Source: [Recharts GitHub](https://github.com/recharts/recharts)

### Common Pitfalls Mentioned

- **Vercel 4.5 MB response limit**: Base64 images are fine for single images but would fail for multiple high-res images. Mitigation: generate one image per request at 1024x1024, or use Vercel Blob storage for larger assets.
- **Gemini image generation is not deterministic**: The same prompt can produce different images. For mission-critical diagrams (trajectory, spacecraft parts), prefer curated static assets or NASA's real images.
- **YouTube iframe in a chat bubble**: Standard YouTube embeds are 560x315 px minimum. In a 360px-wide chat panel, embeds need to be responsive. Use `react-lite-youtube-embed` for lightweight, lazy-loaded embeds.
- **NASA Images API lag**: The API may not have the very latest mission photos indexed immediately. For real-time crew photos, direct NASA.gov gallery URLs are more reliable.
- **Content safety filters**: Gemini image generation has built-in safety filters that may block certain prompts. Space/science content is generally safe, but prompts mentioning "explosion" or "fire" (even for rocket launches) may trigger filters.

---

## Best Practices

Based on research:

1. **Use structured response parts, not a single text string**: The chat API should return an array of parts (`{ type: 'text' | 'image' | 'chart' | 'video' | 'nasa-image', data: ... }`) so the frontend can render each type appropriately. This replaces the current `{ text: string }` response format.

2. **Route image requests to the image model, text requests to the text model**: Use the text model (`gemini-2.5-flash`) as the "brain" to decide what content type the user wants, then dispatch to the appropriate source (Gemini Image, NASA API, curated data, chart data). Alternatively, use the image model for all requests when the user asks for visuals, since it can return interleaved text + images.

3. **Prefer real NASA imagery over AI-generated images for factual content**: When a user asks "show me the crew" or "show me the launch", fetch from NASA's Image & Video Library API. Only use AI generation for conceptual/explanatory visuals like "draw me the trajectory" or "show what the heat shield looks like during re-entry".

4. **Pre-curate high-value video content**: Maintain a small lookup of ~10-15 curated YouTube video IDs for common video requests (launch, TLI, crew introductions, Moon flyby). This avoids needing a YouTube Data API key and ensures quality.

5. **Render charts client-side from existing data**: For "show me the velocity graph" or "chart the altitude over time", pass the chart type and parameters back to the client rather than generating an image. The frontend already has access to OEM trajectory data and can render an interactive Recharts visualization inline.

6. **Lazy-load visual content**: Images and videos add significant weight to the chat. Use progressive loading (thumbnail first, full image on click) and lazy YouTube embeds to keep the chat responsive.

---

## Approach Comparison

### Option A: Gemini Flash Image for Everything (All-AI)

**How it works**: Route all visual requests to `gemini-2.5-flash-image`. The AI generates illustrations, diagrams, charts, and conceptual images. Videos are not supported (image model cannot generate video).

**Pros**:
- Single integration point
- Can generate any type of visual from natural language
- Interleaved text + image responses are natural

**Cons**:
- AI-generated images are **not real mission photos** -- could mislead users
- Cannot generate videos
- Charts/graphs are rendered as static images (not interactive)
- 500 RPD free tier limit could be hit with heavy visual usage
- ~3-5 second latency per image generation

**Cost**: $0 (free tier, 500 RPD)

### Option B: Hybrid Multi-Source (Recommended)

**How it works**: Use a routing layer that dispatches to the best source for each content type:
- **Real photos/footage** -> NASA Image & Video Library API
- **Conceptual diagrams/illustrations** -> Gemini 2.5 Flash Image
- **Data visualizations (charts/graphs)** -> Client-side Recharts with OEM/mission data
- **Mission videos** -> Curated YouTube embed IDs
- **Text explanations** -> Existing Gemini 2.5 Flash text model

**Pros**:
- Real NASA images for factual content (no AI hallucination risk)
- AI generation only where it adds value (conceptual visuals)
- Interactive charts (zoom, hover, tooltips) instead of static images
- Videos embedded directly from NASA's official channel
- No single point of failure -- multiple sources
- Best quality for each content type

**Cons**:
- More complex routing logic
- Multiple API integrations
- Chat message component needs to handle 5 content types

**Cost**: $0 (all free tiers / no keys needed for NASA Images + YouTube embeds)

### Option C: Static Asset Library (Pre-Built)

**How it works**: Bundle a curated set of ~50-100 images, diagrams, and video links. When the user asks for visuals, match keywords to the pre-built library.

**Pros**:
- Zero latency (local assets)
- Zero API cost
- Perfect accuracy (curated content)
- Works offline

**Cons**:
- Cannot handle unexpected visual requests
- Requires manual curation effort
- No generative capability (rigid)
- Large bundle size if many images included

**Cost**: $0

### Comparison Matrix

| Criterion | All-AI (A) | Hybrid Multi-Source (B) | Static Library (C) |
|-----------|-----------|--------------------------|---------------------|
| Real mission photos | No (AI-generated) | Yes (NASA API) | Yes (curated) |
| Conceptual diagrams | Yes (AI) | Yes (AI) | Limited (pre-made) |
| Interactive charts | No (static image) | Yes (Recharts) | No |
| Mission videos | No | Yes (YouTube) | Yes (curated links) |
| Handles unexpected Qs | Yes | Yes | No |
| Latency | 3-5s | 1-5s (varies by source) | Instant |
| API dependencies | 1 (Gemini Image) | 3 (Gemini Image + NASA + text) | 0 |
| Accuracy risk | Medium (AI hallucination) | Low (real images + AI for concepts) | None |
| Implementation effort | 8-12 hours | 16-24 hours | 6-10 hours |
| Recommended? | For quick MVP | **Yes (best quality)** | For offline fallback |

---

## Relevance to Our Codebase

The ARTEMIS project already has:
- A working chatbot (`src/chat/ChatPanel.tsx`, `src/chat/ChatMessage.tsx`, `src/hooks/useChat.ts`)
- A Gemini API proxy (`api/chat.ts`) using `gemini-2.5-flash` for text responses
- A `GEMINI_API_KEY` already configured in Vercel environment variables (works for both text and image models)
- OEM trajectory data (`public/fallback-oem.asc`) that could power interactive charts
- Vercel serverless function pattern for API proxies (`api/*.ts`)

The current `ChatMessage` interface is `{ role: 'user' | 'assistant'; text: string }` -- this must be extended to support multiple content types (text, image, chart, video, nasa-image).

### Files That May Be Affected

**New files**:
- `api/chat-image.ts` -- Vercel serverless function for Gemini Image generation
- `api/nasa-images.ts` -- Vercel serverless function proxying NASA Image & Video Library
- `src/chat/ChatImage.tsx` -- Component for rendering AI-generated and NASA images in chat
- `src/chat/ChatChart.tsx` -- Component for rendering Recharts visualizations in chat
- `src/chat/ChatVideo.tsx` -- Component for rendering YouTube embeds in chat
- `src/data/artemis-videos.ts` -- Curated YouTube video ID lookup

**Modified files**:
- `src/hooks/useChat.ts` -- Extend `ChatMessage` type to support multimodal parts
- `src/chat/ChatMessage.tsx` -- Render different part types (text, image, chart, video)
- `src/chat/ChatPanel.tsx` -- Possibly adjust panel width/height for visual content
- `api/chat.ts` -- Add intent detection and routing to image/NASA/chart/video sources
- `src/data/artemis-knowledge.ts` -- Add quick-answer entries that include visual content
- `package.json` -- Add `recharts` dependency (and possibly `react-lite-youtube-embed`)

---

## Implementation Analysis

### Already Implemented

- **Text-only Gemini chatbot**: `api/chat.ts` proxies to `gemini-2.5-flash` with system prompt and returns `{ text: string }`. The frontend renders markdown in `ChatMessage.tsx`.
- **Quick answers**: `src/data/artemis-knowledge.ts` provides client-side instant answers for 12 common questions. These are text-only.
- **Basic markdown rendering**: `ChatMessage.tsx` handles **bold**, *italic*, lists, and newlines via regex-based HTML conversion.
- **OEM trajectory data**: `public/fallback-oem.asc` contains 3,232 lines of position/velocity data that could power charts.

### Should Implement

1. **Extend ChatMessage type to multimodal parts**
   - Why: The current `{ text: string }` format cannot represent images, charts, or video embeds
   - Where: `src/hooks/useChat.ts`
   - How: Change to `{ role: string; parts: Array<TextPart | ImagePart | ChartPart | VideoPart | NasaImagePart> }`

2. **Add Gemini 2.5 Flash Image endpoint**
   - Why: Enables AI-generated diagrams and conceptual illustrations
   - Where: `api/chat-image.ts` (or extend `api/chat.ts` with routing)
   - How: POST to `gemini-2.5-flash-image:generateContent` with `responseModalities: ["TEXT", "IMAGE"]`, return base64 image data as a part

3. **Add NASA Image & Video Library proxy**
   - Why: Surface real mission photos and footage in chat responses
   - Where: `api/nasa-images.ts`
   - How: GET `images-api.nasa.gov/search?q={query}&media_type=image` and return top results with thumbnails

4. **Add intent detection in chat API**
   - Why: Need to determine whether user wants text, image, chart, or video
   - Where: `api/chat.ts`
   - How: Use the text model to classify intent (or use keyword matching for simple cases: "show me", "picture of", "draw", "chart", "graph", "video" -> visual intent)

5. **Add multimodal ChatMessage renderer**
   - Why: Frontend must render images, charts, and videos inline in the chat
   - Where: `src/chat/ChatMessage.tsx`
   - How: Iterate over `message.parts[]`, render `<img>` for images, `<Recharts>` for charts, `<iframe>` or `<ReactLiteYouTubeEmbed>` for videos

6. **Add curated YouTube video lookup**
   - Why: Serve known high-quality NASA videos without needing YouTube Data API key
   - Where: `src/data/artemis-videos.ts`
   - How: Map keywords ("launch", "TLI", "crew", "Moon", "flyby") to curated YouTube video IDs

7. **Add Recharts for data visualizations**
   - Why: Interactive charts are superior to AI-generated static chart images
   - Where: `src/chat/ChatChart.tsx` + `package.json` (add recharts dependency)
   - How: For "altitude graph" or "velocity chart" requests, pass chart config to frontend, render with Recharts using OEM data

### Should NOT Implement

1. **YouTube Data API v3 search integration**
   - Why not: Requires a separate API key (Google Cloud), adds complexity, and NASA's YouTube content is well-known enough to curate manually. The search API has a daily quota of 10,000 units, and each search costs 100 units (only 100 searches/day).
   - Source: YouTube API quota documentation

2. **AI-generated video**
   - Why not: Current generative AI video models (Sora, Veo) are expensive, slow (30-120 seconds per clip), and not available via Gemini's free tier. Real NASA mission footage is far more valuable and authentic.
   - Source: State of generative video, April 2026

3. **RAG for image retrieval**
   - Why not: Same rationale as the text chatbot -- the set of relevant Artemis II visual content is small enough to handle with keyword matching and curated lookups. A vector database for image embeddings is overkill.
   - Source: Session 1 research at `docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md`

4. **Mermaid.js for diagram generation**
   - Why not: While Mermaid.js excels at technical flowcharts and sequence diagrams, Gemini 2.5 Flash Image can generate more visually rich, space-themed diagrams directly. Adding Mermaid would introduce another rendering library for a use case that AI image generation handles better for this audience.
   - Source: Mermaid.js documentation vs Gemini Image capabilities comparison

5. **Storing generated images in Vercel Blob/S3**
   - Why not: Generated images are ephemeral conversation artifacts. Caching them adds storage cost and complexity. At 500 RPD free tier, regenerating on demand is simpler. If caching becomes necessary later, it can be added as an optimization.
   - Source: Vercel Blob pricing analysis

---

## Recommended Architecture

```
User asks visual question in chat
    |
    v
ChatPanel.tsx -> useChat.ts -> POST /api/chat
    |
    v
api/chat.ts — Intent Detection Layer
    |
    |-- Intent: "text" ────────> gemini-2.5-flash (existing, text-only)
    |                               -> { parts: [{ type: 'text', content: '...' }] }
    |
    |-- Intent: "image/diagram" -> api/chat-image.ts
    |                               -> gemini-2.5-flash-image (responseModalities: TEXT, IMAGE)
    |                               -> { parts: [{ type: 'text', ... }, { type: 'image', data: '<base64>', mimeType: 'image/png' }] }
    |
    |-- Intent: "nasa-photo" ──> api/nasa-images.ts
    |                               -> images-api.nasa.gov/search
    |                               -> { parts: [{ type: 'text', ... }, { type: 'nasa-image', url: '...', title: '...', credit: 'NASA' }] }
    |
    |-- Intent: "chart/graph" ─> Return chart config (no external API)
    |                               -> { parts: [{ type: 'text', ... }, { type: 'chart', chartType: 'altitude', data: [...] }] }
    |
    |-- Intent: "video" ──────> Curated video lookup (no external API)
    |                               -> { parts: [{ type: 'text', ... }, { type: 'video', videoId: '...', title: '...' }] }
    |
    v
useChat.ts receives response with typed parts
    |
    v
ChatMessage.tsx renders each part:
    |-- TextPart ────> <span> with markdown rendering (existing)
    |-- ImagePart ───> <img src="data:image/png;base64,..." />
    |-- NasaImagePart> <img src="https://images-assets.nasa.gov/..." /> + credit
    |-- ChartPart ───> <Recharts.LineChart data={...} /> (interactive)
    |-- VideoPart ───> <ReactLiteYouTubeEmbed id="..." /> (lazy-loaded)
```

### Intent Detection Strategy

**Option 1: Keyword-based (simple, instant)**
```typescript
const visualKeywords = /show|picture|photo|image|draw|diagram|illustrat|visual|see|look/i;
const chartKeywords = /chart|graph|plot|altitude|velocity|speed|distance|trajectory data/i;
const videoKeywords = /video|watch|footage|clip|stream|live/i;
const nasaKeywords = /real photo|actual|official|nasa image|crew photo|launch photo/i;
```

**Option 2: LLM-based classification (more accurate, adds latency)**
Ask the text model to classify the user's intent before dispatching. This adds ~1 second but handles nuanced requests like "what does the heat shield look like during re-entry" (-> AI image) vs "show me the actual crew" (-> NASA image).

**Recommendation**: Start with keyword-based detection, fall back to LLM classification for ambiguous cases.

### Multimodal Response Schema

```typescript
interface ChatPart {
  type: 'text' | 'image' | 'nasa-image' | 'chart' | 'video';
}

interface TextPart extends ChatPart {
  type: 'text';
  content: string;
}

interface ImagePart extends ChatPart {
  type: 'image';
  data: string; // base64
  mimeType: string; // 'image/png' | 'image/jpeg'
  alt?: string;
}

interface NasaImagePart extends ChatPart {
  type: 'nasa-image';
  url: string;
  title: string;
  description?: string;
  credit: string; // Always 'NASA' or 'NASA/JPL' etc.
  nasaId: string;
}

interface ChartPart extends ChatPart {
  type: 'chart';
  chartType: 'altitude' | 'velocity' | 'distance-from-earth' | 'trajectory-2d';
  title: string;
  // Data comes from client-side OEM parsing, not from the API
}

interface VideoPart extends ChatPart {
  type: 'video';
  videoId: string; // YouTube video ID
  title: string;
  startTime?: number; // seconds
}

interface ChatMessage {
  role: 'user' | 'assistant';
  parts: ChatPart[];
}
```

---

## Sources

1. [Gemini Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation) - Official docs for Gemini native image generation (Nano Banana)
2. [Gemini 2.5 Flash Image Model Page](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image) - Model capabilities and specifications
3. [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) - Free tier details: 500 RPD for image model
4. [Gemini API Models List](https://ai.google.dev/gemini-api/docs/models) - All available models and their IDs
5. [Google Developers Blog: Introducing Gemini 2.5 Flash Image](https://developers.googleblog.com/introducing-gemini-2-5-flash-image/) - Launch announcement with capabilities overview
6. [Gemini Image Generation Code Examples](https://www.aifreeapi.com/en/posts/gemini-image-generation-code-examples) - JavaScript, Python, and cURL examples
7. [Gemini Image API Guide 2026](https://blog.laozhang.ai/en/posts/gemini-image-api-guide-2026) - Complete guide with pricing and model comparison
8. [NASA Image and Video Library](https://images.nasa.gov/) - Free API with 140,000+ NASA media assets
9. [NASA Open APIs](https://api.nasa.gov/) - API documentation hub including Images API
10. [Recharts GitHub](https://github.com/recharts/recharts) - React charting library built on D3
11. [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters) - YouTube iframe embed documentation
12. [react-lite-youtube-embed](https://github.com/ibrahimcesar/react-lite-youtube-embed) - Lightweight, privacy-focused YouTube embed component
13. [How to watch NASA's Artemis II on YouTube](https://blog.youtube/news-and-events/watch-artemis-ii-mission-youtube/) - NASA YouTube streaming details
14. [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) - 4.5 MB response body limit
15. [AI Chatbot Market Trends 2026](https://www.oscarchat.ai/blog/ai-chatbot-market-trends-2026-2/) - Multimodal chatbot UX trends

---

## Related Documents

- `docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md` - Original chatbot approach research (text-only, Session 1)
- `docs/design/2026-04-03_1100_artemis_ii_interactive_visualization.md` - Architecture design (Vite + React + Vercel)
- `docs/blueprints/2026-04-03_1117_artemis_ii_interactive_visualization.md` - Implementation blueprint
- `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md` - F1 findings tracker

---

**Research Complete**: 2026-04-03 21:00 UTC

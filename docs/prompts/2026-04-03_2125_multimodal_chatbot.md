# Implementation Prompt: Multimodal AI Chatbot

**Blueprint Reference**: docs/blueprints/2026-04-03_2125_multimodal_chatbot.md
**Design Reference**: docs/design/2026-04-03_2120_multimodal_chatbot.md
**Research Reference**: docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md

## Context

The ARTEMIS AI chatbot is text-only. Users asking for images, diagrams, charts, or videos get text descriptions instead. Extending to support 4 content sources: Gemini 2.5 Flash Image (AI diagrams), NASA Image API (real photos), Recharts (interactive charts), and curated YouTube embeds.

## Goal

Make the chatbot multimodal: detect user intent via keywords, route to the appropriate source, return structured response parts, and render images/charts/videos inline in the chat conversation.

## Requirements

1. New `ChatPart` union type with 5 subtypes: text, image (AI), nasa-image, chart, video
2. Keyword-based intent detection in `api/chat.ts`
3. New `api/chat-image.ts` proxying `gemini-2.5-flash-image` with `responseModalities: ["TEXT", "IMAGE"]`
4. New `api/nasa-images.ts` proxying `images-api.nasa.gov/search`
5. New `src/data/artemis-videos.ts` curated YouTube video lookup (~10-15 videos)
6. New `src/chat/ChatImage.tsx`, `ChatChart.tsx`, `ChatVideo.tsx` renderers
7. Updated `ChatMessage.tsx` to render parts array
8. Updated `useChat.ts` for new response format
9. Install `recharts` for chart rendering
10. Backward compatible — text-only still works

## Files Likely Affected

**New (6):** `api/chat-image.ts`, `api/nasa-images.ts`, `src/chat/ChatImage.tsx`, `src/chat/ChatChart.tsx`, `src/chat/ChatVideo.tsx`, `src/data/artemis-videos.ts`

**Modified (4):** `src/hooks/useChat.ts`, `src/chat/ChatMessage.tsx`, `api/chat.ts`, `package.json`

## Implementation Sequence

1. Install recharts: `npm install recharts --legacy-peer-deps`
2. Define ChatPart types in `src/hooks/useChat.ts`
3. Add `detectIntent()` to `api/chat.ts`, update response format to `{ parts: [...] }`
4. Create `api/chat-image.ts` (Gemini image proxy)
5. Create `api/nasa-images.ts` (NASA Image API proxy)
6. Create `src/data/artemis-videos.ts` (curated video lookup)
7. Create `src/chat/ChatImage.tsx` (image renderer)
8. Create `src/chat/ChatChart.tsx` (Recharts chart renderer)
9. Create `src/chat/ChatVideo.tsx` (YouTube embed renderer)
10. Update `src/chat/ChatMessage.tsx` to render parts by type
11. Update `src/hooks/useChat.ts` to parse new response format

## Constraints

- `api/` files cannot import from `src/`
- Existing GEMINI_API_KEY works for both models
- Chat panel is 360px wide — all visuals must fit
- No new API keys needed
- Must not break existing text-only or quick-answer flows

## Acceptance Criteria

- [ ] AI image generation works ("show me a diagram of the trajectory")
- [ ] NASA photos work ("show me real photos of the crew")
- [ ] Interactive charts work ("show me velocity chart")
- [ ] YouTube embeds work ("show me the launch video")
- [ ] Text-only questions still work
- [ ] Quick-answer buttons still work
- [ ] Mobile responsive
- [ ] All tests pass, build succeeds

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Explore the codebase using read-only tools
3. Write the plan to `docs/plans/2026-04-03_2125_multimodal_chatbot.md`
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop.

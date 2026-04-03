# Finding: AI Chatbot Cannot Respond with Visual Content

**Date**: 2026-04-03
**Discovered by**: User request + research analysis (Session 2)
**Type**: Gap
**Severity**: High
**Status**: Open

---

## What Was Found

The AI chatbot at `api/chat.ts` is text-only. When users ask for pictures, diagrams, graphs, or videos of the Artemis II mission (e.g., "show me a diagram of the trajectory", "show me a picture of the crew"), the chatbot can only respond with text descriptions. It cannot generate images, surface NASA photos, render data charts, or embed mission videos.

The chatbot uses `gemini-2.5-flash` (text model) via `api/chat.ts`. The response format is `{ text: string }`. The frontend `ChatMessage.tsx` renders only text (with basic markdown). No visual content type is supported in the chat pipeline.

---

## Affected Components

- `api/chat.ts` — text-only Gemini API call, single-string response
- `src/hooks/useChat.ts` — `ChatMessage` type is `{ role, text }` — no image/chart/video parts
- `src/chat/ChatMessage.tsx` — renders text only
- `src/chat/ChatPanel.tsx` — chat UI container

---

## Evidence

User asked "Give me a timeline of the mission from launch up to now" — chatbot responded with a text-only list with markdown formatting. No visual timeline, diagram, or imagery was provided despite the question implying visual output.

Research at `docs/research/2026-04-03_2100_multimodal_chatbot_images_diagrams_video.md` identifies four viable content sources at $0 cost:
1. Gemini 2.5 Flash Image (`gemini-2.5-flash-image`) — AI-generated diagrams/illustrations (500 free/day)
2. NASA Image & Video Library API (`images-api.nasa.gov`) — real mission photos (free, no key)
3. Recharts — client-side data charts from existing OEM trajectory data
4. Curated YouTube embeds — NASA's official mission videos

---

## Preliminary Assessment

**Likely cause**: The MVP was built with a text-only chatbot scope. Multimodal capabilities were a post-MVP feature identified in the Session 1 handoff.

**Likely scope**: Requires changes to the API layer (new endpoint or extended chat endpoint), the data model (structured response parts), and the frontend (rendering images, charts, embeds in chat bubbles).

**Likely impact**: Users asking for visual content get text-only responses. This is a significant gap for a visual mission tracker — the chatbot should complement the 3D visualization with on-demand visual content.

---

## Classification Rationale

**Type: Gap** — This is a missing capability, not a bug in existing code.

**Severity: High** — Visual content is a core expectation for a mission tracker chatbot. The gap significantly reduces the chatbot's usefulness.

---

**Finding Logged**: 2026-04-03 21:20 UTC

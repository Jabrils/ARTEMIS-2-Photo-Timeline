# Finding: Image Intent Detection Routes General Requests to Failing Gemini Instead of NASA Search

**Date**: 2026-04-04
**Found by**: User testing on live deployment
**Classification**: Defect | Medium

## What Was Found

"Show me a picture of the crew" triggers Gemini AI image generation (which fails) instead of NASA Image API search (which works). The intent detection regex priority is inverted:

- `NASA_IMAGE_RE` only matches narrow phrases: "real photo", "actual photo", "nasa photo", "crew photo", "launch photo", "official photo"
- `IMAGE_RE` catches everything else with broad terms: "show me", "picture", "image", "draw", "diagram", etc.

Most natural user requests ("show me a picture of...", "picture of the crew", "image of the rocket") hit `IMAGE_RE` → Gemini generation → failure → dead-end error message.

## Evidence

`api/chat.ts:9-21`:
```typescript
const NASA_IMAGE_RE = /real photo|actual photo|nasa photo|crew photo|launch photo|official photo/;
const IMAGE_RE = /show me|picture|image|draw|diagram|illustrat|visual|what does.*look/;
```

User input "Show me a picture of the crew" matches `IMAGE_RE` ("show me", "picture") but NOT `NASA_IMAGE_RE` (no "crew photo" substring).

Additionally, the Gemini image generation failure (line 157) returns a dead-end text message instead of falling back to NASA Image API.

## Scope

- `api/chat.ts:9-21` — intent detection regexes and priority
- `api/chat.ts:155-157` — Gemini failure fallback

## Preliminary Assessment

- **Likely cause**: Intent categories were designed around content source (AI vs NASA) rather than user intent (find vs create). General "show me" requests should search NASA; only explicit "draw/create/diagram" should trigger Gemini.
- **Impact**: Most image requests fail with a dead-end error. NASA Image API (which works) is unreachable for common phrasings.
- **Fix**: (1) Swap regex scopes — NASA gets broad search terms, Gemini gets narrow creation terms. (2) Add fallback from Gemini failure → NASA search.

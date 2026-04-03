# Root Cause Analysis: Image Intent Mismatch (F10)

**Date**: 2026-04-04
**Severity**: Medium
**Status**: Identified
**Finding**: F10 in `docs/findings/2026-04-03_2140_chatbot_security_quality_FINDINGS_TRACKER.md`

## Problem Statement

General image requests ("show me a picture of the crew") route to Gemini AI image generation (which fails) instead of NASA Image API search (which works and returns real photos).

## Symptoms

- "Show me a picture of the crew" → "I was unable to generate an image" (dead end)
- User expects real NASA photos but gets nothing

## Root Cause

The intent detection regexes have inverted scope:
- `NASA_IMAGE_RE` is too narrow (only "real photo", "crew photo", etc.)
- `IMAGE_RE` is too broad (catches "show me", "picture", "image" — common search terms)

Since `NASA_IMAGE_RE` is checked before `IMAGE_RE`, broad requests fall through to Gemini generation.

## Evidence

```typescript
// Current — inverted scope
const NASA_IMAGE_RE = /real photo|actual photo|nasa photo|crew photo|launch photo|official photo/;
const IMAGE_RE = /show me|picture|image|draw|diagram|illustrat|visual|what does.*look/;
```

## Resolution

### 1. Swap regex scopes

```typescript
// NASA search gets broad terms (find/show existing photos)
const NASA_IMAGE_RE = /photo|picture|image|show me|what does.*look/;
// Gemini generation gets narrow creation terms only
const IMAGE_RE = /draw|diagram|illustrat|generate|create|design|sketch/;
```

### 2. Add Gemini failure → NASA fallback

In `generateImage()` (line 155-157), when Gemini fails, fall back to `searchNasaImages()` instead of returning a dead-end error:

```typescript
if (!res.ok) {
  return searchNasaImages(prompt);
}
```

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test -- --run`
- **Max iterations**: 2
- **Completion criteria**: Build passes, all tests pass. "show me a picture of the crew" returns NASA images.
- **Invoke with**: `/wrought-rca-fix`

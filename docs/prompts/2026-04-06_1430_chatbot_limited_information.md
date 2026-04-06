# Implementation Prompt: Enrich ARTEMIS AI Chatbot Information Quality

**RCA Reference**: docs/RCAs/2026-04-06_1430_chatbot_limited_information.md
**Investigation Reference**: docs/investigations/2026-04-06_1430_chatbot_llm_model_upgrade.md

## Context

The ARTEMIS AI chatbot provides limited information due to a stale system prompt, wrong phase boundaries, and inaccurate quick answers. All correct values already exist in `src/data/mission-config.ts` (NASA-verified in Session 6) but are not used by the chat API or quick answers.

## Goal

Enrich the chatbot's knowledge and capabilities by:
1. Correcting the system prompt with NASA-verified mission facts
2. Fixing phase detection to match actual milestone timings
3. Updating quick answers with accurate data
4. Adding Gemini Search Grounding for real-time web information
5. Increasing max output tokens for more detailed responses

## Requirements

### R1. Correct `MISSION_FACTS` system prompt (`api/chat.ts:43-67`)

Update the `MISSION_FACTS` constant with:
- Mission duration: "9 days, 1 hour, 33 minutes (217.53 hours)" instead of "approximately 10 days"
- Splashdown: "April 10, 2026, approximately 8:07 PM EDT (00:07 UTC April 11)" instead of "April 10-11"
- Trajectory: Add phasing orbit phase — "Launch → Earth orbit → Perigee raise → ICPS separation → Phasing orbit (2 revolutions, ~22 hours) → TLI burn at T+25h13m → Outbound coast (~3.2 days) → Lunar flyby at 6,543 km above lunar far side → Free return → Entry/Splashdown"
- Lunar flyby altitude: "6,543 km (4,066 mi)" instead of "8,900 km (5,500 miles)"
- Add key milestone timeline summary (TLI at T+25h13m, Lunar Flyby at T+120h27m, Splashdown at T+217h32m)
- Add EVA/science context: "No EVA on Artemis II — this is a test flight. Crew tests life support, navigation, communication, and manual flight control systems."
- Soften the RULES: change "Answer ONLY from the facts above" to "Use the facts above as your primary source. You may supplement with general publicly known space and NASA knowledge. If uncertain about mission-specific details, say so."

### R2. Fix phase boundaries in `buildSystemPrompt()` (`api/chat.ts:78-86`)

Replace hardcoded hour boundaries with values derived from milestone timings:

```
< 0           → 'Pre-launch'
< 3.40        → 'Launch & Earth Orbit' (ICPS sep at T+3.40h)
< 25.23       → 'Phasing Orbit' (TLI burn at T+25.23h)
< 25.33       → 'Translunar Injection Burn' (5m50s burn)
< 102         → 'Outbound Coast' (lunar approach at T+102h)
< 139         → 'Lunar Flyby' (return burn at T+139h)
< 217.0       → 'Return Coast' (CM/SM sep at T+217.0h)
< 217.53      → 'Entry & Splashdown'
>= 217.53     → 'Mission Complete'
```

### R3. Correct quick answers (`src/data/artemis-knowledge.ts`)

Update these specific answers:

| Question | Current (wrong) | Corrected |
|----------|----------------|-----------|
| "How long is the mission?" | "approximately 10 days" / "April 10-11" | "about 9 days (217.53 hours)" / "April 10, 2026" |
| "What is TLI?" | "approximately 2 hours after launch" | "approximately 25 hours after launch (T+25h13m) at phasing orbit perigee" |
| "When does it return?" | "approximately 10 days" / "April 10-11" | "about 9 days after launch, on April 10, 2026" |
| "What's the trajectory?" | "8,900 km above the lunar far side" | "6,543 km (4,066 mi) above the lunar far side" |

### R4. Add Gemini Search Grounding (`api/chat.ts`)

In the `generateTextResponse()` function, add the Google Search tool to the Gemini API request body:

```typescript
const geminiBody = {
  system_instruction: { parts: [{ text: systemPrompt }] },
  contents: messages.map(...),
  generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.9 },
  tools: [{ google_search: {} }],
};
```

This enables the model to search the web before answering, providing access to real-time NASA updates, news, and mission status. No new API keys required — uses existing `GEMINI_API_KEY`.

### R5. Increase `maxOutputTokens` (`api/chat.ts:128`)

Change `maxOutputTokens: 1024` to `maxOutputTokens: 2048` in `generationConfig`.

## Files Likely Affected

- `api/chat.ts` — System prompt, phase boundaries, search grounding, max tokens
- `src/data/artemis-knowledge.ts` — Quick answer corrections

## Constraints

- **$0 budget**: All changes must work within the Gemini free tier. Search Grounding availability on free tier should be verified — if it fails, the change should be gracefully skipped (wrap in try/catch or feature flag).
- **No provider migration**: Stay on Gemini. Do not switch to OpenAI.
- **No breaking changes to multimodal pipeline**: Image generation, NASA image search, charts, and video must continue working unchanged.
- **API contract**: The `ChatPart` response type and request format must remain unchanged.
- **Verify build**: `npx tsc --noEmit && npx vite build` must pass.

## Acceptance Criteria

- [ ] System prompt contains NASA-verified mission duration (217.53 hours / 9.064 days)
- [ ] System prompt contains correct lunar flyby altitude (6,543 km)
- [ ] System prompt describes phasing orbit and TLI at T+25h13m
- [ ] Phase boundaries match milestone timings from `mission-config.ts`
- [ ] "Phasing Orbit" phase exists between Earth Orbit and TLI
- [ ] Quick answers updated: mission duration, TLI timing, return date, flyby altitude
- [ ] `maxOutputTokens` increased to 2048
- [ ] Gemini Search Grounding added to text response requests
- [ ] Build passes (`npx tsc --noEmit && npx vite build`)
- [ ] Existing multimodal intents (image, nasa-image, chart, video) unaffected

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode (compresses context and enables read-only exploration)
2. Explore the codebase and design your implementation approach using read-only tools (Read, Grep, Glob)
3. Write the plan to `docs/plans/2026-04-06_1430_chatbot_limited_information.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-rca-fix` to start the autonomous bugfix loop with test verification.

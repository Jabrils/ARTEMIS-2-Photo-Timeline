# Root Cause Analysis: ARTEMIS AI Chatbot Provides Limited Information

**Date**: 2026-04-06
**Severity**: Medium
**Status**: Identified
**Investigation**: [docs/investigations/2026-04-06_1430_chatbot_llm_model_upgrade.md](../investigations/2026-04-06_1430_chatbot_llm_model_upgrade.md)

## Problem Statement

ARTEMIS AI chatbot responses are "extremely limited in information." Users proposed switching to OpenAI GPT-5.4-nano with web search tools. Investigation confirmed the limitation is real but determined the root cause is the static system prompt architecture, not the LLM model.

## Symptoms

- Chatbot says "approximately 10 days" when actual mission duration is 9.064 days (217.53 hours)
- Quick answers state TLI occurs "approximately 2 hours after launch" — actual is T+25.23h (phasing orbit perigee)
- Quick answers say return "April 10-11, 2026" — actual splashdown is April 10, 2026 at 20:07 EDT (T+217.53h)
- Phase detection in `buildSystemPrompt()` has wrong hour boundaries (e.g., TLI phase ends at 5h when TLI burn is at 25.23h)
- No awareness of real-time mission events, news, or status updates
- Responses feel like a static FAQ rather than an intelligent mission assistant

## Root Cause

Three compounding factors:

### 1. Stale/inaccurate `MISSION_FACTS` system prompt (`api/chat.ts:43-67`)

The system prompt was written once during Session 1 with approximate values and never updated after NASA-verified timings were established in Session 6. Key discrepancies:

| Fact in system prompt | Actual (NASA-verified) |
|----------------------|----------------------|
| "Approximately 10 days" | 9.064 days (217.53 hours) |
| Trajectory: "Launch → Earth orbit → TLI → Outbound coast (~4 days)" | Missing phasing orbit phase (T+3.4h to T+25.23h) |
| Lunar flyby "approximately 8,900 km above the far side" | 6,543 km (4,066 mi) — NASA published altitude |
| No mention of phasing orbit | Artemis II uses 2-rev phasing orbit before TLI (unlike Artemis I direct injection) |

### 2. Wrong phase boundaries in `buildSystemPrompt()` (`api/chat.ts:78-86`)

| Current boundary | What it should be | Impact |
|-----------------|-------------------|--------|
| `< 5` → "Earth Orbit / TLI" | `< 25.23` → split into "Earth Orbit" and "Phasing Orbit" | TLI at T+25.23h, not T+5h |
| `< 96` → "Outbound Coast" | `< 102` → "Outbound Coast" | Lunar approach begins at T+102h |
| `< 130` → "Lunar Flyby" | `< 139` → "Lunar Flyby" | Return burn at T+139h |
| `< 220` → "Return Coast" | `< 217.0` → "Return Coast" | CM/SM sep at T+217.0h |
| `< 240` → "Entry / Splashdown" | `< 217.53` → "Entry / Splashdown" | Splashdown at T+217.53h |

### 3. Stale quick answers (`src/data/artemis-knowledge.ts`)

12 predefined Q&A pairs contain the same approximate/wrong values as the system prompt. These bypass the LLM entirely via client-side string matching, so no model upgrade would fix them.

### 4. No web search capability

The chatbot cannot access real-time information. While not the primary root cause, this limits the chatbot's ability to answer questions about events that happen during the mission.

## Evidence

| Evidence | Source | Finding |
|----------|--------|---------|
| `MISSION_FACTS` says "Approximately 10 days" | `api/chat.ts:47` | Stale — actual is 9.064 days |
| Phase boundary `< 5` for TLI | `api/chat.ts:81` | Wrong — TLI at T+25.23h |
| Quick answer says TLI "approximately 2 hours after launch" | `src/data/artemis-knowledge.ts:38` | Wrong — T+25.23h |
| NASA-verified milestones in `mission-config.ts` | `src/data/mission-config.ts:27-46` | Correct values already in codebase |
| Gemini Search Grounding available | [Gemini API docs](https://ai.google.dev/gemini-api/docs/grounding) | Additive capability at $0-3.50/mission |

## Impact

- Users receive incorrect mission facts from both the LLM (system prompt) and quick answers (client-side)
- Phase detection tells the LLM the wrong mission phase, leading to contextually wrong answers
- Today (T+~112h) the model correctly says "Lunar Flyby" phase (96-130h boundary happens to include 112h), but this is coincidental — the boundary is still wrong
- Chatbot cannot answer questions about real-time events or news

## Resolution

Four changes, ordered by impact:

### R1. Correct `MISSION_FACTS` system prompt (`api/chat.ts`)
- Update mission duration to 9.064 days (217.53 hours)
- Add phasing orbit to trajectory description
- Correct lunar flyby altitude to 6,543 km
- Add detailed milestone timeline (derive from `mission-config.ts` milestones)
- Add more spacecraft details (ESM capabilities, heat shield specs, science objectives)
- Remove "RULES" instruction to only answer from facts above — replace with guidance to use facts as primary source but allow general space knowledge

### R2. Fix phase boundaries in `buildSystemPrompt()` (`api/chat.ts`)
- Derive phases from `mission-config.ts` milestone timings instead of hardcoded hours
- Add "Phasing Orbit" phase between Earth Orbit and TLI

### R3. Correct quick answers (`src/data/artemis-knowledge.ts`)
- Update mission duration, TLI timing, splashdown date
- Derive values from `mission-config.ts` where possible

### R4. Add Gemini Search Grounding (`api/chat.ts`)
- Add `tools: [{ google_search: {} }]` to the Gemini API request body
- This allows the model to search the web for real-time information before answering
- Free on Gemini free tier; $35/1,000 queries on paid tier
- Additive change — no migration, no new API keys

### R5. Increase `maxOutputTokens` (`api/chat.ts`)
- Increase from 1024 to 2048 for more detailed responses on complex questions

## Prevention

- System prompt facts should be derived from `mission-config.ts` constants where possible, not hardcoded strings
- Phase boundaries should reference milestone data, not independent magic numbers
- Quick answers should cross-reference `mission-config.ts` for numerical values

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npx tsc --noEmit && npx vite build`
- **Max iterations**: 3
- **Completion criteria**: Build passes, system prompt contains corrected values, phase boundaries match milestone timings, quick answers updated
- **Escape hatch**: After 3 iterations, document blockers and request human review
- **Invoke with**: `/wrought-rca-fix` (activates Stop hook verifier loop)

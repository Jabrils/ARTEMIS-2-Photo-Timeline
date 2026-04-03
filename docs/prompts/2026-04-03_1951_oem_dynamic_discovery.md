# Implementation Prompt: Dynamic OEM URL Discovery

**Blueprint Reference**: docs/blueprints/2026-04-03_1951_oem_dynamic_discovery.md
**Design Reference**: docs/design/2026-04-03_1950_oem_dynamic_discovery.md

## Context

The OEM API hardcodes a NASA ZIP URL that becomes stale when NASA publishes updated trajectory data after maneuvers. The design recommends URL pattern probing: trying recent dates with HEAD requests to discover the latest OEM file automatically.

## Goal

Add dynamic OEM URL discovery to `api/oem.ts` so the endpoint automatically fetches the latest available NASA OEM ephemeris without manual URL updates. Also update the bundled fallback file.

## Requirements

1. Add `discoverLatestOemUrl()` function that probes `artemis-ii-oem-{YYYY-MM-DD}-to-ei.zip` for dates from today back 7 days using HEAD requests
2. Cache the discovered URL in module-level state with 1-hour TTL
3. Update handler to call `discoverLatestOemUrl()` instead of using the hardcoded constant directly
4. Keep the hardcoded URL as the fallback when probing fails
5. Replace `public/fallback-oem.asc` with the latest April 3 post-TLI OEM data

## Files Likely Affected

- `api/oem.ts` — add discovery + cache logic, update handler
- `public/fallback-oem.asc` — replace with latest OEM data

## Implementation Sequence

1. Add module-level cache variable: `let cachedOemUrl: { url: string; expiry: number } | null = null`
2. Add `discoverLatestOemUrl()`: loop from today back 7 days, HEAD request each URL, return first 200, cache result for 1 hour, fall back to `OEM_ZIP_URL`
3. Update handler: `const oemUrl = await discoverLatestOemUrl();` then `fetch(oemUrl)` instead of `fetch(OEM_ZIP_URL)`
4. Extract the April 3 NASA OEM ZIP and write to `public/fallback-oem.asc`

## Constraints

- `api/` files cannot import from `src/`
- No external dependencies — native `fetch` only
- Must not break the ZIP extraction logic (F2 fix)
- Handler response format and error handling must not change

## Acceptance Criteria

- [ ] Discovery finds the April 3 OEM URL
- [ ] Cache prevents re-probing within 1 hour
- [ ] Falls back to hardcoded URL on probe failure
- [ ] Fallback OEM file is updated to April 3 data (3,259 lines)
- [ ] All existing tests pass
- [ ] Build succeeds

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode (compresses context and enables read-only exploration)
2. Explore the codebase and design your implementation approach using read-only tools (Read, Grep, Glob)
3. Write the plan to `docs/plans/2026-04-03_1951_oem_dynamic_discovery.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop with test verification.

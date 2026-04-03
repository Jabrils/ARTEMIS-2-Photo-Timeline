# Blueprint: Dynamic OEM URL Discovery via Pattern Probing

**Date**: 2026-04-03
**Design Reference**: docs/design/2026-04-03_1950_oem_dynamic_discovery.md
**Finding**: F3 in `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md`

## Objective

Replace the hardcoded NASA OEM ZIP URL in `api/oem.ts` with a dynamic discovery mechanism that probes NASA's URL pattern to find the latest available OEM ephemeris file. Also update the bundled fallback OEM file to the latest post-TLI data.

## Requirements

1. Probe NASA URLs using the known pattern `artemis-ii-oem-{YYYY-MM-DD}-to-ei.zip` for recent dates
2. Cache the discovered URL in module-level state (1-hour TTL) to avoid probing on every request
3. Fall back to the hardcoded URL if no probed URL responds with 200
4. Replace `public/fallback-oem.asc` with the latest NASA OEM data (April 3 post-TLI file)
5. Do not change the handler's response format or the ZIP extraction logic

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discovery method | URL pattern probing with HEAD requests | Deterministic, no HTML parsing, fast |
| Cache location | Module-level variable | Serverless functions may cold-start, but within a warm instance the cache avoids repeated probes. Simple, no external deps. |
| Cache TTL | 1 hour | Balances freshness (NASA publishes ~daily) with probe load |
| Probe depth | 7 days back | Covers the full mission duration; OEM files are published within the mission window |
| Fallback | Hardcoded URL (current April 3 file) | Guaranteed to work if probe fails |

## Scope

### In Scope
- `api/oem.ts`: Add `discoverLatestOemUrl()` with caching, update handler to use it
- `public/fallback-oem.asc`: Replace with April 3 post-TLI OEM data (3,259 lines)

### Out of Scope
- HTML scraping fallback (Option B/C from design)
- Changes to other API endpoints
- Frontend changes (useOEM.ts fallback logic is unchanged)

## Files Likely Affected

- `api/oem.ts` — add discovery function, module-level cache, update handler
- `public/fallback-oem.asc` — replace file content with latest NASA OEM data

## Implementation Sequence

1. **Add `discoverLatestOemUrl()` function** to `api/oem.ts` — probes URLs from today backward, returns first that responds 200 to HEAD
2. **Add module-level cache** — `let cachedUrl: { url: string; expiry: number } | null = null` with 1-hour TTL
3. **Update handler** — call `discoverLatestOemUrl()` instead of using `OEM_ZIP_URL` directly; keep `OEM_ZIP_URL` as the fallback constant
4. **Replace fallback OEM file** — extract April 3 ZIP and write to `public/fallback-oem.asc`

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| NASA changes URL pattern | Low | Medium | Fallback to hardcoded URL still works |
| HEAD requests blocked by NASA | Low | Low | Fall through to hardcoded URL; GET still works (proven by F2 fix) |
| Probe latency adds to response time | Low | Low | HEAD requests are fast (~60ms); only runs once per hour per warm instance |
| Cold start resets cache | Medium | None | Probe runs once, result cached for the instance lifetime |

## Acceptance Criteria

- [ ] `discoverLatestOemUrl()` returns the April 3 OEM URL when probing
- [ ] Cache prevents re-probing within 1 hour
- [ ] Falls back to hardcoded URL when all probes fail
- [ ] `public/fallback-oem.asc` contains April 3 post-TLI data (3,259 lines)
- [ ] All existing tests pass (`npx vitest run`)
- [ ] Build succeeds (`npm run build`)

## Constraints

- `api/` files cannot import from `src/` (Vercel serverless)
- No external dependencies — use native `fetch` for HEAD requests
- Must not break the ZIP extraction logic from F2 fix

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test -- --run`
- **Max iterations**: 3
- **Completion criteria**: Build passes, all tests pass, `discoverLatestOemUrl()` correctly probes and caches
- **Escape hatch**: After 3 iterations, document blockers and request human review
- **Invoke with**: `/wrought-implement`

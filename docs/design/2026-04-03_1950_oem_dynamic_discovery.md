# Design Analysis: Dynamic OEM Discovery Strategy

**Date**: 2026-04-03
**Mode**: Tradeoff
**Finding**: F3 in `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md`
**Goal**: Automatically discover the latest NASA OEM ephemeris URL instead of hardcoding it

---

## Context

The OEM API URL is hardcoded to a specific NASA file (`artemis-ii-oem-2026-04-02-to-ei-v3.zip`). NASA publishes updated OEM files after maneuvers (e.g., post-TLI). The current file is stale by 0.003% but future correction burns could increase the deviation. The mission has ~7 days remaining.

## Options Evaluated

### Option A: URL Pattern Probing (Recommended)

NASA's OEM files follow a predictable URL pattern:
```
https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-oem-{YYYY-MM-DD}-to-ei[-vN].zip
```

Probe recent dates with HEAD requests to find the latest available file. Try today, yesterday, day before, etc., with and without version suffixes.

**Pros**: No HTML parsing, no fragile DOM scraping, deterministic, fast (HEAD requests)
**Cons**: Assumes URL pattern stays consistent, may miss files with unexpected naming
**Risk**: Low
**Effort**: ~30 min

### Option B: HTML Scraping of Tracking Page

Fetch `nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/` and parse HTML for the OEM download link.

**Pros**: Always finds the official link regardless of naming changes
**Cons**: Fragile (HTML structure changes break it), slow (fetches full page), complex parsing
**Risk**: Medium-High
**Effort**: ~1 hour

### Option C: Hybrid (Pattern Probe + HTML Fallback)

Try URL pattern probing first. If no file found for recent dates, fall back to HTML scraping. If both fail, use hardcoded fallback URL.

**Pros**: Most resilient — covers multiple failure modes
**Cons**: Most complex, two discovery mechanisms to maintain
**Risk**: Low (graceful degradation)
**Effort**: ~1 hour

### Option D: Current Approach (Baseline)

Keep the hardcoded URL. Update it manually when drift is detected.

**Pros**: Simplest, no new failure modes
**Cons**: Requires manual intervention, will drift after future maneuvers
**Risk**: None (but ongoing maintenance)

## Scoring

| Criterion (weight) | A: Pattern Probe | B: HTML Scrape | C: Hybrid | D: Current |
|---------------------|------------------|----------------|-----------|------------|
| Reliability (3) | 8 | 5 | 9 | 4 |
| Simplicity (2) | 8 | 5 | 4 | 10 |
| Resilience (2) | 7 | 6 | 9 | 2 |
| Effort (1) | 9 | 6 | 5 | 10 |
| **Weighted Total** | **61** | **43** | **55** | **42** |

## Recommendation: Option A — URL Pattern Probing

**Implementation approach:**

1. On each request to `/api/oem`, probe NASA URLs for recent dates (today, yesterday, ..., up to 7 days back)
2. Use HEAD requests to check existence (fast, no data transfer)
3. Cache the discovered URL for 1 hour (avoid repeated probing)
4. If no file found via probing, fall back to the hardcoded URL
5. Update the fallback OEM file to the latest known data

```typescript
// Pseudocode
const BASE = 'https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-oem-';
const SUFFIX = '-to-ei';

async function discoverLatestOemUrl(): Promise<string> {
  const today = new Date();
  for (let daysBack = 0; daysBack < 7; daysBack++) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const url = `${BASE}${dateStr}${SUFFIX}.zip`;
    const resp = await fetch(url, { method: 'HEAD' });
    if (resp.ok) return url;
  }
  return HARDCODED_FALLBACK_URL;
}
```

**Key trade-off**: Slightly more complexity than a hardcoded URL, but automatically picks up NASA's post-maneuver trajectory updates without code changes. Given the 7-day mission window with potential correction burns, this is worthwhile.

**Files affected**:
- `api/oem.ts` — add discovery logic, module-level cache
- `public/fallback-oem.asc` — replace with latest (April 3) OEM data

---

**Design Analysis Complete**: 2026-04-03 19:50 UTC

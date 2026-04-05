# Session 5 Summary

**Date**: 2026-04-05
**Duration**: ~12 hours
**Session Number**: 5

---

## Accomplishments

### 1. UI Regressions Fixed (F1-F4)
- ProgressBar/ChatPanel overlap: isolate stacking, container padding, items-stretch
- ProgressBar height mismatch: padding normalization, Moon card alignment + green color
- Trajectory near Moon: 7 investigations → JPL Horizons ephemeris (definitive fix)
- Mobile hamburger menu: 50vh cap, compact items, auto-scroll

### 2. Moon Position — Definitive Fix After 7 Investigations
The circumcenter algorithm computed the osculating circle center, NOT the Moon's gravitational center (5,034 km apart). Replaced with bundled JPL Horizons ephemeris data (37 geocentric J2000 points). This was the single most complex issue across Sessions 2-5.

### 3. Visual Scale Improvements (NSF Reference)
- Distance-adaptive Orion scaling (planet-sized → dot at overview zoom)
- Earth to true scale (1.274su → 0.637su) — trajectory no longer bisected
- Trajectory map inset built then removed (cluttered, blocked drag interaction)

### 4. Milestone Audit — All 19 Verified Against OEM
Discovered phasing orbit in OEM data. Corrected 7 milestone positions. Renamed OTB-2 to TLI Perigee.

### 5. Code Quality — 6 Session 4 Review Warnings Resolved
useAlerts refactored (2 effects, field selectors, module-level Sets), AlertsBanner timer fix, SpaceWeatherPanel selector consolidation, addAlert dedup purity.

---

## Issues Encountered

1. **Moon position took 7 investigations** — each fix addressed one layer without validating the visual result. Lesson: validate visual output after each fix, prefer authoritative data sources over geometric approximations.
2. **Trajectory map inset blocked 3D interaction** — flex-1 + pointer-events-auto on wrapper div (same pattern as F1 ProgressBar overlay). Built, deployed, fixed, then removed entirely.
3. **Milestone timing mismatched OEM data** — hardcoded times assumed direct TLI, but OEM shows phasing orbit.

---

## Decisions Made

1. **JPL Horizons ephemeris over circumcenter** — authoritative source, 8,357 km clearance vs 3,002 km
2. **Earth at true scale** — trajectory clears naturally, no culling needed
3. **Remove trajectory map inset** — cluttered UI without interactivity
4. **Module-level dedup Sets** — persist across React remounts for alert dedup
5. **Field-level Zustand selectors** — prevent unnecessary re-renders in useAlerts

---

## Metrics

| Metric | Value |
|--------|-------|
| Commits | 18 |
| Files changed | 61 |
| Lines added | ~8,399 |
| Lines removed | ~370 |
| New components | 1 (moon-ephemeris.ts) |
| Removed components | 1 (TrajectoryMap.tsx) |
| Findings created | 9 |
| Findings resolved | 13 |
| Investigations | 9 |
| RCAs | 6 |
| Code reviews | 5 |
| Simplify passes | 2 |
| Pipelines completed | 4 |

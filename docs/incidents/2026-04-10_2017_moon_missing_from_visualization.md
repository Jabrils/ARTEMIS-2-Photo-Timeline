# Incident: Moon Missing from Visualization

**Date**: 2026-04-10
**Time**: ~20:17 UTC
**Reported by**: User (screenshot)
**Status**: Open

---

## What Happened

- ~18:15 UTC: Commit `8278413` deployed to Vercel — F1 virtual clock + replay feature (24 files, 2,002 lines)
- ~20:17 UTC: User reports Moon is not visible in the 3D visualization. Screenshot shows trajectory curving around empty space where Moon should be. Earth and Orion spacecraft are visible. The "MOON" label is not visible.

---

## Observed Symptoms

- Moon sphere is not visible in the 3D scene
- Trajectory correctly curves around the expected Moon location (the path is correct)
- Earth is visible at normal size and position
- Orion spacecraft is visible and positioned on the trajectory
- The "MOON" label is absent

---

## Systems Affected

- `src/components/Moon.tsx` — reads `moonPosition` from store, renders at that position
- `src/components/DataDriver.tsx` — writes `moonPosition` to store at 4Hz
- `src/data/moon-ephemeris.ts` — `getMoonPosition()` returns Moon coordinates

---

## Data Points

| Metric | Value |
|--------|-------|
| Commit | `8278413` |
| Files in commit | 24 |
| Prior working state | Commit `e1da479` (Moon visible, static at flyby position) |
| Regression source | F1 virtual clock implementation — DataDriver now writes moonPosition |

---

## Raw Evidence

```typescript
// src/data/moon-ephemeris.ts:65-91 — getMoonPosition returns scene units (already / SCALE_FACTOR)
export function getMoonPosition(timeMs: number): [number, number, number] {
  // ...
  return [
    (a.x + (b.x - a.x) * frac) / SCALE_FACTOR,  // Already in scene units
    (a.y + (b.y - a.y) * frac) / SCALE_FACTOR,
    (a.z + (b.z - a.z) * frac) / SCALE_FACTOR,
  ];
}

// src/components/DataDriver.tsx:79,95-98 — divides by SCALE_FACTOR again
const moonPos = getMoonPosition(simTimeRef.current);  // scene units
// ...
moonPosition: {
  x: moonPos[0] / SCALE_FACTOR,  // scene units / 10,000 = ~0.004 su
  y: moonPos[1] / SCALE_FACTOR,
  z: moonPos[2] / SCALE_FACTOR,
},
```

Expected Moon position: ~38 scene units from Earth.
Actual Moon position: ~0.004 scene units from Earth (inside Earth sphere at 0.637 su radius).

The forge-review Complexity Analyst flagged this as S1 ("getMoonPosition double-divides by SCALE_FACTOR") but it was dismissed as "pre-existing pattern, not a regression."

---

**Incident Logged**: 2026-04-10 20:17 UTC

# Root Cause Analysis: Moon Missing — Double SCALE_FACTOR Division

**Date**: 2026-04-10
**Severity**: High
**Status**: Identified
**Incident**: `docs/incidents/2026-04-10_2017_moon_missing_from_visualization.md`

## Problem Statement

The Moon is not visible in the 3D visualization after commit `8278413` (F1 virtual clock). The Moon sphere renders at ~0.004 scene units from origin (inside Earth) instead of ~38 scene units.

## Symptoms

- Moon sphere invisible in the 3D scene
- Trajectory curves correctly around where Moon should be
- "MOON" label not visible

## Root Cause

`getMoonPosition()` in `moon-ephemeris.ts:88` returns coordinates **already in scene units** (divided by SCALE_FACTOR internally). DataDriver line 92-94 divides by SCALE_FACTOR **again**:

```typescript
const moonPos = getMoonPosition(simTimeRef.current);  // returns scene units
moonPosition: {
  x: moonPos[0] / SCALE_FACTOR,  // 38 su / 10,000 = 0.0038 su
```

The Moon renders at 0.0038 scene units — inside the Earth sphere (radius 0.637 su).

## Evidence

```typescript
// moon-ephemeris.ts:88 — already divides by SCALE_FACTOR
return [(a.x + (b.x - a.x) * frac) / SCALE_FACTOR, ...];

// DataDriver.tsx:92-94 — divides AGAIN
moonPosition: { x: moonPos[0] / SCALE_FACTOR, ... }
```

## Resolution

Remove the `/ SCALE_FACTOR` from the moonPosition store write in DataDriver. `moonPos` values go directly into the store as scene units.

```typescript
moonPosition: {
  x: moonPos[0],
  y: moonPos[1],
  z: moonPos[2],
},
```

## Prevention

When consuming a function, verify its return units before applying conversions. `getMoonPosition()` docstring says "in scene units" — the division was applied without checking.

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 2
- **Invoke with**: `/wrought-rca-fix`

# Root Cause Analysis: Trajectory Near Moon Renders Problematic

**Date**: 2026-04-04
**Severity**: High
**Status**: Identified
**Tracker**: `docs/findings/2026-04-04_2200_ui_visual_regressions_session5_FINDINGS_TRACKER.md` (F3)
**Investigation**: `docs/investigations/2026-04-04_2330_trajectory_near_moon_rendering.md`

## Problem Statement

The trajectory line disappears near the Moon, creating a ~13-hour gap in the flyby segment. The Moon sphere is visually displaced from the trajectory loop. This is the most visually significant segment of the Artemis II mission and its absence undermines the visualization.

## Symptoms

- Large gap in trajectory line near the Moon (206 points, ~13 hours culled)
- Moon sphere not centered within the trajectory's flyby loop
- Moon appears displaced from where the trajectory curves around it

## Root Cause

**Primary**: `Moon.tsx` computes the Moon's position by finding the OEM point farthest from Earth (apoapsis) and offsetting backward along the Earth-to-apoapsis radial by 10,637 km. This is geometrically wrong — the Moon center is ~11,000 km perpendicular to that radial, not along it. The apoapsis point is where the spacecraft has already swung past the Moon and continued outward, not a point directly "behind" the Moon.

**Secondary**: `Trajectory.tsx` uses `MOON_VISUAL_RADIUS = 0.7` scene units (7,000 km) for culling. With the wrong Moon position, the closest trajectory approach is only 3,684 km (0.37 scene units) — well inside the culling radius, causing massive over-culling.

**Tertiary**: `useOEM.ts` fetches the correct Moon position from the Horizons API (in km), but `Moon.tsx` immediately overwrites it with its wrong computed value (in scene units). Two competing sources, incompatible units.

## Evidence

```
Correct Moon center closest approach:  8,251 km (0.83 scene units) — OUTSIDE 0.7 radius
Wrong Moon center closest approach:    3,684 km (0.37 scene units) — INSIDE 0.7 radius
Moon position displacement:            ~11,000 km from correct location
Points culled:                         206 of 3,239 (~13 hours of flyby)
```

```typescript
// Moon.tsx:11-33 — Flawed algorithm
const offsetKm = 10637;
const moonX = (flybyVector.x - dx * offsetKm) / SCALE_FACTOR;
// dx is Earth-to-apoapsis direction — Moon is NOT on this line

// Trajectory.tsx:8 — Over-aggressive culling
const MOON_VISUAL_RADIUS = 0.7; // 7,000 km culling zone

// useOEM.ts:58 — Correct Horizons value gets overwritten by Moon.tsx:40
useMissionStore.getState().setMoonPosition({ x: parseFloat(posMatch[1]), ... });
// ^ in km, then Moon.tsx overwrites with scene units value
```

## Impact

| Aspect | Impact |
|--------|--------|
| Visual | 13-hour trajectory gap at the mission's most dramatic phase |
| Accuracy | Moon positioned ~11,000 km from true location |
| Scope | Affects trajectory rendering, Moon placement, HUD Moon distance, camera presets |

## Resolution

### Fix 1: Replace Moon Position with Circumcenter Algorithm

Replace the radial-offset approach with a circumcenter-of-curvature calculation. Select three OEM points at the sharpest part of the trajectory curve (around closest approach to Earth-max-distance) and compute their circumcenter. This gives the center of the flyby loop — the Moon.

```typescript
// New algorithm: circumcenter of 3 trajectory points near sharpest curvature
function computeMoonCenter(oemData: Vec[]): [number, number, number] {
  // 1. Find the point with max angular rate (sharpest curve) — proxy for closest approach
  // 2. Take that point and neighbors ±50 points apart
  // 3. Compute circumcenter of the triangle formed by these 3 points
  // 4. Return as scene units (÷ SCALE_FACTOR)
}
```

### Fix 2: Reduce Culling Radius

Change `MOON_VISUAL_RADIUS` from `0.7` to `0.55`. The Moon visual sphere is 0.5 scene units radius. A 0.55 buffer provides 500 km clearance while not over-culling. With the correct Moon position, the closest trajectory approach (0.83) is safely outside 0.55.

### Fix 3: Unify Moon Position Source

Remove the `setMoonPosition` call from `Moon.tsx`. Let `Moon.tsx` READ from the store instead of computing independently. The store gets populated by:
- `useOEM.ts` Horizons API (correct position in km)
- The new circumcenter computation as fallback

Convert the Horizons value to scene units at write time (÷ SCALE_FACTOR), so all consumers get scene units consistently.

## Prevention

1. Moon position computed from trajectory geometry (circumcenter), not radial approximation
2. Single source of truth for Moon position (store, written once)
3. Tighter culling radius reduces sensitivity to position errors
4. Unit convention enforced: store always holds scene units

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 5
- **Completion criteria**: Build passes, Moon centered within trajectory flyby loop, no trajectory gaps
- **Escape hatch**: After 5 iterations, document blockers and request human review
- **Invoke with**: `/wrought-implement`

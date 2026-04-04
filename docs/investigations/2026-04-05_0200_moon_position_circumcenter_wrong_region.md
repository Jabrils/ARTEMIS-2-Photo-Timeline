# Investigation: Moon Positioned Right Next to Earth -- Circumcenter Selects Wrong Trajectory Region

**Date**: 2026-04-05
**Investigator**: Claude Code (Session 5)
**Severity**: Critical
**Status**: Investigation Complete
**Finding**: F3 in `docs/findings/2026-04-04_2200_ui_visual_regressions_session5_FINDINGS_TRACKER.md`
**Occurrence**: 5th manifestation of Moon position bug across Sessions 2-5

---

## Executive Summary

The Moon renders at 2.44 scene units (24,450 km) from Earth -- effectively RIGHT NEXT TO the Earth sphere (radius 1.274 scene units). The Moon should be at ~38.44 scene units (384,400 km) from Earth. The root cause is that `findMaxCurvatureIndex()` in `Moon.tsx` selects the **wrong trajectory region**. It finds the global maximum curvature, which is at the spacecraft's near-Earth parking orbit (index 341, 6,947 km from Earth, curvature 0.0175) rather than the lunar flyby region (index 1779, 413,147 km from Earth, curvature 0.0009). The parking orbit has ~19x higher curvature than the lunar flyby because orbital curvature is inversely related to distance from the gravitational body. The circumcenter of three points around the parking orbit naturally produces a center near Earth, placing the Moon at 24,450 km from Earth instead of 384,400 km.

---

## External Research Findings

### Orbital Mechanics Context
- **Kepler's Third Law**: Orbital curvature is inversely proportional to the square root of the semi-major axis. Near-Earth orbits have dramatically tighter curves than lunar-distance orbits.
- **Artemis II trajectory**: Leaves a ~400 km circular parking orbit (extremely tight curve), performs TLI burn, then follows a free-return trajectory to the Moon. The sharpest curve in the entire trajectory is the parking orbit, not the lunar flyby.
- **Circumcenter geometry**: The circumcenter of a triangle inscribed in a circle gives the circle's center. Applied to trajectory points near Earth, it finds Earth's center. Applied to points near the Moon, it finds the Moon's center. The algorithm is correct in principle -- it was just applied to the wrong region.

### Prior Investigations Consulted
- `docs/investigations/2026-04-04_2330_trajectory_near_moon_rendering.md` -- Identified the original radial-offset algorithm as flawed. Proposed circumcenter as replacement. Did not foresee that the global max curvature would be near Earth.
- `docs/investigations/2026-04-05_0100_trajectory_through_moon_race_condition.md` -- Identified race condition between useOEM.ts and Moon.tsx. That race condition has been fixed (useOEM.ts no longer writes moonPosition). But the circumcenter algorithm itself is broken.
- `docs/RCAs/2026-04-04_2130_trajectory_near_moon.md` -- Designed 3 fixes: circumcenter algorithm, reduced culling radius, unified position source. Fix 1 (circumcenter) was implemented incorrectly. Fix 2 (reduced radius) was implemented. Fix 3 (unified source) was implemented (useOEM.ts no longer writes moonPosition).
- `docs/RCAs/2026-04-05_0105_trajectory_through_moon_race.md` -- Designed the useOEM.ts cleanup. That fix was correctly implemented.

---

## Root Cause Analysis

### Primary Cause: `findMaxCurvatureIndex()` Finds Earth Orbit, Not Lunar Flyby

The function scans ALL trajectory points for maximum angular rate change:

```typescript
// Moon.tsx:9-24 -- Current algorithm
function findMaxCurvatureIndex(data: Vec3[]): number {
  let maxCurvature = 0;
  let idx = Math.floor(data.length / 2);
  for (let i = 1; i < data.length - 1; i++) {
    // ... computes curvature at point i ...
    if (curvature > maxCurvature) { maxCurvature = curvature; idx = i; }
  }
  return idx;
}
```

Results from OEM data analysis:

| Region | Index | Earth Distance | Curvature | What It Is |
|--------|-------|---------------|-----------|------------|
| **Global max (SELECTED)** | 341 | 6,947 km | 0.01748 | Parking orbit perigee |
| Lunar flyby peak | 1779 | 413,147 km | 0.00091 | Apoapsis near Moon |
| Earth return | 3237 | 6,684 km | 0.00376 | Re-entry approach |

The parking orbit curvature (0.01748) is **19.2x higher** than the lunar flyby curvature (0.00091). The algorithm correctly finds the maximum curvature -- but that maximum is near Earth, not near the Moon.

### Secondary Cause: Circumcenter of Near-Earth Points Centers on Earth

With the max curvature at index 341 (parking orbit), the circumcenter inputs are:

```
A (idx 291): dist = 47,716 km from Earth
B (idx 341): dist = 6,947 km from Earth  (parking orbit!)
C (idx 391): dist = 48,769 km from Earth
```

The circumcenter of these three points is at 24,450 km from Earth (2.44 scene units). This is roughly the center of curvature of the spacecraft's trajectory during the parking orbit -- essentially orbiting Earth, so the center is near Earth.

### Impact Chain

```
findMaxCurvatureIndex() → idx 341 (parking orbit, NOT lunar flyby)
    ↓
circumcenter3D(A, B, C) → center at 24,450 km from Earth
    ↓
flybyPos = [-0.8543, -2.0062, -1.1059] scene units (2.44 su from Earth)
    ↓
Moon sphere renders at 2.44 su from origin (Earth sphere edge is at 1.274 su)
    ↓
Moon appears RIGHT NEXT TO Earth
```

---

## Evidence

### Numerical Proof

```
SCALE_FACTOR = 10,000 km per scene unit

Earth sphere radius:    1.274 scene units = 12,740 km
Moon sphere radius:     0.5 scene units   = 5,000 km

Expected Moon position: ~38.44 scene units from Earth (384,400 km)
Actual Moon position:   2.44 scene units from Earth  (24,450 km)

Moon sphere edge:       2.44 - 0.5 = 1.94 scene units from Earth center
Earth sphere edge:      1.274 scene units from Earth center
Gap between spheres:    0.67 scene units (6,700 km)

The Moon appears IMMEDIATELY adjacent to Earth.
```

### Correct Position Verification

When the circumcenter is computed using lunar-region points (index 1779 +/- 30):

```
Circumcenter (lunar region, span=30):
  Position: [-13.0956, -34.0795, -18.7485] scene units
  Earth distance: 410,416 km (41.04 su)
  Closest trajectory approach: 2,671 km

Alternative (apoapsis-direction at 384,400 km):
  Position: [-12.2664, -31.9272, -17.5449] scene units
  Earth distance: 384,400 km (38.44 su)
  Closest trajectory approach: 753 km
```

Both place the Moon in the correct region (~38-41 scene units from Earth), not the 2.44 scene units produced by the current code.

---

## Why Previous Fixes Failed

This is the **5th manifestation** of the Moon position problem:

| Session | Attempt | What Happened | Why It Failed |
|---------|---------|---------------|---------------|
| 2 | Original radial offset | Moon placed at apoapsis minus 10,637 km along Earth radial | Geometrically wrong -- Moon not on Earth-to-apoapsis line |
| 4 | Unit mismatch fix (commit 26ef3a1) | Fixed HUD distance display | Symptom fix only -- Moon position still wrong |
| 5a | Circumcenter algorithm (from Investigation 2330) | Replaced radial offset with circumcenter | Algorithm correct in theory, but findMaxCurvatureIndex picks parking orbit (near Earth), not lunar flyby |
| 5b | Race condition fix (from Investigation 0100) | Removed useOEM.ts Moon position overwrites | Correct fix for that issue, but underlying circumcenter input is still wrong |
| 5c | **Current state** | Moon at 2.44 su from Earth | Circumcenter + wrong region = Moon near Earth |

**Pattern**: Each fix has addressed one layer of the problem without validating the end result (where does the Moon actually render?). No fix has included a **numerical assertion** that the Moon must be ~38-41 scene units from Earth.

---

## Recommended Fix

### Fix the Region Selection in findMaxCurvatureIndex

The fix is straightforward: restrict the curvature search to the **lunar flyby region** of the trajectory. Two approaches:

**Approach A (Recommended -- Most Robust)**: Find the apoapsis (max Earth distance point) first, then search for max curvature only within a window around that point. The apoapsis is always near the Moon on a lunar flyby trajectory.

```typescript
function findLunarFlybyIndex(data: Vec3[]): number {
  // Step 1: Find apoapsis (max distance from Earth)
  let maxDistSq = 0;
  let apoapsisIdx = Math.floor(data.length / 2);
  for (let i = 0; i < data.length; i++) {
    const distSq = data[i].x * data[i].x + data[i].y * data[i].y + data[i].z * data[i].z;
    if (distSq > maxDistSq) { maxDistSq = distSq; apoapsisIdx = i; }
  }

  // Step 2: Search for max curvature only in lunar region (apoapsis +/- 300 points)
  const searchStart = Math.max(1, apoapsisIdx - 300);
  const searchEnd = Math.min(data.length - 2, apoapsisIdx + 300);
  let maxCurvature = 0;
  let idx = apoapsisIdx;
  for (let i = searchStart; i <= searchEnd; i++) {
    // ... curvature computation ...
    if (curvature > maxCurvature) { maxCurvature = curvature; idx = i; }
  }
  return idx;
}
```

**Approach B (Simpler but less precise)**: Filter by distance threshold -- only consider points with Earth distance > 80% of the maximum distance.

**Approach C (Simplest -- fallback)**: Skip circumcenter entirely. Place Moon at 384,400 km along the Earth-to-apoapsis direction. This is less geometrically accurate but places the Moon in the correct region with zero risk of selecting the wrong trajectory segment.

### Add Validation Guard

Regardless of which approach is used, add a **validation check** that the computed Moon position is at a plausible distance from Earth (between 350,000 km and 420,000 km). If the circumcenter produces a position outside this range, fall back to the apoapsis-direction approach.

```typescript
const earthDistKm = Math.sqrt(pos[0]**2 + pos[1]**2 + pos[2]**2) * SCALE_FACTOR;
if (earthDistKm < 350000 || earthDistKm > 420000) {
  // Fallback: place Moon along apoapsis direction at nominal distance
  return [apoapsisDir.x * 384400 / SCALE_FACTOR, ...];
}
```

---

## Files Affected

- `src/components/Moon.tsx` -- Fix `findMaxCurvatureIndex` to search lunar region only, or replace with apoapsis-based approach. Add validation guard.

No other files need changes. The race condition (useOEM.ts) was already fixed. Trajectory.tsx and DataDriver.tsx correctly read from the store.

---

## Verification Plan

1. Moon sphere must render at ~38-41 scene units from Earth center (384,000-410,000 km)
2. Moon sphere must NOT render within 5 scene units of Earth
3. Trajectory must not pass through Moon sphere
4. Moon must appear visually centered within the trajectory flyby loop
5. HUD Moon Distance must show ~250,000-380,000 km (depending on current mission elapsed time)
6. Build passes (`npm run build`)

---

**Investigation Complete**: 2026-04-05 02:00 UTC
**Ready for**: RCA Document + Implementation Prompt

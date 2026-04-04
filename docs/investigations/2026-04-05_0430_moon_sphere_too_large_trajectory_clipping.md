# Investigation: Moon Sphere Oversized -- Trajectory Clips Through Visual Sphere

**Date**: 2026-04-05
**Investigator**: Claude Code (Session 5)
**Severity**: High
**Status**: Investigation Complete
**Finding**: F3 in `docs/findings/2026-04-04_2200_ui_visual_regressions_session5_FINDINGS_TRACKER.md`
**Occurrence**: 6th investigation of Moon/trajectory rendering (Sessions 2-5)

---

## Executive Summary

All five prior investigations addressed the WRONG root cause. The Moon position algorithm (`findLunarFlybyIndex` + `circumcenter3D`) now correctly places the Moon at ~410,000 km from Earth (40.98 scene units). The actual problem is a **scale mismatch**: the Moon visual sphere (radius 0.5 scene units = 5,000 km) is 2.88x the real Moon radius (1,737 km), while the trajectory's closest approach to the circumcenter is only ~3,000 km (0.30 scene units). The trajectory passes THROUGH the oversized Moon sphere, causing 168 trajectory points to be culled by `splitAroundBodies()` in Trajectory.tsx, creating a visible gap.

This is a geometry/scale problem, not a positioning algorithm problem. The fix that was implemented in `64d94ee` correctly solved the Moon POSITION. What remains broken is the Moon VISUAL SIZE relative to the trajectory scale.

---

## Evidence

### Moon Position (CORRECT since commit 64d94ee)

| Metric | Value |
|--------|-------|
| `findLunarFlybyIndex()` result | Index 1779 (apoapsis, 413,147 km from Earth) |
| Circumcenter Earth distance | 409,831 km (40.98 scene units) |
| Validation guard (350k-420k) | PASSES |
| Moon scene position | (-13.07, -34.03, -18.72) scene units |

The algorithm is working correctly. The Moon IS in the right region of space.

### Moon Visual Size (THE ACTUAL PROBLEM)

| Metric | Current | Real Scale | Earth-proportional (2x) |
|--------|---------|------------|------------------------|
| Moon sphere radius | 0.50 su (5,000 km) | 0.174 su (1,737 km) | 0.347 su (3,474 km) |
| Scale factor vs real | 2.88x | 1.0x | 2.0x |
| Earth sphere radius | 1.274 su (12,740 km) | 0.637 su (6,371 km) | 1.274 su (12,740 km) |
| Earth scale factor vs real | 2.0x | 1.0x | 2.0x |

Earth is inflated by 2.0x for visibility. Moon is inflated by 2.88x. They are NOT proportional.

### Trajectory Clearance Analysis

| Moon radius (su) | Represents (km) | Scale factor | Clearance from trajectory | Trajectory clips? |
|------------------|-----------------|--------------|--------------------------|-------------------|
| 0.50 (current) | 5,000 | 2.88x | -0.20 su (-2,000 km) | **YES (168 points culled)** |
| 0.347 (Earth-proportional) | 3,474 | 2.0x | -0.05 su (-474 km) | **YES (marginal)** |
| 0.30 | 3,000 | 1.73x | +0.003 su (+30 km) | **BARELY NO** |
| 0.25 | 2,500 | 1.44x | +0.05 su (+500 km) | NO |
| 0.174 (true scale) | 1,737 | 1.0x | +0.13 su (+1,263 km) | NO |

### Culling Impact

`splitAroundBodies()` in Trajectory.tsx uses `MOON_VISUAL_RADIUS = 0.55` (sphere 0.5 + buffer 0.05). With the Moon at the circumcenter position:
- 168 of 3,239 trajectory points fall inside the culling sphere
- This creates a visible GAP in the trajectory line spanning the entire flyby region
- The gap represents approximately 11 hours of mission time

### Why This Was Never Caught

Each prior investigation focused on the Moon POSITION:
1. Session 2: Radial offset algorithm -- wrong position
2. Session 4: Unit mismatch -- wrong display
3. Session 5a: Circumcenter algorithm -- wrong region (parking orbit)
4. Session 5b: Race condition -- useOEM.ts overwriting Moon.tsx
5. Session 5c: Fixed circumcenter region -- now correct

No investigation ever validated: "Given the correct Moon position, does the Moon visual sphere radius actually work with the trajectory data?" The validation guard checks Earth distance (350k-420k km) but not trajectory clearance.

---

## Root Cause

**Primary**: Moon sphere geometry radius (0.5 scene units = 5,000 km) is disproportionately large compared to Earth's scaling. Earth uses 2.0x real radius; Moon uses 2.88x. At 2.88x scale, the Moon sphere extends beyond the trajectory's closest approach.

**Secondary**: The circumcenter of the trajectory arc is geometrically the center of the osculating circle, which is NOT the gravitational body center for a hyperbolic flyby. For Artemis II's free-return trajectory (165.5-degree deflection), the center of the osculating circle at perilune is much closer to the trajectory than the actual Moon center would be. The circumcenter approach inherently produces a position where the trajectory passes very close (within ~3,000 km).

**Contributing**: The culling buffer (`MOON_VISUAL_RADIUS = 0.55`) amplifies the problem -- it's 10% larger than the sphere itself.

---

## Trajectory Shape Verification

The trajectory is a free-return with these characteristics:
- Approach-departure angle: 165.5 degrees (nearly straight-through with 14.5-degree deflection)
- Outbound/return path separation at 300,000 km: 39,017 km (3.9 scene units)
- The trajectory does NOT "loop" around the Moon in a tight orbit -- it makes a gentle bend
- This gentle bend means the trajectory passes very close to whatever point we designate as Moon center

---

## Fix Requirements

1. **Reduce Moon sphere radius** from 0.5 to 0.25 scene units (2,500 km, 1.44x real scale)
   - Still visually distinct at lunar distance
   - Provides ~0.05 scene units (500 km) clearance from trajectory
   - Proportionally reasonable (Earth at 2.0x, Moon at 1.44x)

2. **Reduce culling radius** in Trajectory.tsx from 0.55 to 0.30 scene units
   - Matches reduced sphere size + minimal buffer

3. **Adjust Moon label position** from `[0, 0.9, 0]` to `[0, 0.6, 0]` (proportional to smaller sphere)

4. **Adjust Moon hover card position** from `[1.0, 0, 0]` to `[0.6, 0, 0]`

5. **Optional improvement**: Offset Moon position slightly AWAY from trajectory along the curvature-perpendicular direction to increase clearance. This would place the Moon more accurately (the gravitational body center is farther from the trajectory than the osculating circle center).

---

## Files Affected

- `src/components/Moon.tsx` -- sphere radius (line 106: `args={[0.5, 32, 32]}`), label position, hover card position
- `src/components/Trajectory.tsx` -- `MOON_VISUAL_RADIUS` constant (line 8)

---

## Verification Plan

1. Moon sphere must NOT overlap with any trajectory line segments
2. No trajectory points should be culled by the Moon sphere (or only 1-2 at most)
3. Moon sphere must be visually distinguishable at lunar distance (not too small)
4. Moon label "MOON" must remain readable above the sphere
5. Build passes (`npm run build`)

---

**Investigation Complete**: 2026-04-05 04:30 UTC
**Ready for**: RCA Document + Implementation Prompt

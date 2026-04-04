# Investigation: Trajectory Around Moon Renders Problematic / Direction Questioned

**Date**: 2026-04-04
**Investigator**: Claude Code (Session 5)
**Severity**: High
**Status**: Investigation Complete
**Finding**: F3 in `docs/findings/2026-04-04_2200_ui_visual_regressions_session5_FINDINGS_TRACKER.md`

---

## Executive Summary

The trajectory line disappears near the Moon because the computed Moon center position is ~11,000 km off from its true location, placing it too close to the trajectory. This causes the `splitAroundBodies()` culling radius (7,000 km) to remove 206 trajectory points spanning ~13 hours of the mission -- the entire lunar flyby segment. The Moon position algorithm (offset max-distance OEM point by 10,637 km along Earth radial) is geometrically flawed: the farthest-from-Earth trajectory point is on the far side of the Moon, and the Moon center is NOT along the Earth-to-farthest-point line. The trajectory direction (counter-clockwise viewed from north) is correct for Artemis II.

---

## External Research Findings

### Official Documentation Consulted
- [NASA SVS: Nominal Artemis II mission trajectory](https://svs.gsfc.nasa.gov/5610/) -- Reference trajectory visualization
- [NASA SVS: Simulated Artemis II Lunar Flyby](https://svs.gsfc.nasa.gov/5536/) -- Flyby animation showing far-side pass
- [Wikipedia: Free-return trajectory](https://en.wikipedia.org/wiki/Free-return_trajectory) -- Free-return trajectory mechanics
- [Wikipedia: Circumlunar trajectory](https://en.wikipedia.org/wiki/Circumlunar_trajectory) -- Circumlunar trajectory types

### Mission Profile Data
- Closest approach to lunar surface: ~6,513 km (some sources: 6,900 km / 4,300 mi)
- Closest approach from Moon center: ~8,250 km (6,513 + 1,737 km Moon radius)
- Maximum Earth distance: ~406,785 km (252,757 miles -- exceeds Apollo 13 record)
- Lunar flyby window: 2:45 -- 9:40 PM EDT on April 6, 2026
- Trajectory: Free-return, figure-eight pattern, passes over lunar far side

### Trajectory Direction
- Free-return trajectories are counter-rotational (east-to-west near Earth)
- The Moon orbits Earth counter-clockwise when viewed from the north celestial pole
- Apollo free-return trajectories also followed counter-clockwise loops around the Moon
- **The OEM data shows counter-clockwise motion around the Moon -- this is CORRECT**

---

## Learnings from Previous RCAs/Investigations/Research

### Related Past Incidents

1. **`docs/RCAs/2026-04-03_2024_camera_visual_bugs.md`** -- Session 2 RCA for camera and trajectory orientation issues. Fixed trajectory vertical alignment and debug overlay bugs. Not directly related to Moon position but established the EME2000 frame orientation.

2. **Commit `26ef3a1`** (Session 4) -- "Fix Moon distance: unit mismatch (km vs scene units)". Fixed `DataDriver.tsx` to multiply `moonPosition` by `SCALE_FACTOR` before computing Moon distance. This fixed the HUD Moon distance display but did NOT fix the underlying Moon position calculation.

3. **Commit `afdb120`** (Session 4) -- "Visual overhaul: hi-res sprites, trajectory culling, readable tooltips". Introduced `splitAroundBodies()` with `MOON_VISUAL_RADIUS = 0.7`.

### Patterns Identified

- **Recurring regression**: The trajectory-near-Moon issue has persisted across Sessions 2-5. Commit `26ef3a1` addressed a symptom (HUD distance display) but not the root cause (wrong Moon position).
- **Unit mismatch pattern**: The codebase has had repeated issues with km vs scene-unit confusion (DataDriver.tsx fix, useOEM.ts fallback in km vs Moon.tsx in scene units).

### Applicable Previous Solutions

- The commit `26ef3a1` approach (converting between units) is relevant but insufficient -- the Moon position itself is wrong regardless of units.

---

## Root Cause Analysis

### Primary Cause: Flawed Moon Position Algorithm in Moon.tsx

`Moon.tsx` computes the Moon's position by:
1. Finding the OEM point farthest from Earth (the max-distance point)
2. Computing the unit vector from Earth to that point
3. Offsetting backward along that vector by 10,637 km

This is **geometrically incorrect**. The farthest OEM point from Earth is NOT directly "behind" the Moon from Earth's perspective -- it is a point where the spacecraft has swung around the Moon's far side and continued outward. The Moon center is offset **perpendicular** to the Earth-to-farthest-point radial, not along it.

**Evidence:**

| Metric | Current (Wrong) | Correct | Delta |
|--------|-----------------|---------|-------|
| Moon center X (scene) | -12.8443 | -12.6884 | +0.156 |
| Moon center Y (scene) | -33.4314 | -34.4197 | -0.988 |
| Moon center Z (scene) | -18.3715 | -17.9169 | +0.455 |
| Moon-Earth distance | 402,510 km | 408,256 km | +5,746 km |
| Closest trajectory approach | 3,684 km | 8,251 km | +4,567 km |
| Displacement | -- | -- | 10,990 km |

The computed Moon center is 10,990 km from its correct position.

### Secondary Cause: Over-Aggressive Culling Radius

`MOON_VISUAL_RADIUS = 0.7` scene units = 7,000 km. With the wrong Moon position, the closest trajectory approach is only 3,684 km (0.37 scene units), so the culling radius clips a massive 206-point, ~13-hour segment of the trajectory.

Even with the correct Moon position, the culling radius is sized for the visual sphere (radius 0.5 = 5,000 km), not the real Moon (radius 1,737 km = 0.17 scene units). The buffer (0.2 scene units = 2,000 km) is unnecessary since the closest approach (8,251 km = 0.83 scene units) is well outside the visual sphere.

### Tertiary Cause: Competing Moon Position Sources

Two components write to `moonPosition` in the store with incompatible conventions:

1. **`useOEM.ts`** (lines 58, 68, 73): Sets Moon position in **kilometers** (fallback: `{x:384400, y:0, z:0}`)
2. **`Moon.tsx`** (line 40): Sets Moon position in **scene units** (km / SCALE_FACTOR)

Consumers (`Trajectory.tsx`, `DataDriver.tsx`) expect **scene units**. `Moon.tsx` always runs after `useOEM.ts` and overwrites the value, so the unit mismatch from `useOEM.ts` is masked. However, this creates:
- A brief window where `moonPosition` is in km (before `Moon.tsx` mounts)
- If `Moon.tsx` is ever removed or fails, the fallback value is in the wrong units
- The Horizons API response (correct Moon position in km) gets overwritten by the wrong computed position

---

## Contributing Factors

### 1. Max-Distance Point != Behind-Moon Point

The OEM max-distance point (line 1800, 413,147 km from Earth) is the spacecraft's apoapsis, not the point where the spacecraft is directly behind the Moon. The spacecraft reaches max Earth distance AFTER closest approach to the Moon (line 1687, 3,684 km from computed Moon), because the free-return slingshot accelerates it past the Moon before it decelerates.

### 2. Offset Direction Assumption

The algorithm assumes the Moon center lies on the line segment between Earth and the max-distance OEM point. In reality, the Moon center is offset perpendicular to this line by ~10,000 km. No single offset value along the radial can produce the correct Moon position -- the approach is fundamentally unsuitable.

### 3. Visual Sphere Scale Mismatch

The Moon's visual sphere radius (0.5 scene units = 5,000 km) is ~2.88x the real Moon radius (1,737 km). The culling buffer adds another 0.2 scene units (2,000 km), totaling 0.7 scene units (7,000 km). This amplifies the impact of any Moon position error.

---

## Evidence

### OEM Data Analysis

```
Max-distance OEM point (apoapsis):
  Line 1800: 2026-04-06T23:05:51.319
  Position: x=-131837.5, y=-343148.4, z=-188569.5
  Earth distance: 413,147 km

Closest approach to computed (wrong) Moon center:
  Line 1687: 2026-04-06T15:33:51.319
  Distance to computed Moon: 3,684 km (0.3684 scene units)
  INSIDE culling radius 0.7 => CULLED

Closest approach to correct Moon center:
  Distance: 8,251 km (0.8251 scene units)
  OUTSIDE culling radius 0.7 => NOT CULLED
```

### Code Evidence

```typescript
// Moon.tsx:11-33 — Flawed Moon position algorithm
const flybyPos = useMemo((): [number, number, number] => {
  // Finds max-distance OEM point
  let maxDistSq = 0;
  let flybyVector = oemData[0];
  for (const v of oemData) {
    const distSq = v.x * v.x + v.y * v.y + v.z * v.z;
    if (distSq > maxDistSq) { maxDistSq = distSq; flybyVector = v; }
  }
  // Offsets along radial — WRONG DIRECTION
  const offsetKm = 10637;
  const moonX = (flybyVector.x - dx * offsetKm) / SCALE_FACTOR;
  // ...
}, [oemData]);
```

```typescript
// Trajectory.tsx:8 — Over-aggressive culling radius
const MOON_VISUAL_RADIUS = 0.7;  // 7,000 km > closest approach 3,684 km
```

### Culling Impact

```
Points culled by MOON_VISUAL_RADIUS = 0.7 (with wrong Moon position):
  First culled: line 1639, 2026-04-06T12:21:51.319, dist=6,896 km
  Last culled:  line 1965, 2026-04-07T10:05:51.319, dist=6,973 km
  Total: 206 points culled (~13 hours of trajectory)
```

### Trajectory Direction Verification

```
Orbital normal at Moon (approach x departure): (-0.430, -0.144, +0.891)
  Z component: +0.891 (strongly positive)
  => Counter-clockwise when viewed from north celestial pole
  => CORRECT for Artemis II free-return trajectory
```

---

## Impact Assessment

| Metric | Value |
|--------|-------|
| Trajectory points removed | 206 of 3,239 (~6.4%) |
| Time span of gap | ~13 hours (Apr 6 12:21 -- Apr 7 10:05 UTC) |
| Mission phase affected | Lunar flyby -- the most visually significant segment |
| Moon position error | ~11,000 km (Moon visually displaced from trajectory path) |
| Visual effect | Large gap in trajectory near Moon; Moon not centered on the flyby loop |
| Camera presets affected | Moon View preset looks at wrong location relative to trajectory |

---

## Recommended Fixes

### Fix 1: Replace Moon Position Algorithm (HIGH PRIORITY)

Replace the flawed radial-offset algorithm with a center-of-curvature calculation. The Moon is the gravitational focus of the flyby, so its center is at the center of curvature of the trajectory at closest approach.

**Approach A (Recommended)**: Use three points near the trajectory's closest approach to Earth-max-distance ratio and compute the circumcenter of the triangle they form. This gives the center of the "loop" around the Moon.

**Approach B**: Use the known closest-approach distance (~8,250 km from Moon center). Find the OEM point with maximum angular rate change (sharpest curve), then place the Moon center perpendicular to the trajectory at that point at 8,250 km distance.

**Approach C**: Hard-code the correct Moon position derived from the OEM data analysis: `(-12.6884, -34.4197, -17.9169)` scene units. This is accurate for the specific OEM file but would not adapt to different OEM data.

**Approach D**: Use the Horizons API value (already fetched by `useOEM.ts`) and stop overwriting it from `Moon.tsx`. This requires fixing the unit convention so both sources use scene units.

**Informed by**: Commit `26ef3a1` fixed a symptom (unit mismatch in DataDriver) but the underlying Moon position calculation was never corrected.

### Fix 2: Reduce Culling Radius (MEDIUM PRIORITY)

Reduce `MOON_VISUAL_RADIUS` from 0.7 to 0.55 (just above the visual sphere radius of 0.5). With the correct Moon position, the closest approach is 0.83 scene units, so even 0.7 would not over-cull. But a tighter radius provides better resilience against future position calculation errors.

**Informed by**: New analysis -- the 0.7 value was chosen to buffer the 0.5 sphere but creates an unnecessarily large exclusion zone.

### Fix 3: Unify Moon Position Source (LOW PRIORITY)

Remove the competing Moon position writes. Either:
- (a) Let `Moon.tsx` be the sole source (fix its algorithm), OR
- (b) Let `useOEM.ts` + Horizons API be the sole source (convert to scene units), and have `Moon.tsx` read from the store instead of computing independently.

Option (b) is architecturally cleaner: the data layer (useOEM) fetches and the rendering layer (Moon.tsx) consumes.

**Informed by**: Repeated unit-mismatch bugs across Sessions 2-5 trace back to this dual-source design.

---

## Upstream/Downstream Impact Analysis

### Upstream (What sets moonPosition)
- `useOEM.ts` -- Horizons API fetch + hardcoded fallback (in km)
- `Moon.tsx` -- Computed from OEM data (in scene units)

### Downstream (What reads moonPosition)
- `Trajectory.tsx` -- `splitAroundBodies()` culling (expects scene units)
- `DataDriver.tsx` -- Moon distance for HUD display (expects scene units, multiplies by SCALE_FACTOR)
- `Spacecraft.tsx` -- Moon distance tooltip (reads from store)
- `HUD.tsx` -- Moon Distance telemetry card (reads from spacecraft.moonDist)

### Side Effects of Fix
- Fixing Moon position will move the Moon sphere to the correct location, centered on the trajectory loop
- HUD Moon distance values will change slightly (currently based on wrong Moon center)
- Camera "Moon View" preset will look at the corrected position
- Trajectory will render continuously through the flyby with no gaps

---

## Verification Plan

1. **Moon position**: After fix, verify computed Moon-Earth distance is ~400,000-410,000 km and closest trajectory approach is ~8,000-8,500 km
2. **Trajectory continuity**: Verify no trajectory gaps visible near the Moon from any camera preset
3. **Moon visual alignment**: Verify the Moon sphere appears centered within the trajectory's flyby loop
4. **HUD Moon distance**: Verify the Moon Distance telemetry card shows reasonable values at closest approach (~6,500 km surface)
5. **Camera presets**: Verify "Moon View" camera preset shows the trajectory curving around the Moon

---

**Investigation Complete**: 2026-04-04 23:30 UTC
**Ready for**: RCA Document + Implementation Plan

# Implementation Prompt: Fix Trajectory Near Moon Rendering

**RCA Reference**: docs/RCAs/2026-04-04_2130_trajectory_near_moon.md

## Context

The Moon's position is computed ~11,000 km from its true location due to a flawed radial-offset algorithm. This causes `splitAroundBodies()` to cull 206 trajectory points (~13 hours) near the Moon. The fix replaces the Moon position algorithm, reduces the culling radius, and unifies the Moon position source.

## Goal

Fix the trajectory rendering near the Moon by correcting the Moon position calculation and reducing the culling radius. The Moon should appear centered within the trajectory's flyby loop with no trajectory gaps.

## Requirements

### 1. Replace Moon position algorithm in Moon.tsx (lines 11-35)

Replace the radial-offset `flybyPos` computation with a circumcenter algorithm:

```typescript
const flybyPos = useMemo((): [number, number, number] => {
  if (!oemData || oemData.length === 0) return [38.44, 0, 0];

  // Find the point with maximum angular rate change (sharpest curve = closest approach)
  let maxCurvature = 0;
  let sharpestIdx = Math.floor(oemData.length / 2);
  
  for (let i = 1; i < oemData.length - 1; i++) {
    const prev = oemData[i - 1];
    const curr = oemData[i];
    const next = oemData[i + 1];
    // Compute angle change between consecutive velocity vectors
    const v1x = curr.x - prev.x, v1y = curr.y - prev.y, v1z = curr.z - prev.z;
    const v2x = next.x - curr.x, v2y = next.y - curr.y, v2z = next.z - curr.z;
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);
    if (mag1 === 0 || mag2 === 0) continue;
    const curvature = 1 - dot / (mag1 * mag2); // 0 = straight, 2 = U-turn
    if (curvature > maxCurvature) {
      maxCurvature = curvature;
      sharpestIdx = i;
    }
  }
  
  // Take 3 points: sharpest and ±50 points for a well-spaced triangle
  const span = Math.min(50, Math.floor(oemData.length / 10));
  const i0 = Math.max(0, sharpestIdx - span);
  const i1 = sharpestIdx;
  const i2 = Math.min(oemData.length - 1, sharpestIdx + span);
  
  const A = oemData[i0], B = oemData[i1], C = oemData[i2];
  
  // Circumcenter of triangle ABC in 3D
  const ax = A.x, ay = A.y, az = A.z;
  const bx = B.x, by = B.y, bz = B.z;
  const cx = C.x, cy = C.y, cz = C.z;
  
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  
  // Normal to the triangle plane
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  
  const abMidX = (ax + bx) / 2, abMidY = (ay + by) / 2, abMidZ = (az + bz) / 2;
  const acMidX = (ax + cx) / 2, acMidY = (ay + cy) / 2, acMidZ = (az + cz) / 2;
  
  // Perpendicular bisector directions (in plane)
  const d1x = aby * nz - abz * ny, d1y = abz * nx - abx * nz, d1z = abx * ny - aby * nx;
  const d2x = acy * nz - acz * ny, d2y = acz * nx - acx * nz, d2z = acx * ny - acy * nx;
  
  // Solve for intersection of perpendicular bisectors
  // abMid + t*d1 = acMid + s*d2 (overdetermined, use least-squares via dot products)
  const rx = acMidX - abMidX, ry = acMidY - abMidY, rz = acMidZ - abMidZ;
  const d1d1 = d1x * d1x + d1y * d1y + d1z * d1z;
  const d1d2 = d1x * d2x + d1y * d2y + d1z * d2z;
  const d2d2 = d2x * d2x + d2y * d2y + d2z * d2z;
  const rd1 = rx * d1x + ry * d1y + rz * d1z;
  const rd2 = rx * d2x + ry * d2y + rz * d2z;
  
  const denom = d1d1 * d2d2 - d1d2 * d1d2;
  if (Math.abs(denom) < 1e-10) {
    // Degenerate — fall back to midpoint of sharpest curve
    return [B.x / SCALE_FACTOR, B.y / SCALE_FACTOR, B.z / SCALE_FACTOR];
  }
  
  const t = (rd1 * d2d2 - rd2 * d1d2) / denom;
  
  const moonX = (abMidX + t * d1x) / SCALE_FACTOR;
  const moonY = (abMidY + t * d1y) / SCALE_FACTOR;
  const moonZ = (abMidZ + t * d1z) / SCALE_FACTOR;
  
  return [moonX, moonY, moonZ];
}, [oemData]);
```

### 2. Reduce culling radius in Trajectory.tsx (line 8)

```typescript
// Before:
const MOON_VISUAL_RADIUS = 0.7;

// After:
const MOON_VISUAL_RADIUS = 0.55;
```

### 3. Fix Moon position store convention in useOEM.ts

Convert Horizons API result to scene units at write time:

```typescript
// useOEM.ts:58 — convert km to scene units
useMissionStore.getState().setMoonPosition({
  x: parseFloat(posMatch[1]) / SCALE_FACTOR,
  y: parseFloat(posMatch[2]) / SCALE_FACTOR,
  z: parseFloat(posMatch[3]) / SCALE_FACTOR,
});

// useOEM.ts:68 — fallback also in scene units
useMissionStore.getState().setMoonPosition({ x: 384400 / SCALE_FACTOR, y: 0, z: 0 });

// useOEM.ts:73 — initial fallback also in scene units
useMissionStore.getState().setMoonPosition({ x: 384400 / SCALE_FACTOR, y: 0, z: 0 });
```

### 4. Update DataDriver.tsx Moon distance calculation

Since `moonPosition` is now always in scene units, `DataDriver.tsx` should already work correctly (it multiplies by SCALE_FACTOR). Verify this is the case — no change should be needed.

## Files Likely Affected

- `src/components/Moon.tsx` — Replace flybyPos algorithm (lines 11-35)
- `src/components/Trajectory.tsx` — Reduce MOON_VISUAL_RADIUS (line 8)
- `src/hooks/useOEM.ts` — Convert Horizons values to scene units (lines 58, 68, 73)
- `src/components/DataDriver.tsx` — Verify Moon distance calculation (read-only check)

## Constraints

- Do NOT change the Moon visual sphere radius (0.5 scene units) — only the culling radius
- Do NOT remove the Horizons API fetch — it provides correct real-time Moon position
- The circumcenter algorithm must handle degenerate cases (collinear points)
- SCALE_FACTOR = 10,000 (1 scene unit = 10,000 km)
- Moon visual sphere radius = 0.5 (5,000 km) — much larger than real Moon (1,737 km)

## Acceptance Criteria

- [ ] Build passes (`npm run build`)
- [ ] No trajectory gaps visible near the Moon from any camera angle
- [ ] Moon sphere appears centered within the trajectory's flyby loop
- [ ] Moon-Earth distance in hover card shows ~400,000-410,000 km
- [ ] HUD Moon Distance telemetry shows reasonable values
- [ ] Trajectory direction remains counter-clockwise (unchanged)
- [ ] Mobile layout unaffected

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Explore the codebase and design your implementation approach using read-only tools
3. Write the plan to `docs/plans/2026-04-04_2130_trajectory_near_moon.md`
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop.

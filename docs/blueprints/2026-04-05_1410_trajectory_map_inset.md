# Blueprint: Trajectory Map Inset (NSF-style Overview)

**Date**: 2026-04-05
**Design Reference**: docs/design/2026-04-05_1400_trajectory_map_inset.md
**Research Reference**: docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md

## Objective

Add an always-visible SVG trajectory overview inset to the HUD, showing the full figure-8 free-return path with Earth, Moon, and Orion markers. Matches the NASASpaceflight broadcast dashboard's trajectory panel.

## Requirements

1. New component `TrajectoryMap.tsx` renders an SVG with the full mission trajectory
2. 3D OEM data projected to 2D using the orbital plane normal
3. Downsampled to ~200 points for SVG performance
4. Past trajectory in orange (solid), future in cyan (dashed)
5. Earth (blue dot at origin), Moon (grey dot), Orion (green dot — updates at 4Hz)
6. Glass-morphism background matching HUD cards
7. Responsive: 180x140px desktop, 120x100px mobile
8. Positioned in the HUD layout between the top bar and bottom telemetry

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | SVG in React JSX | Crisp at any resolution, native React, no GPU context |
| Projection | Orbital plane normal → 2 in-plane axes | Same math as CameraController, consistent orientation |
| Downsampling | Every 16th point (~202 pts) | Smooth enough for overview, fast SVG rendering |
| Data source | Zustand store (`oemData`, `spacecraft`, `moonPosition`) | Consistent with all other HUD components |
| Update frequency | Store-driven (4Hz from DataDriver throttle) | No custom interval needed |

## Scope

### In Scope
- `src/hud/TrajectoryMap.tsx` — new SVG trajectory overview component
- `src/hud/HUD.tsx` — add TrajectoryMap to layout

### Out of Scope
- Interactive features (click to zoom, hover tooltips)
- Second R3F Canvas
- Trajectory data modifications

## Files Affected

- `src/hud/TrajectoryMap.tsx` — NEW (~120 lines)
- `src/hud/HUD.tsx` — import + add `<TrajectoryMap />` to layout (~3 lines)

## Implementation Sequence

### Step 1: Create `src/hud/TrajectoryMap.tsx`

The component:

```typescript
import { useMemo } from 'react';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

const DOWNSAMPLE = 16; // 3,239 / 16 ≈ 202 points
const PAD = 10; // SVG padding in percent

/** Compute orbital plane basis vectors from 3 trajectory points. */
function computePlaneBasis(data: { x: number; y: number; z: number }[]) {
  const i0 = 0;
  const i1 = Math.floor(data.length * 0.25);
  const i2 = Math.floor(data.length * 0.5);

  const v1x = data[i1].x - data[i0].x, v1y = data[i1].y - data[i0].y, v1z = data[i1].z - data[i0].z;
  const v2x = data[i2].x - data[i0].x, v2y = data[i2].y - data[i0].y, v2z = data[i2].z - data[i0].z;

  // Normal = v1 × v2
  let nx = v1y * v2z - v1z * v2y;
  let ny = v1z * v2x - v1x * v2z;
  let nz = v1x * v2y - v1y * v2x;
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx /= nLen; ny /= nLen; nz /= nLen;
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }

  // U = normalize(N × [0,1,0]) — in-plane horizontal
  let ux = nz, uy = 0, uz = -nx; // cross(N, [0,1,0])
  const uLen = Math.sqrt(ux * ux + uz * uz);
  if (uLen < 1e-6) { ux = 1; uz = 0; } else { ux /= uLen; uz /= uLen; }

  // V = N × U — in-plane vertical
  const vx = ny * uz - nz * uy;
  const vy = nz * ux - nx * uz;
  const vz = nx * uy - ny * ux;

  return { ux, uy: 0, uz, vx, vy, vz };
}

function project(x: number, y: number, z: number, basis: ReturnType<typeof computePlaneBasis>): [number, number] {
  return [
    x * basis.ux + y * basis.uy + z * basis.uz,
    x * basis.vx + y * basis.vy + z * basis.vz,
  ];
}
```

Then the component body:
1. Read `oemData`, `spacecraft`, `moonPosition` from store
2. `useMemo`: compute basis, downsample+project all points, compute bounds, normalize to viewBox
3. Split points at current time into past/future SVG polyline strings
4. Project Moon and Orion positions
5. Render SVG with glass-morphism container

### Step 2: Add to HUD layout

In `HUD.tsx`, add `<TrajectoryMap />` between the top bar and bottom section. Position it in the middle area (currently empty space where the 3D scene shows through).

```tsx
// After the top bar div, before {/* Bottom section */}:
<div className="flex-1 flex items-start justify-end pointer-events-auto">
  <TrajectoryMap />
</div>
```

This places the inset in the top-right area, below the MissionClock, above the secondary row.

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SVG rendering slow with 200 points | Very Low | Low | 200-point polyline is trivial for SVG |
| Projection doesn't match visual orientation | Low | Medium | Same math as CameraController — verified |
| Orion dot jitters at 4Hz update | Low | Low | Store throttle already smooths updates |

## Acceptance Criteria

- [ ] Figure-8 trajectory shape visible in inset
- [ ] Earth (blue dot) at center, Moon (grey dot) at correct position
- [ ] Orion (green dot) moves along trajectory in real-time
- [ ] Past trajectory orange solid, future cyan dashed
- [ ] Glass-morphism background with border matching HUD style
- [ ] Responsive sizing (smaller on mobile)
- [ ] Build passes

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 3
- **Completion criteria**: Build passes, SVG renders correctly
- **Invoke with**: `/wrought-implement`

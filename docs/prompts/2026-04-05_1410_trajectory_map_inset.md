# Implementation Prompt: Trajectory Map Inset

**Blueprint Reference**: docs/blueprints/2026-04-05_1410_trajectory_map_inset.md
**Design Reference**: docs/design/2026-04-05_1400_trajectory_map_inset.md

## Context

The NSF Artemis II dashboard has an always-visible trajectory overview inset showing the full figure-8 path. Our single-scene 3D view loses the trajectory shape at most camera angles. Adding an SVG inset provides constant mission context.

## Goal

Create `src/hud/TrajectoryMap.tsx` — an SVG trajectory overview in the HUD showing Earth, Moon, Orion, and past/future trajectory.

## Requirements

1. Project 3D OEM data to 2D using orbital plane normal (same math as CameraController)
2. Downsample 3,239 → ~200 points (every 16th)
3. Past trajectory: orange solid polyline. Future: cyan dashed
4. Earth: blue dot at origin. Moon: grey dot from store. Orion: green dot from store (4Hz)
5. Glass-morphism background: `bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg`
6. Size: `w-[180px] h-[140px] sm:w-[180px]` (hidden on mobile <640px to avoid crowding)
7. Position: top-right area of HUD, below MissionClock

## Files

- `src/hud/TrajectoryMap.tsx` — NEW (~120 lines)
- `src/hud/HUD.tsx` — import + render `<TrajectoryMap />`

## Implementation Details

### TrajectoryMap.tsx structure:

1. **Pure functions above component** (matching codebase pattern):
   - `computePlaneBasis(data)` — orbital plane normal → U, V axes
   - `project(x, y, z, basis)` → [u, v] 2D coordinates

2. **Component body**:
   - `useMemo([oemData])`: compute basis, downsample, project all points, find bounds, generate SVG coordinate strings
   - Read `spacecraft.x/y/z` for Orion position (4Hz updates from store)
   - Read `moonPosition` for Moon dot
   - Split trajectory at current time into past/future
   - Render SVG with viewBox fitted to trajectory bounds + padding

3. **SVG elements**:
   - `<polyline>` for past trajectory (orange, strokeWidth 1.5)
   - `<polyline>` for future trajectory (cyan, strokeDasharray "4 3")
   - `<circle>` for Earth (r=3, blue, at projected origin)
   - `<circle>` for Moon (r=2, grey, at projected Moon position)
   - `<circle>` for Orion (r=2.5, green, animated glow via filter)

### HUD.tsx changes:

Add between top bar and bottom section:
```tsx
<div className="hidden sm:flex flex-1 items-start justify-end pointer-events-auto">
  <TrajectoryMap />
</div>
```

Hidden on mobile (`hidden sm:flex`) to avoid crowding the small screen.

## Constraints

- Do NOT add a second R3F Canvas — SVG only
- Downsample to ~200 points max for SVG performance
- Use store data only — no direct OEM file reads
- Hidden on mobile (<640px)

## Acceptance Criteria

- [ ] Figure-8 shape clearly visible
- [ ] Earth, Moon, Orion dots correctly positioned
- [ ] Past/future color coding matches main 3D view
- [ ] Glass-morphism styling matches HUD cards
- [ ] Hidden on mobile, visible on desktop
- [ ] Build passes

# Design Analysis: Trajectory Map Inset (F2)

**Date**: 2026-04-05
**Mode**: Tradeoff (--quick)
**Finding**: F2 in `docs/findings/2026-04-05_1110_visual_scale_nsf_proportions_FINDINGS_TRACKER.md`
**Research**: `docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md`

---

## Options

### Option A: SVG Overlay (RECOMMENDED)

New React component `src/hud/TrajectoryMap.tsx` renders an SVG element inside the HUD layer.

- Project 3D OEM data to 2D using orbital plane normal (same math as CameraController)
- Downsample 3,239 OEM points to ~200 for SVG performance
- SVG `<polyline>` for past (orange) and future (cyan dashed) trajectory
- SVG `<circle>` for Earth (blue), Moon (grey), Orion (green)
- Update Orion position from store `spacecraft.x/y/z` at 4Hz
- Glass-morphism background matching HUD cards

**Pros**: Lightweight, crisp, React-native JSX, easy to style, no GPU context.
**Cons**: Need to compute 2D projection from 3D data.
**Effort**: ~120 lines new component, ~30 min.

### Option B: Second R3F Canvas

Second `<Canvas>` with orthographic camera looking down the orbital plane.

**Pros**: True 3D, consistent rendering.
**Cons**: Double GPU context (~2x GPU memory), complex setup, overkill. Performance risk on mobile.
**Effort**: ~80 lines, but complex integration.

### Option C: HTML5 Canvas 2D

Manual `<canvas>` drawing with `getContext('2d')`.

**Pros**: Fast pixel rendering.
**Cons**: Manual animation loop, no React integration, harder to style.
**Effort**: ~150 lines.

---

## Recommendation: Option A (SVG)

SVG integrates naturally with React (JSX), renders crisply at any resolution, and matches the existing HUD glass-morphism pattern. Downsampled to ~200 points, SVG performance is excellent.

### Implementation Approach

1. **Projection**: Compute orbital plane normal from 3 OEM points (same as CameraController). Create two orthogonal in-plane axes. Project each 3D point to 2D via dot products.

2. **Downsampling**: Take every 16th OEM point (3,239 / 16 ≈ 202 points). Smooth enough for the overview.

3. **Scaling**: Fit all projected points into the SVG viewBox with padding. Earth at origin (0,0), Moon position projected and plotted.

4. **Orion marker**: Read `spacecraft.x/y/z` from store, project to 2D, render as animated green dot.

5. **Layout**: Fixed position in top-right corner of HUD, `w-[180px] h-[140px]` on desktop, `w-[120px] h-[100px]` on mobile. Glass-morphism background with border.

6. **Past/Future split**: Use current time to split trajectory into past (solid orange) and future (dashed cyan), matching the main 3D view.

### Data Flow

```
Store (oemData) → useMemo: project 3D → 2D, downsample → SVG polyline points
Store (spacecraft.x/y/z) → project to 2D → Orion dot position (updates at 4Hz)
Store (moonPosition) → project to 2D → Moon dot position (static)
```

---

## Files Affected

- `src/hud/TrajectoryMap.tsx` — NEW: SVG trajectory inset component
- `src/hud/HUD.tsx` — Add `<TrajectoryMap />` to the HUD layout (top-right area)

## Acceptance Criteria

- [ ] Trajectory figure-8 shape visible in inset at all times
- [ ] Earth (blue dot), Moon (grey dot), Orion (green dot) positioned correctly
- [ ] Past trajectory orange, future trajectory cyan dashed
- [ ] Orion position updates in real-time
- [ ] Responsive: smaller on mobile, larger on desktop
- [ ] Glass-morphism styling matches HUD cards
- [ ] Build passes

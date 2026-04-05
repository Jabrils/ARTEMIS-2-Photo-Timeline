# Investigation: Trajectory Map Inset Blocks 3D Orbit Controls (Drag/Rotate)

**Date**: 2026-04-05
**Investigator**: Claude Code (Session 5)
**Severity**: High (Defect)
**Status**: Investigation Complete

---

## Executive Summary

The trajectory map inset added in commit `9f3ec74` ("Add trajectory map inset: NSF-style always-visible figure-8 overview") breaks all mouse/touch drag interaction with the 3D scene. The wrapper `<div>` for the `<TrajectoryMap />` component uses `flex-1 pointer-events-auto`, which causes it to expand to fill the entire vertical space between the top bar and bottom telemetry section. This invisible div intercepts all pointer events (mousedown, touchstart, pointermove, etc.) before they reach the underlying `<Canvas>` element where `<OrbitControls>` listens for drag/rotate/pan input.

---

## Root Cause

**File**: `src/hud/HUD.tsx`, line 73-75 (added in commit `9f3ec74`)

```tsx
{/* Trajectory map inset — desktop only */}
<div className="hidden sm:flex flex-1 items-start justify-end pointer-events-auto">
  <TrajectoryMap />
</div>
```

**Mechanism**: The HUD is an `absolute inset-0` overlay on the full viewport with `pointer-events-none` on the container. Individual interactive elements opt into `pointer-events-auto`. The trajectory map wrapper div has **two problematic classes**:

1. **`flex-1`** (= `flex: 1 1 0%`): In the HUD's column flex layout (`flex flex-col justify-between`), `flex-1` makes this div grow to fill ALL remaining vertical space between the top bar and bottom section. This is the entire "scene viewing area" -- roughly 60-70% of the viewport.

2. **`pointer-events-auto`**: Applied to the entire wrapper div, not just the `<TrajectoryMap />` child. Since the wrapper spans the full width and most of the height, ALL pointer events in that area are captured by this invisible div instead of passing through to the 3D canvas below.

**Result**: The `<OrbitControls>` component (from `@react-three/drei`) never receives mousedown/touchstart events because they are consumed by the HUD overlay div. Orbit, pan, and zoom via drag are all blocked. Only scroll-wheel zoom may still work (depending on event propagation).

---

## Evidence

### Git Diff (commit `9f3ec74`)

The exact change in `src/hud/HUD.tsx`:
```diff
+      {/* Trajectory map inset — desktop only */}
+      <div className="hidden sm:flex flex-1 items-start justify-end pointer-events-auto">
+        <TrajectoryMap />
+      </div>
```

### Layout Analysis

HUD structure (column flex, `justify-between`):
```
[Top bar]           — fixed height (~48px), pointer-events-auto
[Trajectory Map]    — flex-1 (fills remaining ~60-70% of viewport), pointer-events-auto  <-- PROBLEM
[Bottom section]    — fixed height (~120px), pointer-events-auto
```

The `<TrajectoryMap />` component itself is only 180x140px (defined as `SVG_W = 180` and `SVG_H = 140` in `TrajectoryMap.tsx`), but its parent div spans the entire middle area.

### Prior Precedent

This is the exact same class of bug documented in the ProgressBar overlay investigation (`docs/investigations/2026-04-04_2215_progressbar_overlay_and_height_mismatch.md`): a flex-growing element with `pointer-events-auto` expands beyond its visible content and blocks interaction with underlying layers.

---

## Fix

Move `pointer-events-auto` from the wrapper div to the `<TrajectoryMap />` component itself (or a tightly-sized inner wrapper), and remove `flex-1` from the wrapper div so it does not expand to fill the viewport:

**Option A** (minimal fix — move pointer-events to component, remove flex-1):
```tsx
<div className="hidden sm:flex items-start justify-end">
  <div className="pointer-events-auto">
    <TrajectoryMap />
  </div>
</div>
```

**Option B** (simplest — inline pointer-events on TrajectoryMap's root div):
Move the `pointer-events-auto` class into the root `<div>` of `TrajectoryMap.tsx` itself and remove `flex-1` from the HUD wrapper, replacing it with a non-growing positioning strategy.

Either fix ensures only the 180x140px map area captures pointer events, while the rest of the middle viewport passes events through to the 3D canvas.

---

## Impact

- **Desktop only** (wrapper uses `hidden sm:flex` — mobile is not affected)
- **All 3D interaction blocked**: rotate, pan, drag. Users cannot orbit around the scene, select camera angles manually, or interact with the 3D model at all
- **Camera presets still work** (they animate programmatically via `CameraController.tsx` without needing pointer events)
- **Scroll wheel zoom may still work** depending on event propagation

---

## Past RCAs/Investigations Reviewed

- `docs/investigations/2026-04-04_2215_progressbar_overlay_and_height_mismatch.md` — Same class of bug: flex-growing element with `pointer-events-auto` blocking underlying content. The fix there was to constrain the element's growth and apply `isolate` stacking.
- `docs/RCAs/2026-04-04_2045_progressbar_overlay_and_height.md` — Related RCA documenting the `flex-1` + `pointer-events-auto` pattern as a recurring source of overlay bugs in this codebase.

---

## Scope

- **Isolated**: Single wrapper div in `src/hud/HUD.tsx` (lines 73-75)
- **Introduced in**: Commit `9f3ec74` (most recent commit)
- **Revert safe**: Yes — reverting lines 73-75 in HUD.tsx (and the import) would restore drag functionality. However, a targeted fix is preferable to preserve the trajectory map feature.

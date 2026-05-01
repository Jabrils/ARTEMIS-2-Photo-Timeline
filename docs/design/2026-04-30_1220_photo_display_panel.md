# Design: Photo Display Panel — In-Scene Overlay

**Date**: 2026-04-30 12:20 UTC
**Finding**: F2 — docs/findings/2026-04-30_1220_photo_display_panel_gap.md
**Tracker**: docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md
**Mode**: from-scratch

---

## Goal

Display a full-size photo panel in the top-left of the 3D viewport when sim time is within ±30 min of a photo milestone. Panel fades out when no photo is in range.

---

## Current State

- `src/hud/HUD.tsx` — `absolute inset-0 pointer-events-none` overlay, mounts all HUD panels
- `useMission()` hook — returns `totalMs` from which `elapsedHours = totalMs / 3_600_000`
- `MILESTONES` — array with `photo` (path string) and `missionElapsedHours`
- `framer-motion` `AnimatePresence` + `motion` — already used in HUD for panel transitions
- `--z-hud: 10` through `--z-tooltip: 55` — z-index system in `src/index.css`
- Top-left quadrant: occupied only by `ARTEMIS II` header (~40–56px tall); space below is free

---

## Recommendation

New component `src/hud/PhotoPanel.tsx`, mounted in `HUD.tsx` as an absolutely-positioned overlay in the top-left below the header.

### Trigger logic

```
elapsedHours = (simEpochMs - LAUNCH_EPOCH.getTime()) / 3_600_000

activePhoto = MILESTONES
  .filter(m => m.photo && Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5)
  .sort by |delta| ascending
  [0]  // closest match, or undefined
```

Window of ±0.5h (30 min) — tight enough to feel intentional, wide enough not to require frame-perfect positioning.

### Layout

```
┌─────────────────────────────────────────┐
│  ARTEMIS II  [crew]            clock    │  ← top bar (~48px)
│                                         │
│  ┌──────────────────┐                   │
│  │                  │                   │
│  │   [photo image]  │                   │  ← PhotoPanel (top-left, below header)
│  │                  │                   │
│  └──────────────────┘                   │
│         [3D scene]                      │
│                                         │
│  [DSN]   [weather]        [camera]      │
│  [time controls]                        │
│  [speed] [earth] [moon] [progress ←→]  │
└─────────────────────────────────────────┘
```

- Position: `absolute left-4 top-14 sm:top-16`
- Width: `w-72 sm:w-80` (288–320px)
- Image: `w-full` with natural aspect ratio (`object-contain` or natural height)
- Panel: dark semi-transparent bg, cyan border, `pointer-events-auto`
- Caption row: filename truncated + `T+{hours}h` in monospace
- Animation: `opacity: 0→1, y: 8→0` on enter; reverse on exit via `AnimatePresence`
- z-index: `z-[var(--z-hud)]` (same layer as rest of HUD)

### Caption

```
[photo filename without extension]   T+27.5h
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/hud/PhotoPanel.tsx` | New component — all panel logic |
| `src/hud/HUD.tsx` | Import and render `<PhotoPanel />` inside the HUD overlay div |

---

## Effort

- ~50 lines for `PhotoPanel.tsx`
- ~2 lines added to `HUD.tsx`
- No new dependencies
- No breaking changes
- Estimated: 15 minutes

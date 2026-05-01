# Blueprint: Photo Display Panel — In-Scene Overlay

**Date**: 2026-04-30
**Design Reference**: docs/design/2026-04-30_1220_photo_display_panel.md
**Finding**: F2 — docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md

## Objective

Build a `PhotoPanel` overlay component that displays a full-size mission photo in the top-left of the 3D viewport when sim time is within ±30 min of a photo milestone, fading in/out via Framer Motion.

## Requirements

1. New `src/hud/PhotoPanel.tsx` — self-contained, subscribes to `simEpochMs` from store
2. Compute `elapsedHours = (simEpochMs - LAUNCH_EPOCH.getTime()) / 3_600_000`
3. Find active photo: filter `MILESTONES` where `m.photo` is set and `Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5`; take the closest match by `|delta|`
4. Render photo full-width in a panel; below image show filename (without extension) and `T+{hours}h` in monospace
5. Fade in (`opacity 0→1, y 8→0`) when photo found; fade out and unmount via `AnimatePresence` when none
6. Position: `absolute left-4 top-14 sm:top-16`; width `w-72 sm:w-80`; dark semi-transparent bg, cyan border
7. `pointer-events-auto` so the panel is interactable; `z-[var(--z-hud)]`
8. Mount `<PhotoPanel />` in `src/hud/HUD.tsx` inside the existing `absolute inset-0` overlay div

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component location | `src/hud/PhotoPanel.tsx` | Consistent with other HUD panels |
| Animation | Framer Motion `AnimatePresence` + `motion.div` | Already a dependency, used in HUD |
| Trigger window | ±0.5h (30 min) | Tight enough to feel intentional |
| Closest match | Sort by `|delta|`, take index 0 | Safe if two photos overlap in window |
| Caption | filename stem + `T+{n}h` | Minimal but informative |

## Scope

### In Scope
- `src/hud/PhotoPanel.tsx` — new component
- `src/hud/HUD.tsx` — import + one-line mount

### Out of Scope
- Adding new photos from `photo-manifest.json` to `mission-config.ts`
- Click-to-expand / lightbox
- Mobile-specific layout changes

## Files Affected

| File | Change |
|------|--------|
| `src/hud/PhotoPanel.tsx` | New — full panel logic (~50 lines) |
| `src/hud/HUD.tsx` | Add `import PhotoPanel` + `<PhotoPanel />` inside overlay div |

## Implementation Sequence

1. Create `src/hud/PhotoPanel.tsx` with all logic and JSX
2. Add import and `<PhotoPanel />` to `src/hud/HUD.tsx` — mount inside the `absolute inset-0` wrapper, before the top bar div

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Photo missing from `/public/photos/` | L | L | `<img>` silently renders broken; acceptable |
| Two milestones within ±30min of each other | L | L | Sort by delta, closest wins |
| Panel covers top-left 3D content | L | L | By design — intentional at photo markers |

## Acceptance Criteria

- [ ] Panel appears in top-left when sim time is within ±30 min of any photo milestone
- [ ] Panel fades out when sim time moves outside the ±30 min window
- [ ] Caption shows filename stem and `T+{n}h`
- [ ] Panel has dark bg, cyan border, consistent with HUD aesthetic
- [ ] No layout regression to existing HUD panels
- [ ] `npm run build` passes

## Constraints

- No new dependencies
- Keep HUD aesthetic: `rgba(10,10,30,0.7)` background, `rgba(0,212,255,0.2)` border, monospace captions
- Do not modify `MILESTONES` data or store

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 3
- **Completion criteria**: build passes, panel renders at correct milestone times
- **Invoke with**: `/wrought-implement`

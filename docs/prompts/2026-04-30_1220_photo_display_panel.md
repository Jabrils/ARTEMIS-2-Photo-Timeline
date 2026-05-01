# Implementation Prompt: Photo Display Panel

**Blueprint Reference**: docs/blueprints/2026-04-30_1220_photo_display_panel.md
**Design Reference**: docs/design/2026-04-30_1220_photo_display_panel.md

## Context

The Artemis II mission viewer has photos attached to milestones (`MILESTONES[].photo`) but no full-size display in the viewport. This adds a `PhotoPanel` overlay that fades in when sim time is within ±30 min of a photo milestone, showing the photo full-width in the top-left of the scene.

## Goal

Create `src/hud/PhotoPanel.tsx` and mount it in `src/hud/HUD.tsx`.

## Requirements

1. Compute `elapsedHours = (simEpochMs - LAUNCH_EPOCH.getTime()) / 3_600_000` from `useMissionStore(s => s.timeControl.simEpochMs)`
2. Find active photo: filter `MILESTONES` where `m.photo && Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5`; sort by `|delta|` ascending; take index 0 (or `undefined` if none)
3. Wrap in `AnimatePresence`; render a `motion.div` with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: 8 }}`
4. Panel position: `absolute left-4 top-14 sm:top-16`; width `w-72 sm:w-80`
5. Panel style: `bg-[rgba(10,10,30,0.85)] backdrop-blur-sm border border-[rgba(0,212,255,0.3)] rounded-lg overflow-hidden`
6. Image: `<img src={activePhoto.photo} className="w-full object-cover" />`
7. Caption row below image: filename stem (strip path and extension) on the left, `T+{activePhoto.missionElapsedHours}h` on the right — both `text-[10px] font-mono`
8. `pointer-events-auto` on the panel; `z-[var(--z-hud)]`
9. In `HUD.tsx`: import `PhotoPanel` and render `<PhotoPanel />` as the first child inside the `absolute inset-0` wrapper div

## Files Affected

- `src/hud/PhotoPanel.tsx` — create new
- `src/hud/HUD.tsx` — add import + `<PhotoPanel />`

## Implementation Sequence

1. Create `src/hud/PhotoPanel.tsx`
2. Add to `src/hud/HUD.tsx`

## Constraints

- Use `framer-motion` `AnimatePresence` and `motion` (already imported in HUD)
- No new npm dependencies
- HUD aesthetic: dark bg, cyan border, monospace text
- Do not modify `MILESTONES`, store, or any other file

## Acceptance Criteria

- [ ] Panel appears in top-left within ±30 min of any photo milestone
- [ ] Panel fades out when outside the window
- [ ] Caption shows filename stem and mission elapsed hours
- [ ] `npm run build` passes with no TypeScript errors

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Read `src/hud/HUD.tsx`, `src/data/mission-config.ts`, and `src/store/mission-store.ts` to confirm imports needed
3. Write the plan to `docs/plans/2026-04-30_1220_photo_display_panel.md`
4. Call `ExitPlanMode` to present for user approval
5. Wait for user approval before proceeding
6. After approval, invoke `/wrought-implement`

# Implementation Prompt: Photo Navigation Arrows

**Blueprint Reference**: docs/blueprints/2026-04-30_1200_photo_nav_arrows.md
**Design Reference**: docs/design/2026-04-30_1200_photo_nav_arrows.md

## Context

The Mission Progress bar in `src/hud/ProgressBar.tsx` shows clickable milestone dots but has no sequential navigation. The ~13 photo dots clustered between T+120–140h are difficult to click individually. This adds prev/next arrow buttons to step through photos one at a time and update Orion's 3D position.

## Goal

Add `←` and `→` buttons in the countdown row below the progress bar track that navigate between photo milestones by calling `setTimeMode('sim')` + `setSimTime`.

## Requirements

1. Derive `photoMilestones` by filtering `milestoneData` to entries where `m.photo` is set (already sorted by time from existing `useMemo`)
2. Compute `currentPhotoIndex` — last index in `photoMilestones` where `missionElapsedHours <= elapsedHours`; default to 0 if none reached
3. `←` navigates to `photoMilestones[currentPhotoIndex - 1]`; disabled when `currentPhotoIndex === 0`
4. `→` navigates to `photoMilestones[currentPhotoIndex + 1]`; disabled when `currentPhotoIndex === photoMilestones.length - 1`
5. Click handler: `setTimeMode('sim')` then `setSimTime(LAUNCH_EPOCH.getTime() + target.missionElapsedHours * 3_600_000)`
6. Buttons sit inline in the existing countdown row (the `<div>` containing the `Next: …` text at the bottom of the component)
7. Disabled buttons: reduced opacity, `cursor-not-allowed`, no pointer events

## Files Affected

- `src/hud/ProgressBar.tsx` — only file to change

## Implementation Sequence

1. Inside the `useMemo` that produces `milestoneData`, also derive `photoMilestones` (or derive it outside as a second `useMemo` depending on `milestoneData`)
2. Compute `currentPhotoIndex` from `elapsedHours` and `photoMilestones`
3. Define `handlePhotoNav(index: number)` that calls `setTimeMode` + `setSimTime`
4. In the JSX countdown row, add `←` button (left), existing countdown text (center/flex), `→` button (right)
5. Apply disabled styling: `opacity-30 cursor-not-allowed pointer-events-none` when at boundaries

## Constraints

- Do not change the progress track layout or percentage label
- Reuse the existing `setTimeMode` / `setSimTime` / `LAUNCH_EPOCH` — already imported
- Keep HUD aesthetic: dark semi-transparent background, cyan (`#00d4ff`) accent colour, monospace text, small font size
- No new dependencies

## Acceptance Criteria

- [ ] `←` and `→` buttons visible below the progress bar
- [ ] `→` click moves Orion to next photo milestone position in 3D scene
- [ ] `←` click moves Orion to previous photo milestone position
- [ ] `←` disabled at first photo, `→` disabled at last photo
- [ ] `npm run build` passes with no TypeScript errors
- [ ] No layout regression to track or percentage label

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Explore `src/hud/ProgressBar.tsx` and `src/store/mission-store.ts` using read-only tools
3. Write the plan to `docs/plans/2026-04-30_1200_photo_nav_arrows.md` including:
   - Step-by-step implementation tasks with exact line numbers/insertions
   - Testing strategy (build check)
4. Call `ExitPlanMode` to present the plan for user approval
5. Wait for user approval before proceeding
6. After approval, invoke `/wrought-implement` to start the autonomous implementation loop

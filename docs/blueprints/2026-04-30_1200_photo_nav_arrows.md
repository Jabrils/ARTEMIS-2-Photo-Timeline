# Blueprint: Photo Navigation Arrows — Mission Progress Bar

**Date**: 2026-04-30
**Design Reference**: docs/design/2026-04-30_1200_photo_nav_arrows.md
**Finding**: F1 — docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md

## Objective

Add `←` and `→` arrow buttons to the Mission Progress bar's countdown row that step Orion's simulated position sequentially through photo milestones, updating the 3D scene position on each click.

## Requirements

1. Filter `milestoneData` to photo-only entries (`m.photo` is set), sorted by time
2. Derive `currentPhotoIndex` — the last photo milestone whose `missionElapsedHours ≤ elapsedHours` (default 0 before any photo is reached)
3. `←` button jumps to `photoMilestones[currentPhotoIndex - 1]`; disabled when `currentPhotoIndex === 0`
4. `→` button jumps to `photoMilestones[currentPhotoIndex + 1]`; disabled when at last photo
5. Each click calls `setTimeMode('sim')` + `setSimTime(LAUNCH_EPOCH + hours * 3_600_000)`
6. Buttons sit in the existing countdown row below the progress bar track
7. Buttons are visually consistent with the HUD aesthetic (dark background, cyan accent, monospace)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement | Countdown row (below track) | No track width compression; natural proximity to context |
| Disable vs wrap | Disable at boundaries | Wrap-around would be disorienting for a linear timeline |
| Photo filter scope | `milestoneData.filter(m => m.photo)` | All current MILESTONES have photos; filter is future-safe |
| Current index logic | Last photo with elapsed ≥ hours | "You are here" semantics — where you've been, not where you're going |

## Scope

### In Scope
- Two arrow buttons (`←` / `→`) in `src/hud/ProgressBar.tsx`
- `photoMilestones` derived array and `currentPhotoIndex` computation
- Disabled state styling at first/last photo

### Out of Scope
- Adding new photos from `photo-manifest.json` to `mission-config.ts` (separate task)
- Tooltip changes
- Mobile-specific touch gestures

## Files Affected

- `src/hud/ProgressBar.tsx` — add `photoMilestones`, `currentPhotoIndex`, and two buttons in the countdown row

## Implementation Sequence

1. Derive `photoMilestones` from `milestoneData` (already sorted, filtered by `m.photo`)
2. Compute `currentPhotoIndex` from `elapsedHours`
3. Add button click handlers reusing existing `setTimeMode` + `setSimTime` pattern
4. Render `←` and `→` buttons in the countdown row with disabled states

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `elapsedHours` at exactly a milestone boundary | L | L | `>=` comparison already used for dot active state |
| All milestones have photos → filter is identity | L | L | No functional issue; filter is still correct |

## Acceptance Criteria

- [ ] `←` and `→` buttons appear below the progress bar
- [ ] Clicking `→` advances Orion to the next photo milestone position in the 3D scene
- [ ] Clicking `←` moves Orion to the previous photo milestone position
- [ ] `←` is disabled (visually greyed, non-clickable) at the first photo
- [ ] `→` is disabled at the last photo
- [ ] No layout regression to the progress track or percentage label

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build` (TypeScript compile check)
- **Max iterations**: 3
- **Completion criteria**: build passes, buttons render, click advances sim time
- **Invoke with**: `/wrought-implement`

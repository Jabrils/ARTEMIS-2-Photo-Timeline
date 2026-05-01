# Design: Photo Navigation Arrows — Mission Progress Bar

**Date**: 2026-04-30 12:00 UTC
**Finding**: F1 — docs/findings/2026-04-30_1200_photo_nav_gap.md
**Tracker**: docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md
**Mode**: from-scratch

---

## Goal

Add prev/next arrow buttons to the Mission Progress bar that step Orion's simulated position sequentially through photo milestones.

---

## Current State

- `src/hud/ProgressBar.tsx` renders milestone dots; all 15 MILESTONES entries have `photo` set
- `setSimTime(epochMs)` + `setTimeMode('sim')` already imported and wired to dot click handlers
- No sequential navigation exists

---

## Options Evaluated

| Option | Placement | Trade-off |
|--------|-----------|-----------|
| A | Left/right of progress track | Compresses track width |
| B ✓ | Bottom row alongside "Next:" text | No layout disruption, natural position |
| C | Header row ("Mission Progress" label area) | Visually distant from bar |

---

## Recommendation: Option B

Arrows placed in the existing countdown row beneath the bar:

```
[Mission Progress]
[====●========] 42.3%
[←]  Next: photo name in 2h 15m  [→]
```

### Logic

```
photoMilestones = milestoneData.filter(m => m.photo)   // sorted by time

currentPhotoIndex = last index where elapsedHours >= photoMilestones[i].missionElapsedHours
                    (defaults to 0 if none reached yet)

prev = photoMilestones[currentPhotoIndex - 1]   disabled if currentPhotoIndex === 0
next = photoMilestones[currentPhotoIndex + 1]   disabled if currentPhotoIndex === last
```

On click: `setTimeMode('sim')` + `setSimTime(LAUNCH_EPOCH + hours * 3_600_000)`

### Disable behavior

- At first photo: `←` is disabled (greyed, non-interactive)
- At last photo: `→` is disabled
- No wrap-around

---

## Files to Change

| File | Change |
|------|--------|
| `src/hud/ProgressBar.tsx` | Add `photoMilestones` derived array, `currentPhotoIndex`, prev/next buttons in bottom row |

**No other files need changes.** Store actions and LAUNCH_EPOCH already imported.

---

## Effort

- ~20 lines added to `ProgressBar.tsx`
- No new dependencies
- No breaking changes
- Estimated: 15 minutes

# Plan: ProgressBar Layout Refinement (F1/F2 follow-up)

**RCA Reference**: docs/RCAs/2026-04-04_2045_progressbar_overlay_and_height.md
**Origin**: Visual verification of deployed F1/F2 fix — two remaining issues identified from user screenshot

## Summary

Two CSS class value adjustments in `src/hud/HUD.tsx` line 100 (the bottom telemetry row):

1. **Chat toggle overlap**: `sm:pr-16` (64px) leaves only ~8px gap to the chat toggle icon (`fixed bottom-6 right-6 w-12` = 72px from right). Increase to `sm:pr-24` (96px) for comfortable clearance.
2. **Height mismatch**: `sm:items-end` bottom-aligns cards but the ProgressBar (3 content rows) is much taller than TelemetryCards (2 rows), creating a jarring height difference. Change to `sm:items-stretch` so all cards stretch to uniform height with matching glass-morphism backgrounds.

## Changes

### Change 1: HUD.tsx line 100 — increase right padding + stretch alignment

```tsx
// Before:
<div className="grid grid-cols-2 sm:flex sm:items-end gap-2 sm:gap-3 sm:pr-16 pointer-events-auto">

// After:
<div className="grid grid-cols-2 sm:flex sm:items-stretch gap-2 sm:gap-3 sm:pr-24 pointer-events-auto">
```

Two class changes in one line:
- `sm:items-end` -> `sm:items-stretch`
- `sm:pr-16` -> `sm:pr-24`

## Files Affected

- `src/hud/HUD.tsx` — line 100 only

## Acceptance Criteria

- [ ] ProgressBar does not overlap or crowd the chat toggle icon (>=24px visual gap)
- [ ] All bottom row cards (Speed, Earth Dist, Moon Dist, ProgressBar) have uniform height
- [ ] Mobile layout (<640px) unchanged (all changes use `sm:` prefix)
- [ ] Build passes

## Rollback

Revert to `sm:items-end sm:pr-16` if stretch causes visual issues with TelemetryCard content centering.

# Implementation Prompt: Moon Position Drift — Clamp simTimeRef in LIVE Mode (F5)

**RCA Reference**: docs/RCAs/2026-04-10_2051_moon_position_drift.md

## Context

DataDriver's `simTimeRef.current` is unclamped in LIVE mode (`Date.now()`), causing the Moon to render at its real-time orbital position instead of a mission-window-clamped position. After MISSION_END_EPOCH, the Moon drifts to the last ephemeris point. Even within the mission window, the Moon position is physically correct but ~32 su from the trajectory turnaround at T+214h. The fix clamps `simTimeRef` in LIVE mode to match REPLAY/SIM behavior.

## Goal

Clamp `simTimeRef.current` in LIVE mode to `[LAUNCH_EPOCH, MISSION_END_EPOCH]` so the Moon position stays within the mission window.

## Requirements

### R1: Clamp simTimeRef in LIVE mode — `src/components/DataDriver.tsx`

Replace line 31:
```typescript
simTimeRef.current = Date.now();
```
With:
```typescript
simTimeRef.current = Math.max(
  LAUNCH_EPOCH.getTime(),
  Math.min(Date.now(), MISSION_END_EPOCH.getTime())
);
```

This matches the clamping already applied in REPLAY mode (lines 34-36).

## Files Likely Affected

- `src/components/DataDriver.tsx` — line 31 only

## Constraints

- Do NOT change REPLAY or SIM mode clock tick logic
- Do NOT change the Moon rendering, store shape, or any other file
- The clamping uses the same `LAUNCH_EPOCH` and `MISSION_END_EPOCH` already imported

## Acceptance Criteria

- [ ] `simTimeRef.current` is clamped in LIVE mode
- [ ] REPLAY and SIM modes unchanged
- [ ] `npm run build` passes

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Write the plan to `docs/plans/2026-04-10_2051_moon_position_drift.md`
3. Call `ExitPlanMode` to present for user approval
4. After plan approval, invoke `/wrought-rca-fix` to start the autonomous bugfix loop.

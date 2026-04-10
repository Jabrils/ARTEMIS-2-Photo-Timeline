# Root Cause Analysis: Moon Position Drift — Unclamped simTimeRef in LIVE Mode

**Date**: 2026-04-10
**Severity**: High
**Status**: Identified
**Finding**: F5 in Replayable Mission Visualization Tracker

## Problem Statement

The Moon renders at a position ~32 scene units from the trajectory turnaround, making it appear invisible in the default camera view. The Moon IS rendering (moonDist telemetry confirms 345,458 km) but at its real-time orbital position, not at a position aligned with the current sim time or the trajectory.

## Symptoms

- Moon sphere not visible at trajectory turnaround in default camera view
- Moon distance telemetry shows valid value (345,458 km) — Moon IS rendering somewhere
- Trajectory correctly curves around the flyby position

## Root Cause

**Two issues compounding:**

### RC1: `simTimeRef.current` is unclamped in LIVE mode

```typescript
// DataDriver.tsx:30-31
if (mode === 'live') {
  simTimeRef.current = Date.now();  // NOT clamped to [LAUNCH_EPOCH, MISSION_END_EPOCH]
}
```

The store's `simEpochMs` IS clamped (in the batched setState). But `simTimeRef.current` is used for BOTH the interpolator AND `getMoonPosition()` BEFORE the 4Hz store write. After `MISSION_END_EPOCH` (April 11 00:07 UTC), `Date.now()` advances past the ephemeris range, and `getMoonPosition` clamps to its last data point — which is the Moon's position for April 11, not aligned with any trajectory point.

In REPLAY/SIM modes, `simTimeRef.current` IS clamped (lines 34-36). Only LIVE mode is affected.

### RC2: The Moon naturally moves during the mission (correct physics, confusing UX)

Even within the mission window, the Moon orbits Earth. At T+214h (current), the Moon has moved ~52 degrees from its flyby position (T+120h). This means the Moon renders at a correct but unexpected position — far from the trajectory turnaround. This is physically correct but the user expects the Moon at the turnaround.

## Evidence

```typescript
// DataDriver.tsx:30-31 — LIVE mode: unclamped
if (mode === 'live') {
  simTimeRef.current = Date.now();  // can exceed MISSION_END_EPOCH
}

// DataDriver.tsx:33-37 — REPLAY mode: clamped (correct)
} else if (rate > 0) {
  simTimeRef.current = Math.max(
    LAUNCH_EPOCH.getTime(),
    Math.min(simEpochMs + wallDelta * rate, MISSION_END_EPOCH.getTime())
  );
}
```

Ephemeris position divergence:
- Flyby (T+120h, April 6): (-12.9, -33.6, -18.5) su — aligns with trajectory turnaround
- Current (T+214h, April 10): (18.7, -31.2, -16.0) su — 32 su from flyby position
- Delta: 32 su along X axis (Moon on opposite side of Y axis)

## Impact

Moon invisible in default camera view. Primary visual landmark for lunar flyby missing. Affects LIVE mode only — SIM/REPLAY modes use clamped sim time and show correct Moon position for the sim time.

## Resolution

### Fix: Clamp `simTimeRef.current` in LIVE mode

Apply the same clamping to LIVE mode that REPLAY mode already has:

```typescript
if (mode === 'live') {
  simTimeRef.current = Math.max(
    LAUNCH_EPOCH.getTime(),
    Math.min(Date.now(), MISSION_END_EPOCH.getTime())
  );
}
```

This ensures:
- During the active mission: no effect (Date.now() is within range)
- After splashdown: simTimeRef clamps to MISSION_END_EPOCH, keeping the Moon at its mission-end position
- All consumers of simTimeRef (interpolator, getMoonPosition, store write) use the same clamped time

**Note**: The Moon will still not align with the trajectory turnaround at T+214h. This is correct physics — the Moon has moved since the flyby. But clamping prevents it from drifting even further after MISSION_END_EPOCH.

## Prevention

When introducing frame-rate time refs (`simTimeRef`) that shadow a clamped store value (`simEpochMs`), apply the same bounds to both. The ref should never exceed the store's valid range.

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 2
- **Completion criteria**: Build passes, simTimeRef clamped in LIVE mode
- **Invoke with**: `/wrought-rca-fix`

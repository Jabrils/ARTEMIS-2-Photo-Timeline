# Finding: Moon Renders at Wrong Position — Real-Time Ephemeris vs Trajectory-Aligned

**Date**: 2026-04-10
**Discovered by**: User screenshot — Moon missing from visualization at trajectory turnaround
**Type**: Defect
**Severity**: High
**Status**: Open

---

## What Was Found

After the F1 virtual clock migration, the Moon renders at its **real-time ephemeris position** instead of a position aligned with the current **simulated time**. In LIVE mode, `DataDriver.tsx:31` sets `simTimeRef.current = Date.now()` (unclamped wall-clock time), which is then passed to `getMoonPosition(simTimeRef.current)` at line 70. The Moon has orbited ~48 degrees since the flyby epoch (April 6), placing it ~32 scene units from the trajectory turnaround point where the user expects it.

Before the F1 migration, `Moon.tsx` called `getMoonFlybyPosition()` directly — a static position that always aligned with the trajectory. The F1 migration moved Moon position computation to DataDriver for dynamic animation during replay, but introduced two defects:

1. **In LIVE mode**: `simTimeRef.current = Date.now()` is NOT clamped to `MISSION_END_EPOCH` like the store's `simEpochMs` is. `getMoonPosition()` receives wall-clock time, producing a position that drifts from the trajectory as the real Moon orbits.

2. **Position divergence**: The trajectory (OEM data) is static — it was computed for the mission path around the Moon at the flyby epoch. The Moon position from `getMoonPosition(Date.now())` is the Moon's CURRENT orbital position, not where it was when the trajectory was computed. The two diverge by ~32 su.

---

## Affected Components

- `src/components/DataDriver.tsx:31` — `simTimeRef.current = Date.now()` (unclamped in LIVE mode)
- `src/components/DataDriver.tsx:70` — `getMoonPosition(simTimeRef.current)` (uses unclamped time)
- `src/components/DataDriver.tsx:91-95` — Store write of moonPosition
- `src/components/Moon.tsx:11-14` — Reads moonPosition from store, renders at that position

---

## Evidence

User screenshot (Image #3) shows:
- Full trajectory visible with turnaround at upper-right
- Earth visible as sphere at lower-left
- Moon distance telemetry: 345,458 km (value IS computed — DataDriver IS writing)
- No Moon sphere visible at trajectory turnaround point
- The Moon IS rendering — but ~32 su away from the expected position, likely off-screen or behind the camera

Ephemeris data confirms position divergence:
- Flyby epoch (April 6 23:06 UTC): Moon at approximately (-12.9, -33.6, -18.5) scene units
- Current time (April 10 21:00 UTC): Moon at approximately (18.7, -31.2, -16.0) scene units
- Delta: ~32 scene units — the Moon is on the OPPOSITE side of the Y axis from the flyby point

---

## Preliminary Assessment

**Likely cause**: The F1 migration moved Moon position from a static `getMoonFlybyPosition()` call in Moon.tsx to a dynamic `getMoonPosition(simTimeRef.current)` call in DataDriver. In LIVE mode, `simTimeRef.current` is unclamped wall-clock time. The Moon's real-time orbital position diverges from the trajectory turnaround because the trajectory data is fixed.

**Likely scope**: Isolated to DataDriver.tsx (Moon position computation) and the LIVE mode clock tick. In SIM/REPLAY modes, `simTimeRef.current` tracks the simulated time, so the Moon position would correctly correspond to the trajectory at that sim time. The defect is LIVE-mode-specific.

**Likely impact**: Moon is invisible to the user in the default (LIVE) camera view. The primary visual landmark for the lunar flyby is missing.

---

## Classification Rationale

**Type: Defect** — The Moon renders at a wrong position, making it invisible to the user in the expected view.

**Severity: High** — The Moon is a primary visual element. Its absence from the trajectory turnaround degrades the core visualization experience.

---

**Finding Logged**: 2026-04-10 20:51 UTC

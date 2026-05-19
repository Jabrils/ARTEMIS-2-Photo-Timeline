**2026-05-18 13:00 UTC**

# Finding: No Wall-Clock Time Display or Timezone Selector on HUD

**Type**: Gap
**Severity**: Low
**Files**: `src/hud/MissionClock.tsx`, `src/store/mission-store.ts`

---

## What Was Found

`MissionClock.tsx` displays only mission elapsed time (M+ DD:HH:MM:SS). No component in the HUD displays the actual calendar date/time corresponding to the current sim time. There is no mechanism for the user to select a UTC offset to view times in their local timezone.

## Scope

- `src/hud/MissionClock.tsx` — add wall-clock date/time row below existing elapsed display
- `src/store/mission-store.ts` — add `utcOffset: number` (default 0) to store state + setter
- Wall-clock display: derives `simEpochMs + utcOffset * 3_600_000`, formats as `MMM DD HH:MM:SS UTC±N`
- Timezone selector: `+` / `−` buttons to increment/decrement UTC offset (range −12 to +14), displayed as `UTC−5`, `UTC+0`, `UTC+9` etc.

## Preliminary Assessment

UTC offset belongs in the Zustand store so other components (MissionEventsPanel, PhotoPanel captions) can consume it in future. Wall-clock display and offset controls fit naturally in MissionClock alongside elapsed time. No new dependencies needed.

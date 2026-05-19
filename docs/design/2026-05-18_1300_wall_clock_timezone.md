**2026-05-18 13:00 UTC**

# Design: Wall-Clock Time Display + UTC Offset Selector

**Mode**: from-scratch
**Finding**: F1
**Tracker**: docs/findings/2026-05-18_1300_wall_clock_timezone_FINDINGS_TRACKER.md

---

## Objective

Display the actual calendar date/time (derived from `simEpochMs`) in the HUD, formatted in a user-selected UTC offset. Add `+` / `−` buttons to adjust the offset from UTC−12 to UTC+14.

---

## Design

### State: `utcOffset` in Zustand store

Add `utcOffset: number` (integer, default `0`) and `setUtcOffset: (n: number) => void` to the mission store. Storing in Zustand makes it available to future consumers (e.g., photo captions, event panel timestamps).

### UI: extend `MissionClock.tsx`

Below the existing elapsed time row, add a second row with:
- Formatted wall-clock: `Apr 07 21:36 UTC+0` — derived from `simEpochMs + utcOffset * 3_600_000`
- `−` button | offset label (`UTC−5`, `UTC+0`, `UTC+9`) | `+` button

### Format

```
MMM DD HH:MM UTC±N
```
- Month: 3-letter abbreviation (Apr, May…)
- Day: zero-padded
- Time: HH:MM (no seconds — keeps it compact)
- Offset: `UTC+0`, `UTC−4`, `UTC+5:30` — integers only (no half-hour offsets needed)

### Placement

Second line inside the existing `MissionClock` div, below the elapsed time. Same font size as current phase label (`text-[9px] sm:text-xs`), cyan-tinted to distinguish from the phase text.

---

## Files Affected

| File | Change |
|------|--------|
| `src/store/mission-store.ts` | Add `utcOffset`, `setUtcOffset` |
| `src/hud/MissionClock.tsx` | Add wall-clock row + ±buttons, subscribe to store |

---

## Acceptance Criteria

- [ ] Wall-clock time updates every second as sim runs
- [ ] `+` / `−` buttons adjust UTC offset, clamped to −12…+14
- [ ] Offset label displays correctly for positive, negative, and zero
- [ ] `npm run build` passes

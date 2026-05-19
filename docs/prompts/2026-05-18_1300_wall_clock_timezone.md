# Implementation Prompt: Wall-Clock Time Display + UTC Offset Selector

**Design Reference**: docs/design/2026-05-18_1300_wall_clock_timezone.md
**Finding**: F1 (docs/findings/2026-05-18_1300_wall_clock_timezone_FINDINGS_TRACKER.md)

## Goal

1. Add `utcOffset: number` (default 0) + `setUtcOffset` to the Zustand mission store
2. Extend `MissionClock.tsx` to show a wall-clock row with UTC offset selector

---

## 1. `src/store/mission-store.ts` changes

Add to the store interface and implementation:
```ts
utcOffset: number;           // integer, UTC offset in whole hours, default 0
setUtcOffset: (n: number) => void;  // clamp to -12..14
```

In initial state: `utcOffset: 0`

Implementation:
```ts
setUtcOffset: (n) => set({ utcOffset: Math.max(-12, Math.min(14, n)) }),
```

---

## 2. `src/hud/MissionClock.tsx` changes

```tsx
import { useMissionStore } from '../store/mission-store';
import { useMission } from '../hooks/useMission';

export default function MissionClock() {
  const { formatted, currentPhase } = useMission();
  const simEpochMs = useMissionStore((s) => s.timeControl.simEpochMs);
  const utcOffset = useMissionStore((s) => s.utcOffset);
  const setUtcOffset = useMissionStore((s) => s.setUtcOffset);

  // Format wall-clock in selected UTC offset
  const wallClock = (() => {
    const offsetMs = utcOffset * 3_600_000;
    const d = new Date(simEpochMs + offsetMs);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mon = months[d.getUTCMonth()];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const sign = utcOffset >= 0 ? '+' : '−';
    const label = `UTC${sign}${Math.abs(utcOffset)}`;
    return `${mon} ${day} ${hh}:${mm} ${label}`;
  })();

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-hud-blue font-mono text-xs sm:text-lg font-bold tracking-wider">
          {formatted}
        </span>
        <span className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
          {currentPhase}
        </span>
      </div>
      <div className="flex items-center gap-1 pointer-events-auto">
        <button
          onClick={() => setUtcOffset(utcOffset - 1)}
          disabled={utcOffset <= -12}
          className="text-gray-500 hover:text-[#00d4ff] disabled:opacity-30 font-mono text-[10px] px-0.5 transition-colors"
        >
          −
        </button>
        <span className="text-[9px] sm:text-[10px] font-mono text-[#00d4ff]/80 tracking-wide tabular-nums">
          {wallClock}
        </span>
        <button
          onClick={() => setUtcOffset(utcOffset + 1)}
          disabled={utcOffset >= 14}
          className="text-gray-500 hover:text-[#00d4ff] disabled:opacity-30 font-mono text-[10px] px-0.5 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] Wall-clock updates as sim time advances
- [ ] `+` / `−` buttons shift the displayed time and offset label
- [ ] Clamped at UTC−12 and UTC+14
- [ ] `npm run build` passes

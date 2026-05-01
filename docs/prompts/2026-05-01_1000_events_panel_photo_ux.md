# Implementation Prompt: MissionEventsPanel Always-Visible Photos + Click-to-Jump

**Blueprint Reference**: docs/blueprints/2026-05-01_1000_events_panel_photo_ux.md
**Design Reference**: docs/design/2026-05-01_1000_events_panel_photo_ux.md
**Finding**: F3

## Context

`MissionEventsPanel.tsx` currently hides photos behind a click-to-expand toggle (`expandedPhoto` state). The user wants photos always visible inline below each milestone row, and clicking a photo should jump Orion to that timestamp.

## Goal

Refactor `src/hud/MissionEventsPanel.tsx` to show all mission photos unconditionally, with click-to-jump navigation via `setTimeMode('sim')` + `setSimTime`.

## Requirements

1. Remove `expandedPhoto` useState (line 18) and all related references
2. Remove camera emoji toggle button (lines 189–193)
3. Remove `isPhotoExpanded` local variable (line 159) and row `onClick` toggle logic (line 172)
4. Always render a photo block for milestones where `m.photo` is set
5. `<img onClick>` calls `setTimeMode('sim')` + `setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000)`
6. Add `LAUNCH_EPOCH` to import from `../data/mission-config`
7. Add `setSimTime` and `setTimeMode` from `useMissionStore` inside the component

## Files Likely Affected

- `src/hud/MissionEventsPanel.tsx` — only file

## Implementation Sequence

1. Update `mission-config` import: add `LAUNCH_EPOCH`
2. Add store selectors: `const setSimTime = useMissionStore((s) => s.setSimTime);` and `const setTimeMode = useMissionStore((s) => s.setTimeMode);`
3. Delete line 18: `const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);`
4. Delete line 159: `const isPhotoExpanded = expandedPhoto === m.name;`
5. On the row div: remove `onClick`, change `cursor-pointer`/`cursor-default` conditional to just `cursor-default`
6. Delete camera emoji span block (lines 189–193)
7. Replace `<AnimatePresence>` photo block (lines 202–219) with an unconditional `{m.photo && (<div>...<img onClick={...} />...</div>)}` block
8. Remove `AnimatePresence` from the import if it is no longer used elsewhere in the file

## Photo Block (replace lines 202–219)

```tsx
{m.photo && (
  <div className="px-2 pb-2">
    <img
      src={m.photo}
      alt={m.name}
      title="Jump to this moment"
      className="w-full rounded border border-[rgba(0,212,255,0.2)] object-cover max-h-48 cursor-pointer hover:border-[rgba(0,212,255,0.5)] transition-colors"
      onClick={() => {
        setTimeMode('sim');
        setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000);
      }}
    />
    <p className="text-[9px] text-gray-500 mt-1">{m.description}</p>
  </div>
)}
```

## Constraints

- Only `src/hud/MissionEventsPanel.tsx` should be modified
- Do not change any store, config, or other component files

## Acceptance Criteria

- [ ] All milestones with `m.photo` show their photo inline without any interaction
- [ ] Clicking a photo sets simTime to that milestone's timestamp and mode to 'sim'
- [ ] `expandedPhoto` state and camera emoji toggle are gone
- [ ] `npm run build` passes with no errors

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Explore the file using read-only tools
3. Write the plan to `docs/plans/2026-05-01_1000_events_panel_photo_ux.md`
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding
6. After approval, invoke `/wrought-implement` to start the loop

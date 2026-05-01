# Blueprint: MissionEventsPanel Always-Visible Photos + Click-to-Jump

**Date**: 2026-05-01
**Design Reference**: docs/design/2026-05-01_1000_events_panel_photo_ux.md
**Finding**: F3

## Objective

Refactor `MissionEventsPanel.tsx` so photos render unconditionally below their milestone row (no expand/collapse), and clicking a photo calls `setTimeMode('sim')` + `setSimTime` to jump Orion's position.

## Requirements

1. Remove `expandedPhoto` useState and all related toggle logic
2. Remove camera emoji button (lines 189–193 in current source)
3. Render `<img>` unconditionally for any milestone where `m.photo` is set
4. `onClick` on the `<img>` calls `setTimeMode('sim')` and `setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000)`
5. Add `LAUNCH_EPOCH` import from `../data/mission-config`
6. Add `setSimTime` and `setTimeMode` selectors from `useMissionStore`

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Photo render trigger | Unconditional (no state) | User wants always-visible; simpler code |
| Animation | None (remove AnimatePresence wrapper) | Nothing to animate when always visible |
| Click target | `<img>` element only | Row div click becomes a no-op (remove onClick) |
| Imports | Add LAUNCH_EPOCH, setSimTime, setTimeMode | Already used in ProgressBar.tsx — same pattern |

## Scope

### In Scope
- `src/hud/MissionEventsPanel.tsx` — all changes

### Out of Scope
- All other files — no changes

## Files Likely Affected

- `src/hud/MissionEventsPanel.tsx` — remove state/toggle, add always-visible photos with click handler

## Implementation Sequence

1. Add `LAUNCH_EPOCH` to the import from `../data/mission-config`
2. Add `setSimTime` and `setTimeMode` selectors inside the component via `useMissionStore`
3. Remove `const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);` (line 18)
4. Remove `const isPhotoExpanded = expandedPhoto === m.name;` (line 159)
5. Remove `onClick={() => m.photo && setExpandedPhoto(isPhotoExpanded ? null : m.name)}` from the row div (line 172), remove `cursor-pointer`/`cursor-default` conditional from the row classname
6. Remove camera emoji span (lines 189–193)
7. Replace the `<AnimatePresence>` block (lines 202–219) with:
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

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `Fragment` import no longer needed | Low | Low | Keep it — Fragment is still used for the map key wrapper |
| `AnimatePresence` import unused | Low | Low | Remove it if only used for the photo block; verify no other use |
| Panel height increase on scroll | None | None | Panel already scrolls (max-h overflow-y-auto) |

## Acceptance Criteria

- [ ] All milestones with `m.photo` show their photo inline without any interaction
- [ ] Clicking a photo sets simTime to that milestone's timestamp and mode to 'sim'
- [ ] `expandedPhoto` state and camera emoji toggle are gone
- [ ] `npm run build` passes with no errors

## Debug Strategy

- **Verifier**: `npm run build`
- **Max iterations**: 5
- **Invoke with**: `/wrought-implement`

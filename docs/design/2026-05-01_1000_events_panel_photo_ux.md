**2026-05-01 10:00 UTC**

# Design: MissionEventsPanel Always-Visible Photos + Click-to-Jump

**Mode**: from-scratch
**Finding**: F3 — MissionEventsPanel Photos Hidden Behind Expand Toggle
**Tracker**: docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md

---

## Objective

Replace the click-to-expand photo accordion in `MissionEventsPanel.tsx` with always-visible inline photos. Clicking a photo jumps Orion to that milestone's timestamp by calling `setTimeMode('sim')` + `setSimTime`.

---

## Current State

`MissionEventsPanel.tsx` renders a collapsible panel with mission milestones. For photo milestones:
- A camera emoji toggle (line 189–193) shows when `m.photo` is set
- `expandedPhoto: string | null` state (line 18) tracks which milestone row is expanded
- `isPhotoExpanded` local variable (line 159) gates whether the photo block renders
- `AnimatePresence` expand/collapse block (lines 202–219) renders the `<img>` only when expanded
- The row's `onClick` (line 172) toggles `expandedPhoto` — not a navigation action

There is no way to jump Orion's position by clicking a photo.

---

## Design Decision

**Remove the expand/collapse mechanism entirely.** Render photos unconditionally below each milestone row where `m.photo` is set. Make the `<img>` element the click target for timeline navigation.

### Rationale

- The panel already scrolls vertically — always-visible photos add height but no interaction complexity
- The user's explicit request: "show all images instead of click dropdown to see the images, when clicked will move orion to their timestamp"
- Simpler code: removes a stateful interaction pattern in favour of a direct action
- Consistent with the existing `setTimeMode('sim')` + `setSimTime` pattern used in ProgressBar (F1)

### Photo Render Style

Render each photo in a `<div className="px-2 pb-2">` block directly after its milestone row, no animation wrapper needed (removing AnimatePresence simplifies the code). Image: `w-full rounded border border-[rgba(0,212,255,0.2)] object-cover max-h-48 cursor-pointer`. Include the `m.description` caption below.

### Click Behaviour

```ts
onClick={() => {
  setTimeMode('sim');
  setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000);
}}
```

Add `title="Jump to this moment"` on the `<img>` for discoverability.

---

## Scope

### In Scope
- `src/hud/MissionEventsPanel.tsx` — only file affected

### Out of Scope
- PhotoPanel.tsx, ProgressBar.tsx, HUD.tsx — no changes required
- No store changes — `setSimTime` and `setTimeMode` already exist

---

## Files Affected

| File | Change |
|------|--------|
| `src/hud/MissionEventsPanel.tsx` | Remove `expandedPhoto` state + toggle; always render photos; add click-to-jump |

---

## Implementation Sequence

1. Add imports: `setSimTime`, `setTimeMode` from `useMissionStore`; `LAUNCH_EPOCH` from `mission-config`
2. Remove `expandedPhoto` useState declaration (line 18)
3. Remove `isPhotoExpanded` variable (line 159)
4. Remove the camera emoji toggle button (lines 189–193)
5. Change row `onClick` from toggle logic to no-op (remove `m.photo &&` guard entirely, or remove onClick from the row div)
6. Replace `AnimatePresence` expand block (lines 202–219) with unconditional `{m.photo && (<div>...<img onClick=... /></div>)}`

---

## Acceptance Criteria

- [ ] All milestones with `m.photo` show their photo inline without any user interaction
- [ ] Clicking a photo sets simTime to that milestone's epoch and mode to 'sim'
- [ ] No `expandedPhoto` state remains in the component
- [ ] Camera emoji toggle button removed
- [ ] `npm run build` passes with no errors

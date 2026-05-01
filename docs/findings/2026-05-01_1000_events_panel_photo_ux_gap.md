**2026-05-01 10:00 UTC**

# Finding: MissionEventsPanel Photos Hidden Behind Expand Toggle

**Type**: Gap
**Severity**: Low
**File**: `src/hud/MissionEventsPanel.tsx`

---

## What Was Found

In `MissionEventsPanel.tsx`, photo milestones render an expand/collapse toggle (camera emoji, line 190–193). Photos are hidden by default and only shown when the user clicks to expand each row individually (`expandedPhoto` state, line 18). Clicking the row toggles photo visibility; clicking a photo does not jump Orion to that timestamp.

## Scope

- `src/hud/MissionEventsPanel.tsx` — only file affected
  - `expandedPhoto` state (line 18) — drives show/hide toggle, to be removed
  - `isPhotoExpanded` / `setExpandedPhoto` logic (lines 159, 172) — to be removed
  - Camera emoji toggle button (lines 189–193) — to be removed
  - `AnimatePresence` inline photo block (lines 202–219) — to become always-visible
  - Missing: click handler on photo to call `setTimeMode('sim')` + `setSimTime`
  - Missing imports: `setSimTime`, `setTimeMode`, `LAUNCH_EPOCH`

## Preliminary Assessment

Straightforward refactor. Remove `expandedPhoto` state, render photos unconditionally for milestones where `m.photo` is set, add `onClick` on the `<img>` that calls `setTimeMode('sim')` + `setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000)`.

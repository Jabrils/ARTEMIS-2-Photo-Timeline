**2026-04-30 12:20 UTC**

# Finding: No Photo Display Panel in 3D Scene

**Type**: Gap
**Severity**: Low
**File**: `src/App.tsx` (scene composition), `src/data/mission-config.ts` (MILESTONES with photo paths)

---

## What Was Found

No component exists to display mission photos in the 3D scene UI. Photos are referenced in `MILESTONES[].photo` and rendered only as small thumbnails in progress bar tooltips on hover. There is no full-size photo panel visible in the main viewport at any time.

## Scope

- `src/App.tsx` — scene root where new overlay component would be mounted
- `src/data/mission-config.ts` — `MILESTONES` array with `photo` paths and `missionElapsedHours`
- `src/store/mission-store.ts` — `timeControl.simEpochMs` available for elapsed time calculation
- `src/hooks/useMission.ts` — `elapsedHours` derived value already computed
- New component required: `src/hud/PhotoPanel.tsx`

## Preliminary Assessment

No architectural blocker. `elapsedHours` is already derived in `useMission`. A new overlay component can subscribe to `simEpochMs`, compute elapsed hours, find the nearest photo milestone within ±0.5h (30 min), and render the photo with a fade transition. Top-left placement avoids trajectory lines and celestial body positions in the default camera view.

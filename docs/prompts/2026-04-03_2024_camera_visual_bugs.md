# Implementation Prompt: Fix Three Camera Visual Bugs

**RCA Reference**: docs/RCAs/2026-04-03_2024_camera_visual_bugs.md

## Context

Visual verification found 3 camera bugs: debug overlay shows wrong values, trajectory too vertical, preset buttons blocked by debug overlay. Root causes are identified.

## Goal

Fix all three bugs in `CameraDebug.tsx` and `CameraController.tsx`.

## Requirements

1. Fix `getWorldDirection` call to use `new THREE.Vector3()` instead of plain object
2. Align camera `up` vector in `computePlanView` so trajectory's widest extent is horizontal on landscape screens
3. Add `pointerEvents: 'none'` to the `<Html>` wrapper in CameraDebug so clicks pass through to HUD buttons

## Files Likely Affected

- `src/components/CameraDebug.tsx` — fixes 1 and 3
- `src/components/CameraController.tsx` — fix 2 (computePlanView return value + camera up vector)

## Acceptance Criteria

- [ ] Debug overlay shows actual camera position and lookAt coordinates (not zeros)
- [ ] Trajectory appears horizontal on landscape screens in plan view
- [ ] Preset buttons work while debug overlay is visible
- [ ] All existing tests pass
- [ ] Build succeeds

---

## Plan Output Instructions

1. Call `EnterPlanMode`
2. Write plan to `docs/plans/2026-04-03_2024_camera_visual_bugs.md`
3. Call `ExitPlanMode` for approval
4. After approval, invoke `/wrought-rca-fix`

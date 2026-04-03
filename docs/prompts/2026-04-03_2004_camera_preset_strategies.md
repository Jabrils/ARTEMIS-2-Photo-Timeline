# Implementation Prompt: Scene-Aware Smart Camera Presets

**Blueprint Reference**: docs/blueprints/2026-04-03_2004_camera_preset_strategies.md
**Design Reference**: docs/design/2026-04-03_2002_camera_preset_strategies.md

## Context

The camera presets in `CameraController.tsx` use fixed offsets that don't adapt to trajectory geometry. Each preset should provide a visually distinct, compelling view using purpose-built camera strategies.

## Goal

Rewrite the 4 camera preset behaviors so each provides a unique, informative perspective of the Artemis II mission.

## Requirements

1. **Follow Orion**: Velocity-aligned chase cam — camera trails behind spacecraft along negative velocity vector, elevated above the orbital plane, looking slightly ahead
2. **Earth View**: Camera near Earth origin `(0, 3, 5)`, tracking the spacecraft as it moves away — Earth in foreground
3. **Moon View**: Camera at Moon position, offset along orbital plane normal — shows the flyby loop from above
4. **Plan View**: Unchanged (orbital plane normal top-down)
5. Mobile: all distances multiplied by ~1.2x

## Files Likely Affected

- `src/components/CameraController.tsx` — rewrite preset logic

## Implementation Sequence

1. Extract `getOrbitalPlaneNormal(oemData)` from `computePlanView` as a module-level cached helper
2. Rewrite Follow Orion: use `spacecraft.vx/vy/vz` from store to compute velocity direction, position camera behind + above orbital plane. Update in both `useEffect` (initial) and `useFrame` (continuous)
3. Rewrite Earth View: static camera near origin `(0, 3, 5)`, target = spacecraft position (updated per frame)
4. Rewrite Moon View: camera at `moonPos + planeNormal * 15`, target = moonPos (static after setup)
5. Handle edge case: clamp velocity direction when speed is near zero (avoid NaN)

## Constraints

- `useFrame` must stay allocation-free on the hot path (reuse THREE.Vector3 refs)
- Velocity is in km/s from the store; normalize for direction only
- Apply SCALE_FACTOR (10,000) to all coordinates
- Lerp factor stays at 0.03 for smooth transitions
- Free mode on user drag must still work (existing `onControlStart` callback)

## Acceptance Criteria

- [ ] Follow Orion: chase cam behind spacecraft, trajectory visible ahead
- [ ] Earth View: Earth foreground, spacecraft tracked as it departs
- [ ] Moon View: flyby loop visible from orbital plane normal
- [ ] Plan View: unchanged
- [ ] Smooth transitions between all presets
- [ ] Mobile-friendly distances
- [ ] All tests pass, build succeeds

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode
2. Explore the codebase using read-only tools
3. Write the plan to `docs/plans/2026-04-03_2004_camera_preset_strategies.md`
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop.

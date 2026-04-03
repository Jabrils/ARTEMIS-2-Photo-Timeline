# Blueprint: Scene-Aware Smart Camera Presets

**Date**: 2026-04-03
**Design Reference**: docs/design/2026-04-03_2002_camera_preset_strategies.md
**Finding**: F1 in `docs/findings/2026-04-03_1958_camera_ux_refinement_FINDINGS_TRACKER.md`

## Objective

Rewrite camera preset logic so each of the four presets provides a visually distinct, compelling view. Replace fixed offsets with purpose-built strategies: velocity-aligned chase cam (Follow Orion), Earth-centric tracking (Earth View), and flyby-optimized orbital view (Moon View). Plan View stays unchanged.

## Requirements

1. **Follow Orion**: Camera trails behind the spacecraft along the negative velocity vector, looking slightly ahead. Updates every frame.
2. **Earth View**: Camera positioned near Earth origin, elevated, tracking the spacecraft as it moves. Earth stays in foreground.
3. **Moon View**: Camera at Moon flyby point, offset along the orbital plane normal, showing the trajectory loop around the Moon.
4. **Plan View**: Unchanged — orbital plane normal top-down view.
5. All presets must look good on both desktop and mobile viewports.
6. Lerp-based smooth transitions (existing 0.03 factor) preserved.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Follow Orion strategy | Velocity-aligned chase cam | Natural "behind the spacecraft" view; trajectory always visible ahead |
| Earth View strategy | Near-origin camera tracking spacecraft | Shows scale of departure; Earth as foreground context |
| Moon View strategy | Orbital plane normal at flyby point | Shows the trajectory bending around the Moon from above |
| Orbital normal caching | Extract to shared helper, cache at module level | Avoids recomputing cross product every frame; already computed for Plan View |
| Mobile adaptation | Larger offsets on mobile (1.2x desktop values) | Wider field of view needed on smaller screens |

## Scope

### In Scope
- Rewrite preset cases in `CameraController.tsx` (lines 116-167)
- Update Follow Orion `useFrame` logic (lines 169-183) for velocity-aligned tracking
- Extract `getOrbitalPlaneNormal()` as a shared cached helper
- Mobile-specific distance multipliers

### Out of Scope
- Adding new preset buttons (keep existing 4)
- Changing OrbitControls configuration
- Modifying the debug overlay (CameraDebug.tsx)
- Changing the Zustand store types

## Files Likely Affected

- `src/components/CameraController.tsx` — rewrite preset logic, add velocity-aligned follow, extract orbital normal helper (~50 lines changed)

## Implementation Sequence

1. **Extract `getOrbitalPlaneNormal()`** — move the cross-product computation from `computePlanView` into a standalone cached function. `computePlanView` calls it instead of computing inline.

2. **Rewrite Follow Orion preset** (lines 128-133 and 171-177):
   - In `useEffect` (initial setup): compute camera behind velocity, elevated above orbital plane
   - In `useFrame` (continuous): read `spacecraft.vx/vy/vz` from store, compute trail position each frame
   ```
   velocity = normalize(vx, vy, vz)
   planeNormal = getOrbitalPlaneNormal(oemData)
   camPos = orionPos - velocity * trailDist + planeNormal * elevate
   lookAt = orionPos + velocity * lookAhead
   ```
   - Desktop: `trailDist=25, elevate=8, lookAhead=5`
   - Mobile: `trailDist=30, elevate=10, lookAhead=5`

3. **Rewrite Earth View preset** (lines 135-141):
   - Camera at `(0, 3, 5)` desktop / `(0, 4, 6)` mobile (near Earth, slightly elevated)
   - Target: current spacecraft position (updated in `useFrame` like Follow Orion)
   - Add Earth View to the `useFrame` block so target tracks spacecraft movement

4. **Rewrite Moon View preset** (lines 144-164):
   - Keep existing Moon position computation (flyby apoapsis + 10637km offset)
   - Change camera offset: `moonPos + planeNormal * 15` (desktop) / `* 18` (mobile)
   - Target: Moon position (static, no per-frame update needed)

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Velocity near zero at apoapsis causes jitter | Medium | Low | Clamp velocity magnitude; fall back to position-delta if speed < threshold |
| Orbital normal flips during mission | Low | Medium | Cache normal once on data load; direction is stable for a single orbit |
| Chase cam feels disorienting on mobile | Low | Medium | Larger trail distance on mobile; lerp factor keeps transitions smooth |

## Acceptance Criteria

- [ ] Follow Orion shows spacecraft centered with trajectory stretching ahead
- [ ] Earth View shows Earth in foreground with spacecraft departing
- [ ] Moon View shows Moon with trajectory loop visible from above
- [ ] Plan View unchanged from current behavior
- [ ] All presets transition smoothly (no camera jumps)
- [ ] All presets look good on mobile (< 768px viewport)
- [ ] Free mode still activates on user drag
- [ ] All existing tests pass (`npx vitest run`)
- [ ] Build succeeds (`npm run build`)

## Constraints

- `useFrame` callback must remain lightweight — no allocations, no `.map()`
- Spacecraft velocity components (`vx, vy, vz`) are already in the Zustand store (km/s)
- SCALE_FACTOR (10,000) must be applied consistently to all coordinates
- Velocity is in km/s; must normalize direction only, don't use magnitude for positioning

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test -- --run`
- **Max iterations**: 3
- **Completion criteria**: Build passes, all tests pass, preset logic compiles without type errors
- **Visual verification**: requires manual check on live deployment (use D-key debug overlay)
- **Invoke with**: `/wrought-implement`

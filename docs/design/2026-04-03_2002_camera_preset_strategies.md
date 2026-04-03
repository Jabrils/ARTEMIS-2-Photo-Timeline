# Design Analysis: Camera Preset Strategies

**Date**: 2026-04-03
**Mode**: Tradeoff
**Finding**: F1 in `docs/findings/2026-04-03_1958_camera_ux_refinement_FINDINGS_TRACKER.md`
**Goal**: Make each preset immediately show a compelling, informative view with functional distinctiveness — no two presets should look the same

---

## Current State

`src/components/CameraController.tsx` has 4 modes:

| Preset | Current Behavior | Problem |
|--------|-----------------|---------|
| **Plan View** (default) | Top-down from orbital plane normal | Good overview but not immersive |
| **Follow Orion** | Fixed offset `(5, 8, 20)` from spacecraft | Doesn't rotate with velocity; trajectory may be behind camera |
| **Earth View** | Identical to Plan View (`computePlanView`) | Redundant — same as default |
| **Moon View** | Fixed offset `(0, 15, 10)` from Moon position | Doesn't adapt to flyby approach angle |

Key infrastructure (solid, no changes needed):
- `useFrame` lerp interpolation at 0.03 factor (smooth transitions)
- OrbitControls with auto-switch to free mode on user drag
- `computePlanView()` for orbital plane normal calculation
- Spacecraft position updated every frame from DataDriver

---

## Options Evaluated

### Option A: Tuned Fixed Offsets

Keep the current architecture but improve the hardcoded offset values through visual iteration.

- Follow Orion: larger offset `(0, 10, 30)` for more context
- Earth View: low angle from near Earth `(0, 2, 5)` looking at spacecraft
- Moon View: positioned along flyby approach vector

**Pros**: Minimal code changes (~10 lines), predictable, easy to tune
**Cons**: Still doesn't adapt to trajectory phase; offsets that look good on Day 3 may look wrong on Day 7

### Option B: Velocity-Aligned Chase Camera

For Follow Orion, compute camera position behind the spacecraft along the negative velocity vector. Other presets unchanged.

```
camDir = normalize(-velocity)
camPos = orionPos + camDir * 25 + up * 8
```

**Pros**: Natural "chase cam" feel, trajectory always visible ahead
**Cons**: Only helps Follow Orion; can jitter during low-velocity phases; velocity data needed in useFrame

### Option C: Scene-Aware Smart Presets (Recommended)

Each preset uses a purpose-built strategy optimized for what it should show:

| Preset | Strategy | What You See |
|--------|----------|--------------|
| **Plan View** | Orbital plane normal (current) | Full trajectory from above — mission overview |
| **Follow Orion** | Velocity-aligned chase cam | Spacecraft with trajectory stretching ahead — immersive |
| **Earth View** | Camera near origin, elevated, looking at spacecraft | Earth in foreground, spacecraft departing — scale perspective |
| **Moon View** | Camera at flyby point along orbital plane normal, zoomed | Moon with trajectory loop curving around it — flyby drama |

**Pros**: Each view is visually distinct and purposeful. Best user experience.
**Cons**: Most code (~50 new lines), each preset has different logic

### Option D: Current Approach (Baseline)

Keep as-is. Users can use free camera.

**Pros**: No effort
**Cons**: Presets remain redundant/suboptimal

---

## Scoring

| Criterion (weight) | A: Tuned Offsets | B: Velocity Chase | C: Smart Presets | D: Current |
|---------------------|------------------|-------------------|------------------|------------|
| Visual quality (3) | 6 | 7 | 9 | 4 |
| Distinctiveness (3) | 5 | 5 | 9 | 3 |
| Simplicity (1) | 9 | 7 | 5 | 10 |
| Mobile compat (2) | 8 | 7 | 8 | 8 |
| **Weighted Total** | **58** | **58** | **75** | **42** |

---

## Recommendation: Option C — Scene-Aware Smart Presets

### Detailed Preset Specifications

#### 1. Plan View (default — unchanged)
- **Camera**: Along orbital plane normal, 1.4x (desktop) / 1.8x (mobile) trajectory range
- **Target**: Trajectory center
- **Purpose**: Mission overview

#### 2. Follow Orion (velocity-aligned chase cam)
- **Camera**: `orionPos + normalize(-velocity) * trailDist + planeNormal * elevate`
  - `trailDist`: 25 units behind along velocity vector
  - `elevate`: 8 units above the orbital plane
- **Target**: `orionPos + normalize(velocity) * 5` (look slightly ahead)
- **Updates**: Every frame (already in `useFrame` for Follow Orion)
- **Purpose**: Immersive view with trajectory ahead, spacecraft in center

#### 3. Earth View (from Earth looking outward)
- **Camera**: Near Earth origin, slightly elevated: `(0, 3, 5)` in scene units
- **Target**: Current spacecraft position (updates each frame like Follow Orion)
- **Adaptation**: Camera tracks the spacecraft as it moves away — Earth stays in the foreground
- **Purpose**: Scale perspective — watch Orion recede from Earth

#### 4. Moon View (flyby-optimized)
- **Camera**: At the flyby point, offset along the orbital plane normal for top-down view of the loop
  - Compute flyby apoapsis from trajectory data (max Earth distance point)
  - Position camera at `moonPos + planeNormal * 15`
- **Target**: Moon position
- **Purpose**: Dramatic flyby visualization — see the trajectory bend around the Moon

### Key Implementation Detail

The orbital plane normal is already computed in `computePlanView()`. Extract it as a shared utility so Follow Orion and Moon View can reuse it without recomputing.

```typescript
// Extract from computePlanView, cache at module level
let cachedPlaneNormal: THREE.Vector3 | null = null;

function getOrbitalPlaneNormal(oemData: StateVector[]): THREE.Vector3 {
  if (cachedPlaneNormal) return cachedPlaneNormal;
  // ... cross product computation (existing code) ...
  cachedPlaneNormal = normal;
  return normal;
}
```

### Files Affected

- `src/components/CameraController.tsx` — rewrite preset logic (~50 lines changed)

No other files need changes. The HUD buttons, store types, and OrbitControls are all unchanged.

### Mobile Considerations

- Follow Orion trail distance: 30 on mobile (vs 25 desktop) for wider field of view
- Earth View elevation: 4 on mobile (vs 3 desktop) for better framing
- Moon View normal distance: 18 on mobile (vs 15 desktop)

---

**Design Analysis Complete**: 2026-04-03 20:02 UTC

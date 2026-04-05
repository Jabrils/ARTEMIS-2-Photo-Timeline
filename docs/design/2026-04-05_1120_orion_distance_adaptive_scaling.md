# Design Analysis: Distance-Adaptive Orion Scaling (F1)

**Date**: 2026-04-05
**Mode**: Tradeoff
**Finding**: F1 in `docs/findings/2026-04-05_1110_visual_scale_nsf_proportions_FINDINGS_TRACKER.md`
**Research**: `docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md`

---

## Design Goal

Make Orion appear as a small glowing dot/marker in the trajectory overview (matching NSF proportions) while retaining the full billboard sprite when the camera zooms in close.

## Current State

`src/components/Spacecraft.tsx`:
- Billboard: fixed `planeGeometry args={[1.2, 1.05]}` (1.2 su wide — 94% of Earth's 1.274 su diameter)
- Glow sphere: fixed `sphereGeometry args={[0.15, 16, 16]}`
- `useFrame` already runs per frame with camera access for rotation alignment
- `Billboard` wrapper from drei handles camera-facing
- Label: fixed position `[0, 0.8, 0]`, hover card at `[1.0, 0, 0]`

---

## Options Evaluated

### Option A: Scale in useFrame with camera distance (RECOMMENDED)

Add ~10 lines to the existing `useFrame` callback to compute camera distance and scale the group.

```typescript
// Inside useFrame({ camera }):
const camDist = camera.position.distanceTo(groupRef.current.position);
const FAR = 40;  // trajectory overview distance
const NEAR = 5;  // close-up distance
const t = THREE.MathUtils.clamp((camDist - NEAR) / (FAR - NEAR), 0, 1);
const scale = THREE.MathUtils.lerp(1.0, 0.1, t); // 1.0 at close, 0.1 at far
groupRef.current.scale.setScalar(scale);
```

**Pros**: Simplest, smooth transition, uses existing infrastructure, zero new deps.
**Cons**: Group scale affects label/hover card (HTML elements) — but drei's `<Html>` has built-in scale compensation.
**Effort**: ~10 lines in useFrame. ~10 min.
**Risk**: Low.

### Option B: Conditional render (dot vs billboard)

Replace `<Billboard>` with a conditional: show a `<points>` sprite at distance, full billboard at close zoom.

**Pros**: Sharp transition, optimal GPU at each distance.
**Cons**: Jarring pop between states, more complex render logic, potential flash on transition.
**Effort**: ~30 lines. ~30 min.
**Risk**: Medium — transition artifacts.

### Option C: Constant screen-space marker (sizeAttenuation={false})

Use Three.js `SpriteMaterial` with `sizeAttenuation: false` so Orion stays the same pixel size at all distances.

**Pros**: Consistent appearance regardless of zoom. True marker behavior.
**Cons**: Orion NEVER gets bigger on close zoom — loses the spacecraft detail view entirely. Defeats the purpose of the "Follow Orion" camera preset.
**Effort**: ~15 lines. ~15 min.
**Risk**: Low, but poor UX at close zoom.

### Option D: Current approach (baseline)

Keep fixed 1.2 su billboard at all distances.

**Pros**: No work.
**Cons**: Orion planet-sized in trajectory overview. 94% of Earth diameter.

---

## Recommendation: Option A — Scale in useFrame

Best balance: smooth zoom-dependent scaling with minimal code change. The `useFrame` callback already has camera access and runs per frame. Adding distance-based group scaling is ~10 lines with no new dependencies.

**Key trade-off**: Smooth proportional scaling vs. slight complexity in the useFrame callback.

### Scaling Parameters

| Camera Distance | Scale Factor | Orion Billboard Width | Glow Sphere Radius | Appearance |
|----------------|-------------|----------------------|-------------------|------------|
| <5 su (close) | 1.0 | 1.2 su | 0.15 su | Full spacecraft sprite |
| 20 su (mid) | 0.57 | 0.68 su | 0.085 su | Medium marker |
| 40 su (far) | 0.1 | 0.12 su | 0.015 su | Small glowing dot |
| >40 su (overview) | 0.1 | 0.12 su | 0.015 su | Dot (clamped) |

At 0.12 su in the trajectory overview, Orion is ~9% of Earth's diameter — a visible marker, not a planet.

### HTML Element Handling

drei's `<Html>` components (`ORION` label, hover card) need `scale` prop awareness. Options:
1. **Simplest**: Hide label at far distance with `opacity` based on scale — label already has `pointerEvents: 'none'`
2. **Alternative**: Move label to `<Html occlude>` with distance-based visibility

Recommendation: fade label opacity when scale < 0.5 (camera > ~22 su). At overview distance, only the green glow dot is visible.

---

## Specific Changes

### File: `src/components/Spacecraft.tsx`

1. **In useFrame (after line 43)**: Add camera distance calculation + group scaling

```typescript
// Distance-adaptive scaling — dot at overview, full sprite at close zoom
const camDist = camera.position.distanceTo(groupRef.current.position);
const t = THREE.MathUtils.clamp((camDist - 5) / 35, 0, 1); // 0 at ≤5su, 1 at ≥40su
const scale = THREE.MathUtils.lerp(1.0, 0.1, t);
groupRef.current.scale.setScalar(scale);
```

2. **Label visibility**: Add opacity fade to the ORION label `<Html>` based on scale

3. **Hover card position**: Scale hover card offset proportionally (already handled by group scale)

---

## Acceptance Criteria

- [ ] At trajectory overview zoom (>40 su), Orion appears as a small glowing dot (~0.12 su)
- [ ] At close zoom (<5 su), Orion appears at full billboard size (1.2 su)
- [ ] Transition is smooth (no popping or jarring size changes)
- [ ] ORION label fades out at far distances
- [ ] Hover card still works at medium/close distances
- [ ] Build passes

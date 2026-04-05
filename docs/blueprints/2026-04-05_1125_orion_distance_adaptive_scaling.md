# Blueprint: Distance-Adaptive Orion Scaling

**Date**: 2026-04-05
**Design Reference**: docs/design/2026-04-05_1120_orion_distance_adaptive_scaling.md
**Research Reference**: docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md

## Objective

Make Orion scale smoothly from a small glowing dot at trajectory overview zoom to the full billboard sprite at close zoom, matching NSF broadcast proportions. Currently Orion is 94% of Earth's diameter at all zoom levels.

## Requirements

1. Scale Orion group (billboard + glow sphere) inversely with camera distance
2. At >40 su camera distance: Orion at 0.1x scale (small glowing dot, ~0.12 su)
3. At <5 su camera distance: Orion at 1.0x scale (full billboard, 1.2 su)
4. Smooth lerp between near/far
5. ORION label hidden at far distances (threshold-based, not per-frame re-render)
6. Hover card gated on label visibility (no hover info at overview zoom)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scaling mechanism | `groupRef.scale.setScalar()` in `useFrame` | Already runs per frame with camera access; zero overhead |
| Label visibility | Threshold state with change-detection ref | Avoids per-frame React re-renders; only re-renders at threshold crossing |
| Threshold distance | 25 su | Midpoint of the 5-40 range; label visible at Earth/Moon presets but not overview |
| Hover gating | Gate on `labelVisible` | At overview zoom the mesh is tiny; prevent accidental hover cards |

## Scope

### In Scope
- Spacecraft.tsx: distance-adaptive group scaling + label visibility

### Out of Scope
- Body size reduction (F3 — separate finding)
- Trajectory map inset (F2 — separate finding)
- Changes to camera presets or other components

## Files Affected

- `src/components/Spacecraft.tsx` — all changes in this single file

## Implementation Sequence

1. **Add label visibility state + change-detection ref** (lines ~27-28)
2. **Add distance-adaptive scaling in useFrame** (after line 43)
3. **Gate ORION label on labelVisible** (line 75-82)
4. **Gate hover interaction on labelVisible** (lines 61-64, 83-107)

## Specific Changes

### Change 1: Add state and ref for label visibility (after line 27)

```typescript
const [labelVisible, setLabelVisible] = useState(true);
const wasLabelVisible = useRef(true);
```

### Change 2: Add scaling + label threshold in useFrame (after line 43)

```typescript
// Distance-adaptive scaling — dot at overview, full sprite at close zoom
const camDist = camera.position.distanceTo(groupRef.current.position);
const t = THREE.MathUtils.clamp((camDist - 5) / 35, 0, 1);
const scale = THREE.MathUtils.lerp(1.0, 0.1, t);
groupRef.current.scale.setScalar(scale);

// Label visibility — only re-render on threshold crossing
const shouldShow = camDist < 25;
if (shouldShow !== wasLabelVisible.current) {
  wasLabelVisible.current = shouldShow;
  setLabelVisible(shouldShow);
}
```

### Change 3: Gate label rendering on labelVisible

```tsx
{labelVisible && (
  <Html position={[0, 0.8, 0]} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
    <div style={ORION_LABEL_STYLE}>ORION</div>
  </Html>
)}
```

### Change 4: Gate hover on labelVisible

```tsx
<mesh
  ref={spriteRef}
  onPointerOver={() => labelVisible && setHovered(true)}
  onPointerOut={() => setHovered(false)}
>
```

And gate the hover card:
```tsx
{hovered && labelVisible && (
  <Html position={[1.0, 0, 0]} ...>
```

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Label flicker at threshold boundary | Low | Low | Hysteresis: 25 su show, 28 su hide (or just accept — smooth enough) |
| Hover card at mid-distance mispositioned | Low | Low | Group scale applies to Html position; drei handles this |
| Billboard rotation alignment at small scale | Low | Low | Rotation is set before scale; works at any scale |

## Acceptance Criteria

- [ ] At trajectory overview (>40 su), Orion is a small glowing dot (~0.12 su)
- [ ] At close zoom (<5 su), full billboard sprite (1.2 su)
- [ ] Smooth transition between, no popping
- [ ] ORION label hidden at overview distance, visible at close/medium
- [ ] Hover card works at close/medium zoom, not at overview
- [ ] Build passes (`npm run build`)

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 3
- **Completion criteria**: Build passes, Orion scales with camera distance
- **Invoke with**: `/wrought-implement`

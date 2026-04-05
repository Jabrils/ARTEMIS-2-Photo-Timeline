# Implementation Prompt: Distance-Adaptive Orion Scaling

**Blueprint Reference**: docs/blueprints/2026-04-05_1125_orion_distance_adaptive_scaling.md
**Design Reference**: docs/design/2026-04-05_1120_orion_distance_adaptive_scaling.md

## Context

Orion billboard at 1.2 su is 94% of Earth's diameter at all zoom levels. In the trajectory overview it appears planet-sized. NSF shows Orion as a tiny dot marker. The fix scales the group inversely with camera distance using the existing `useFrame` callback.

## Goal

Add distance-adaptive scaling to Spacecraft.tsx so Orion shrinks to a dot at overview zoom and stays full-size at close zoom.

## Requirements

1. Scale group via `groupRef.scale.setScalar()` in `useFrame` — lerp from 1.0 at <5su to 0.1 at >40su
2. Label visibility: threshold-based state (visible below 25su), change-detection ref to avoid per-frame re-renders
3. Gate hover interaction on label visibility
4. All changes in `src/components/Spacecraft.tsx` only

## Specific Changes

### 1. After line 27 — add state + ref
```typescript
const [labelVisible, setLabelVisible] = useState(true);
const wasLabelVisible = useRef(true);
```

### 2. After line 43 in useFrame — add scaling + threshold
```typescript
const camDist = camera.position.distanceTo(groupRef.current.position);
const t = THREE.MathUtils.clamp((camDist - 5) / 35, 0, 1);
const scale = THREE.MathUtils.lerp(1.0, 0.1, t);
groupRef.current.scale.setScalar(scale);

const shouldShow = camDist < 25;
if (shouldShow !== wasLabelVisible.current) {
  wasLabelVisible.current = shouldShow;
  setLabelVisible(shouldShow);
}
```

### 3. Gate label — wrap in `{labelVisible && (...)}`

### 4. Gate hover — `onPointerOver={() => labelVisible && setHovered(true)}` and `{hovered && labelVisible && (...)}`

## Acceptance Criteria

- [ ] Orion ~0.12 su at overview zoom (>40 su camera distance)
- [ ] Orion 1.2 su at close zoom (<5 su)
- [ ] Smooth transition
- [ ] Label hidden at overview, visible at close/medium
- [ ] Hover card gated on label visibility
- [ ] Build passes

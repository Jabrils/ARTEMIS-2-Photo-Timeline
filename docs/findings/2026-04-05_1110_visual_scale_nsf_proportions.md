# Finding Report: Visual Scale Mismatch — Orion Billboard and Trajectory Proportions

**Date**: 2026-04-05
**Source**: Research at `docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md`
**Type**: Gap
**Severity**: Medium

## What Was Found

Reverse-engineering the NASASpaceflight (NSF) live coverage dashboard revealed three scale/proportion issues in the ARTEMIS tracker's 3D view:

1. **Orion billboard is 94% of Earth's visual diameter** (1.2 su vs Earth's 1.274 su radius). In the trajectory overview, Orion appears planet-sized. NSF shows Orion as a tiny dot/marker on the trajectory line.

2. **No trajectory map inset**. NSF uses a dedicated trajectory overview panel showing the full figure-8 path at all times. Our single-scene approach forces a trade-off between spacecraft detail and trajectory overview.

3. **Body sizes slightly oversized for trajectory view**. Earth at 2.0x real scale (4.9% of view) is modestly larger than NSF's ~3-4%. A reduction to ~1.5x would better match the reference proportions while keeping bodies visible.

## Scope

- `src/components/Spacecraft.tsx` — Orion billboard size (1.2 x 1.05 su, ~2.4 million x exaggeration)
- `src/components/Earth.tsx` — Earth sphere radius (1.274 su, 2.0x real)
- `src/components/Moon.tsx` — Moon sphere radius (0.347 su, 2.0x real)
- Trajectory.tsx culling radii would need adjustment if body sizes change

## Preliminary Assessment

- **Likely cause**: Single-scene approach with fixed-size objects across all zoom levels. No distance-adaptive scaling for the spacecraft marker.
- **Confidence**: High — direct visual comparison with NSF reference.
- **Urgency**: Medium — functional but visually mismatched vs professional references.

## Evidence

| Object | Our Size (su) | Real Size (su) | Exaggeration | NSF Proportional |
|--------|--------------|----------------|--------------|-----------------|
| Earth | 1.274 radius | 0.637 | 2.0x | ~1.5x |
| Moon | 0.347 radius | 0.174 | 2.0x | ~1.5x |
| Orion | 1.2 width | 0.0000005 | ~2,400,000x | Dot marker |

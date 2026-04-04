# Root Cause Analysis: Moon Sphere Too Large — Trajectory Clips Through

**Date**: 2026-04-05
**Severity**: High
**Status**: Identified
**Finding**: F3 (6th investigation — final issue is visual scale, not position)

## Problem Statement

Moon position is correct (410,000 km from Earth) but the visual sphere (0.5 su = 5,000 km radius, 2.88x real) extends past the trajectory's closest approach (0.30 su = 3,000 km), causing 168 points to be culled.

## Root Cause

Moon sphere radius 0.5 su is disproportionately large. Earth uses 2.0x real scale; Moon uses 2.88x. The trajectory passes within 3,000 km of the circumcenter, inside the oversized sphere.

## Resolution

1. Moon sphere radius: 0.5 → 0.25 su (2,500 km, 1.44x real — 500 km clearance from trajectory)
2. Culling radius: 0.55 → 0.30 su
3. Label position: [0, 0.9, 0] → [0, 0.5, 0]
4. Hover card position: [1.0, 0, 0] → [0.6, 0, 0]

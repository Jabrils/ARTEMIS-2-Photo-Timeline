# Root Cause Analysis: Moon at 2.44 su from Earth — Circumcenter Selects Wrong Region

**Date**: 2026-04-05
**Severity**: Critical
**Status**: Identified
**Finding**: F3 (5th manifestation)
**Investigation**: `docs/investigations/2026-04-05_0200_moon_position_circumcenter_wrong_region.md`

## Problem Statement

Moon renders at 24,450 km (2.44 scene units) from Earth — right next to the Earth sphere. Should be at ~384,400 km (~38.44 scene units).

## Root Cause

`findMaxCurvatureIndex()` scans the ENTIRE trajectory for maximum angular curvature. The global max is at the parking orbit near Earth (index 341, curvature 0.0175), not the lunar flyby (index 1779, curvature 0.0009). Parking orbit curvature is 19x higher because orbital curvature scales inversely with distance. The circumcenter of parking-orbit points centers near Earth.

## Resolution

Replace `findMaxCurvatureIndex()` with apoapsis-based region selection:
1. Find apoapsis (max Earth distance) — always near the Moon on a lunar flyby trajectory
2. Search for max curvature only within ±300 points of apoapsis
3. Validate result: Moon must be 350,000-420,000 km from Earth; fallback to apoapsis direction at 384,400 km if not

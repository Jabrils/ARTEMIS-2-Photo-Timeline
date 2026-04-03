# Root Cause Analysis: Three Camera Visual Bugs

**Date**: 2026-04-03
**Severity**: Medium
**Status**: Identified
**Finding**: F2 in `docs/findings/2026-04-03_1958_camera_ux_refinement_FINDINGS_TRACKER.md`

## Problem Statement

Three bugs found during visual verification of the camera preset deployment: (1) debug overlay shows wrong coordinates, (2) trajectory appears vertical instead of horizontal, (3) preset buttons unresponsive when debug is active.

## Symptoms

- Debug overlay permanently displays `CAM POS: (0, 0, 0)` / `LOOK AT: (0, 0, 0)`
- Trajectory extends top-to-bottom on landscape screens instead of left-to-right
- Clicking Follow Orion / Earth View / Moon View buttons does nothing while debug overlay is visible

## Root Cause

### Bug 1: Debug overlay shows (0, 0, 0)

`CameraDebug.tsx:26` passes a plain object to `camera.getWorldDirection()`:

```typescript
const dir = camera.getWorldDirection({ x: 0, y: 0, z: 0 } as any);
```

THREE.js `getWorldDirection()` expects a `THREE.Vector3` instance. Passing a plain object causes a silent failure — the method tries to call `.set()` on the plain object, which doesn't exist. The `useFrame` callback errors silently (R3F swallows useFrame errors), so `setInfo` never runs and the state stays at the initial `{ px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 }`.

**Fix**: Pass `new THREE.Vector3()` instead.

### Bug 2: Trajectory too vertical

`CameraController.tsx:computePlanView` positions the camera along the orbital plane normal, but the camera's `up` vector remains the Three.js default `(0, 1, 0)`. The Artemis II trajectory in EME2000 has the orbital plane tilted such that the trajectory's longest extent aligns roughly with the screen's Y-axis when viewed from the normal direction.

The camera needs its `up` vector rotated so the trajectory's widest extent maps to the screen's X-axis (horizontal).

**Fix**: After computing the camera position, compute the trajectory's "widest" direction projected onto the view plane, then set the camera's `up` vector perpendicular to both the view direction and the widest direction. A simpler approach: compute the bounding box's longest axis projected onto the view plane and use the cross product of the view direction and that axis as the `up` vector.

### Bug 3: Preset buttons blocked by debug overlay

`CameraDebug.tsx:40` uses `<Html fullscreen zIndexRange={[100, 100]}>`. The `fullscreen` prop in drei's `<Html>` creates a full-screen `div` container positioned over the Canvas. Even though the inner debug text has `pointerEvents: 'none'`, the `<Html fullscreen>` wrapper's container div does not, so it captures all click events above the Canvas — including clicks on the HUD camera preset buttons.

**Fix**: Add `style={{ pointerEvents: 'none' }}` to the `<Html>` component, or remove `fullscreen` and use a portal/CSS fixed positioning instead.

## Evidence

- Screenshot 5: `CAM POS: (0, 0, 0)` visible while camera is clearly at a non-origin position
- Screenshot 1: trajectory extends from top (Earth) to bottom-right (Moon) on a landscape display
- User report: "clicking on the different view modes does not change the views" when D is toggled

## Resolution

### Fix 1: CameraDebug.tsx — correct getWorldDirection argument

```typescript
// Before
const dir = camera.getWorldDirection({ x: 0, y: 0, z: 0 } as any);

// After
const dir = camera.getWorldDirection(new THREE.Vector3());
```

### Fix 2: CameraController.tsx — align camera up vector for horizontal trajectory

In `computePlanView`, after computing `camPos` and `target`, compute the camera's `up` vector so the trajectory's widest extent is horizontal:

```typescript
// Find the trajectory's widest axis in the view plane
const viewDir = new THREE.Vector3().subVectors(target, camPos).normalize();
// Project bounding box extents onto the view plane
const rightCandidate = new THREE.Vector3(maxX - minX, 0, 0); // try X extent
const upCandidate = new THREE.Vector3().crossVectors(viewDir, rightCandidate).normalize();
// If degenerate, fall back
if (upCandidate.length() < 0.01) {
  upCandidate.set(0, 1, 0);
}
```

A simpler and more robust approach: compute the trajectory's principal axis (direction of widest spread) and ensure it maps to the screen's horizontal by setting the camera's `up` to `cross(viewDir, principalAxis)`.

### Fix 3: CameraDebug.tsx — allow click-through on Html wrapper

```typescript
// Before
<Html fullscreen zIndexRange={[100, 100]}>

// After — add pointerEvents none to the wrapper
<Html fullscreen zIndexRange={[100, 100]} style={{ pointerEvents: 'none' }}>
```

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test -- --run`
- **Max iterations**: 3
- **Completion criteria**: Build passes, all tests pass. Visual verification required post-deploy.
- **Invoke with**: `/wrought-rca-fix`

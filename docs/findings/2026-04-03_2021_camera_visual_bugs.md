# Finding: Three Camera Bugs Found During Visual Verification

**Date**: 2026-04-03
**Discovered by**: User visual verification of camera preset deployment (Session 2)
**Type**: Defect
**Severity**: Medium
**Status**: Open

---

## What Was Found

Three bugs observed in the deployed camera system at artemis-tracker-murex.vercel.app:

### Bug 1: Debug overlay shows CAM POS (0, 0, 0)

`src/components/CameraDebug.tsx:26` — the `camera.getWorldDirection()` call passes a plain object `{ x: 0, y: 0, z: 0 } as any` instead of a `THREE.Vector3`. This likely causes a silent error in `useFrame`, preventing `setInfo` from ever updating. The overlay permanently displays the initial state `(0, 0, 0)`.

### Bug 2: Trajectory orientation too vertical

The default plan view (`computePlanView` in `CameraController.tsx`) positions the camera along the orbital plane normal, which results in a vertical trajectory layout on landscape screens. The Artemis II orbit in EME2000 has significant inclination — the orbital plane normal points in a direction that makes the trajectory extend top-to-bottom rather than left-to-right. The camera's `up` vector is not adjusted to align the trajectory's longest extent horizontally.

### Bug 3: View mode buttons don't work when debug overlay is active

`CameraDebug.tsx:40` uses `<Html fullscreen zIndexRange={[100, 100]}>` from drei. The `fullscreen` prop creates a full-screen container that intercepts pointer events, even though the inner `div` has `pointerEvents: 'none'`. The `<Html>` wrapper itself captures clicks before they reach the HUD buttons beneath.

---

## Affected Components

- `src/components/CameraDebug.tsx` — bugs 1 and 3
- `src/components/CameraController.tsx` — bug 2 (computePlanView, lines 51-71)

---

## Evidence

Screenshot 5 (debug active): `CAM POS: (0, 0, 0)` / `LOOK AT: (0, 0, 0)` — camera is clearly positioned away from origin based on the rendered view.

Screenshot 1 (Free mode): trajectory extends vertically from Earth (top) to Moon (bottom-right), with significant portions near the edges of the viewport.

Screenshot 3 (Earth View): Earth is partially cut off at the right edge, trajectory extends vertically.

User report: "clicking on the different view modes does not change the views" when D overlay is toggled on.

---

## Preliminary Assessment

**Likely cause**: 
- Bug 1: Wrong argument type to `camera.getWorldDirection()` — needs `new THREE.Vector3()`
- Bug 2: Camera `up` vector not aligned to make trajectory horizontal — needs rotation around the viewing axis
- Bug 3: `<Html fullscreen>` creates a blocking overlay — needs `pointerEvents: 'none'` on the `<Html>` wrapper or removal of `fullscreen` prop

**Likely scope**: Isolated to the two camera component files. No store, API, or data logic affected.

**Likely impact**: Debug overlay is non-functional (bugs 1+3). Trajectory appears vertical rather than horizontal in all views (bug 2). Users can still navigate with free camera, but the preset experience is degraded.

---

## Classification Rationale

**Type: Defect** — These are bugs in existing code, not missing capabilities.

**Severity: Medium** — The visualization works and data is correct, but the viewing experience is degraded. Free camera mode is a workaround.

---

**Finding Logged**: 2026-04-03 20:21 UTC

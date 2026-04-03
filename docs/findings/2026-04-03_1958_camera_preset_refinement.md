# Finding: Camera Presets Need Refinement for Optimal Mission Visualization

**Date**: 2026-04-03
**Discovered by**: Session 2 review of Session 1 handoff + code inspection
**Type**: Gap
**Severity**: Medium
**Status**: Open

---

## What Was Found

The four camera presets in `src/components/CameraController.tsx` (lines 116-167) have suboptimal viewing angles for the Artemis II mission visualization:

### 1. Follow Orion (line 131)
Camera offset is a fixed `(5, 8, 20)` relative to spacecraft position. This fixed offset does not rotate with the spacecraft's velocity direction, meaning the camera angle is arbitrary relative to the trajectory. As Orion curves around the Moon, the view doesn't adapt — the trajectory may be behind the camera or at an awkward angle.

### 2. Earth View (lines 135-141)
Currently identical to the default auto-fit plan view (`computePlanView`). It does not show Earth prominently or provide a perspective from Earth's surface/vicinity looking outward at the departing spacecraft. The name "Earth View" implies a view from or centered on Earth, but it's just a top-down orbital plane view.

### 3. Moon View (lines 144-164)
Camera positioned at `moonPos + (0, 15, 10)` — a fixed offset above and behind the Moon. The offset is hardcoded and does not account for the spacecraft's approach/departure angle. The trajectory loop around the Moon may not be fully visible depending on the orbital geometry.

### 4. Default Plan View (lines 25-71)
The auto-fit plan view works correctly for an overview, but uses a 1.4x/1.8x distance multiplier that may show the trajectory too zoomed out or too close depending on the mission phase.

---

## Affected Components

- `src/components/CameraController.tsx` — preset position/target logic (lines 116-167, 169-183)
- `src/hud/CameraControls.tsx` — preset button definitions (lines 4-32)
- `src/components/CameraDebug.tsx` — debug overlay for tuning (D-key)

---

## Evidence

```typescript
// Follow Orion: fixed offset, doesn't rotate with velocity
targetPos.current.copy(orionPos).add(new THREE.Vector3(5, 8, 20));

// Earth View: identical to default plan view — no Earth-centric perspective
const { camPos, target } = computePlanView(oemData, isMobile);

// Moon View: fixed offset from Moon, doesn't adapt to approach angle
targetPos.current.copy(moonPos).add(new THREE.Vector3(0, 15, 10));
```

Session 1 handoff noted: "Camera presets still being refined (Earth View, Follow Orion perspectives)" and "Multiple rounds of camera/Moon positioning fixes based on user screenshots."

---

## Preliminary Assessment

**Likely cause**: Camera presets were implemented with minimal hardcoded offsets during the MVP build. Refinement requires visual iteration with the live 3D scene — positions need tuning based on what looks good, not just what's geometrically correct.

**Likely scope**: Isolated to `CameraController.tsx` preset logic. The OrbitControls, lerp interpolation, and mode-switching infrastructure are solid.

**Likely impact**: Users see suboptimal default perspectives when clicking preset buttons. The free camera mode works correctly, so users can manually navigate to good views, but the presets should provide immediately useful viewpoints.

---

## Classification Rationale

**Type: Gap** — The presets exist but don't deliver the expected viewing experience. This is a missing capability (good default views) rather than a bug.

**Severity: Medium** — The visualization works and users can navigate freely. Presets are a quality-of-life feature. However, first impressions matter for a public-facing mission tracker.

---

**Finding Logged**: 2026-04-03 19:58 UTC

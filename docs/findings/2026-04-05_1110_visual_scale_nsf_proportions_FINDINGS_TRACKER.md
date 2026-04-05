**2026-04-05 11:10 UTC**

# Visual Scale & NSF Proportions — Findings Tracker

**Created**: 2026-04-05 11:10 UTC
**Last Updated**: 2026-04-05 11:10 UTC
**Origin**: Research reverse-engineering NSF Artemis II dashboard proportions (`docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md`)
**Session**: 5
**Scope**: Orion sprite scaling, body size proportions, and trajectory view layout to match professional broadcast references

---

## Overview

Three visual proportion issues identified by comparing ARTEMIS tracker against the NASASpaceflight live coverage dashboard. The core problem is that the single-scene approach with fixed-size objects creates scale conflicts between trajectory overview and spacecraft detail views.

| # | Finding | Type | Severity | Status | Stage | Report |
|---|---------|------|----------|--------|-------|--------|
| F1 | Orion billboard is planet-sized in trajectory view (94% of Earth diameter) | Gap | **Medium** | In Progress | Blueprint Ready | [Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |
| F2 | No trajectory map inset (NSF uses always-visible figure-8 overview) | Gap | **Medium** | Open | Open | [Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |
| F3 | Body sizes slightly oversized for trajectory view (2.0x vs NSF ~1.5x) | Gap | **Low** | Open | Open | [Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |

**Status legend**: `Open` -> `In Progress` -> `Resolved` -> `Verified`
**Stage legend**: `Open` -> `Designing` -> `Blueprint Ready` -> `Planned` -> `Implementing` -> `Reviewed` -> `Resolved` -> `Verified`

---

## Dependency Map

```
F1 (Orion scaling) -- independent, highest visual impact
F2 (Trajectory inset) -- independent, new component, optional but high value
F3 (Body size reduction) -- depends on F1 (adjust culling radii together)
```

Recommended order: F1 (Orion adaptive scaling) -> F3 (body size + culling) -> F2 (inset, if desired)

---

## F1: Orion Billboard Planet-Sized in Trajectory View (Medium Gap)

**Summary**: Orion billboard sprite at 1.2 x 1.05 scene units is 94% of Earth's visual diameter (1.274 su radius). At trajectory overview zoom, Orion appears planet-sized. NSF shows Orion as a tiny dot marker on the trajectory line.

**Root cause**: Fixed billboard size regardless of camera distance. No distance-adaptive scaling.

**Resolution tasks**:

- [ ] **F1.1**: Design approach — distance-adaptive Orion scaling (lerp between dot at wide zoom and full sprite at close zoom) (-> /design -> Stage: Designing)
- [ ] **F1.2**: Blueprint + implementation prompt (-> /blueprint -> Stage: Blueprint Ready)
- [ ] **F1.3**: Implement changes (Stage: Implementing -> Resolved)
- [ ] **F1.4**: Code review (-> /forge-review -> Stage: Reviewed)
- [ ] **F1.5**: Verify Orion appears as dot in trajectory view, full sprite at close zoom (Stage: Verified)

**Recommended approach**: `/design tradeoff` — evaluate scaling curve, minimum/maximum sizes, transition smoothness

**Status**: Open
**Stage**: Open
**Resolved in session**: --
**Verified in session**: --
**Notes**: Key file: `src/components/Spacecraft.tsx`. The research suggests scaling from 0.1-0.2 su at >40 su camera distance to full 1.2 su at <5 su distance, with lerp between.
**GitHub Issue**: --
**Project Item ID**: --

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-04-05 11:10 UTC | 5 | [Finding Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |

---

## F2: No Trajectory Map Inset (Medium Gap)

**Summary**: NSF dashboard includes an always-visible trajectory overview inset showing the full figure-8 path, Earth/Moon as dots, and Orion position marker. Our single-scene approach has no equivalent — users must choose between spacecraft detail and trajectory overview via camera presets.

**Root cause**: Single Canvas rendering approach. No secondary overview layer.

**Resolution tasks**:

- [ ] **F2.1**: Design approach — evaluate SVG overlay, second Canvas, or simplified HUD component (-> /design -> Stage: Designing)
- [ ] **F2.2**: Blueprint + implementation prompt (-> /blueprint -> Stage: Blueprint Ready)
- [ ] **F2.3**: Implement changes (Stage: Implementing -> Resolved)
- [ ] **F2.4**: Code review (-> /forge-review -> Stage: Reviewed)
- [ ] **F2.5**: Verify inset shows full trajectory with correct proportions (Stage: Verified)

**Recommended approach**: `/design tradeoff` — compare SVG overlay vs second Canvas vs simplified 2D component

**Status**: Open
**Stage**: Open
**Resolved in session**: --
**Verified in session**: --
**Notes**: New component `src/hud/TrajectoryMap.tsx` or second `<Canvas>` in `src/App.tsx`. This is optional but high-value for visual polish.
**GitHub Issue**: --
**Project Item ID**: --

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-04-05 11:10 UTC | 5 | [Finding Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |

---

## F3: Body Sizes Slightly Oversized for Trajectory View (Low Gap)

**Summary**: Earth (2.0x real, 4.9% of view) and Moon (2.0x real, 1.3% of view) are modestly larger than NSF's ~3-4% Earth reference. Reducing to ~1.5x would better match broadcast proportions while keeping bodies visible.

**Root cause**: 2.0x scale factor chosen for visibility without reference comparison.

**Resolution tasks**:

- [ ] **F3.1**: Design approach — evaluate 1.5x scale with trajectory culling radius adjustment (-> /design -> Stage: Designing)
- [ ] **F3.2**: Blueprint + implementation prompt (-> /blueprint -> Stage: Blueprint Ready)
- [ ] **F3.3**: Implement changes (Stage: Implementing -> Resolved)
- [ ] **F3.4**: Verify bodies are visible but not dominating trajectory view (Stage: Verified)

**Recommended approach**: `/design impact` — assess impact of body size reduction on culling, hover cards, labels

**Status**: Open
**Stage**: Open
**Resolved in session**: --
**Verified in session**: --
**Notes**: Depends on F1 (Orion scaling). If Orion is fixed first, body size reduction becomes more impactful. Key files: `src/components/Earth.tsx`, `src/components/Moon.tsx`, `src/components/Trajectory.tsx`.
**GitHub Issue**: --
**Project Item ID**: --

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-04-05 11:10 UTC | 5 | [Finding Report](2026-04-05_1110_visual_scale_nsf_proportions.md) |

---

## Changelog

| Date | Session | Action |
|------|---------|--------|
| 2026-04-05 11:10 UTC | 5 | Created tracker. F1-F3 logged from NSF trajectory scale research. F1: Medium Gap (Orion billboard). F2: Medium Gap (trajectory inset). F3: Low Gap (body sizes). |

---

## Cross-References

| Document | Description |
|----------|-------------|
| [2026-04-05_1110_visual_scale_nsf_proportions.md](2026-04-05_1110_visual_scale_nsf_proportions.md) | F1-F3 finding report |
| [docs/research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md](../research/2026-04-05_1100_nsf_trajectory_scale_reverse_engineering.md) | Source research (NSF reverse-engineering) |
| `src/components/Spacecraft.tsx` | F1 — Orion billboard scaling |
| `src/components/Earth.tsx` | F3 — Earth sphere size |
| `src/components/Moon.tsx` | F3 — Moon sphere size |
| `src/components/Trajectory.tsx` | F3 — culling radii |

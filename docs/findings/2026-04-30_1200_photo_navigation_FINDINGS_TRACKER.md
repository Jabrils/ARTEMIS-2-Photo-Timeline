**2026-04-30 12:00 UTC**

# Photo Navigation — Findings Tracker

**Created**: 2026-04-30 12:00 UTC
**Last Updated**: 2026-05-01 10:15 UTC
**Origin**: User request to add prev/next arrow scrubbers and photo display panel
**Session**: 7
**Scope**: Photo navigation controls and in-scene photo display

---

## Overview

Photo navigation controls and in-scene photo display for the Artemis II mission viewer.

| # | Finding | Type | Severity | Status | Stage | Report |
|---|---------|------|----------|--------|-------|--------|
| F1 | No prev/next photo navigation in Progress bar | Gap | **Low** | Resolved | Resolved | [Report](2026-04-30_1200_photo_nav_gap.md) |
| F2 | No photo display panel in 3D scene viewport | Gap | **Low** | Resolved | Resolved | [Report](2026-04-30_1220_photo_display_panel_gap.md) |
| F3 | MissionEventsPanel photos hidden behind expand toggle; no click-to-jump | Gap | **Low** | Resolved | Resolved | [Report](2026-05-01_1000_events_panel_photo_ux_gap.md) |

**Status legend**: `Open` → `In Progress` → `Resolved` → `Verified`
**Stage legend**: `Open` → `Designing` → `Blueprint Ready` → `Planned` → `Implementing` → `Reviewed` → `Resolved` → `Verified`

---

## Dependency Map

```
No dependencies. Standalone UI addition to ProgressBar.tsx.
```

---

## F1: No Prev/Next Photo Navigation in Progress Bar (Low Gap)

**Summary**: Mission Progress bar has no sequential navigation controls to step through photo milestones; users must click individual tightly-packed dots.

**Root cause**: Feature was never built — `setSimTime` infrastructure exists but no prev/next UI wiring.

**Resolution tasks**:

- [x] **F1.1**: Design approach (→ /design → Stage: Designing)
- [x] **F1.2**: Blueprint + implementation prompt (→ /blueprint → Stage: Blueprint Ready)
- [x] **F1.3**: Implementation plan (→ /plan → Stage: Planned)
- [x] **F1.4**: Implement changes (Stage: Implementing → Resolved)
- [ ] **F1.5**: Code review (→ /forge-review → Stage: Reviewed)
- [ ] **F1.6**: Verify implementation (Stage: Verified)

**Recommended approach**: `/design from-scratch F1 photo navigation arrows`

**Status**: Resolved
**Stage**: Resolved
**Resolved in session**: —
**Verified in session**: —
**Notes**: —
**GitHub Issue**: —
**Project Item ID**: —

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-04-30 12:00 UTC | 7 | [Finding Report](2026-04-30_1200_photo_nav_gap.md) |
| Designing | 2026-04-30 12:05 UTC | 7 | [Design Doc](../design/2026-04-30_1200_photo_nav_arrows.md) |
| Blueprint Ready | 2026-04-30 12:10 UTC | 7 | [Blueprint](../blueprints/2026-04-30_1200_photo_nav_arrows.md) |
| Resolved | 2026-04-30 12:16 UTC | 7 | [ProgressBar.tsx](../../src/hud/ProgressBar.tsx) — build passed, 1 iteration |

---

## F2: No Photo Display Panel in 3D Scene Viewport (Low Gap)

**Summary**: Photos exist in `MILESTONES[].photo` but are only shown as small hover tooltips; no full-size panel is displayed in the main viewport.

**Root cause**: Feature was never built — no overlay component exists for photo display.

**Resolution tasks**:

- [x] **F2.1**: Design approach (→ /design → Stage: Designing)
- [x] **F2.2**: Blueprint + implementation prompt (→ /blueprint → Stage: Blueprint Ready)
- [x] **F2.3**: Implementation plan (→ /plan → Stage: Planned)
- [x] **F2.4**: Implement changes (Stage: Implementing → Resolved)
- [ ] **F2.5**: Code review (→ /forge-review → Stage: Reviewed)
- [ ] **F2.6**: Verify implementation (Stage: Verified)

**Recommended approach**: `/design from-scratch F2 photo display panel`

**Status**: Resolved
**Stage**: Resolved
**Resolved in session**: —
**Verified in session**: —
**Notes**: Show photo when sim time is within ±30min of a photo milestone. Top-left placement. Fade in/out.
**GitHub Issue**: —
**Project Item ID**: —

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-04-30 12:20 UTC | 7 | [Finding Report](2026-04-30_1220_photo_display_panel_gap.md) |
| Designing | 2026-04-30 12:25 UTC | 7 | [Design Doc](../design/2026-04-30_1220_photo_display_panel.md) |
| Blueprint Ready | 2026-04-30 12:30 UTC | 7 | [Blueprint](../blueprints/2026-04-30_1220_photo_display_panel.md) |
| Resolved | 2026-04-30 12:36 UTC | 7 | [PhotoPanel.tsx](../../src/hud/PhotoPanel.tsx) + [HUD.tsx](../../src/hud/HUD.tsx) — build passed, 1 iteration |

---

## F3: MissionEventsPanel Photos Hidden Behind Expand Toggle (Low Gap)

**Summary**: Photos in the Mission Events timeline are hidden by default behind a click-to-expand toggle; no click handler exists to jump Orion to a photo's timestamp.

**Root cause**: Feature was designed with expand/collapse UX; always-visible + click-to-jump capability was never built.

**Resolution tasks**:

- [x] **F3.1**: Design approach (→ /design → Stage: Designing)
- [x] **F3.2**: Blueprint + implementation prompt (→ /blueprint → Stage: Blueprint Ready)
- [x] **F3.3**: Implement changes — remove `expandedPhoto` state, render photos unconditionally, add click-to-jump on photo (Stage: Implementing → Resolved)
- [ ] **F3.4**: Code review (→ /forge-review → Stage: Reviewed)
- [ ] **F3.5**: Verify implementation (Stage: Verified)

**Recommended approach**: `/design from-scratch F3 events panel always-visible photos`

**Status**: Resolved
**Stage**: Resolved
**Resolved in session**: —
**Verified in session**: —
**Notes**: Only file affected is `src/hud/MissionEventsPanel.tsx`
**GitHub Issue**: —
**Project Item ID**: —

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-05-01 10:00 UTC | 7 | [Finding Report](2026-05-01_1000_events_panel_photo_ux_gap.md) |
| Designing | 2026-05-01 10:10 UTC | 7 | [Design Doc](../design/2026-05-01_1000_events_panel_photo_ux.md) |
| Blueprint Ready | 2026-05-01 10:10 UTC | 7 | [Blueprint](../blueprints/2026-05-01_1000_events_panel_photo_ux.md) |
| Resolved | 2026-05-01 10:15 UTC | 7 | [MissionEventsPanel.tsx](../../src/hud/MissionEventsPanel.tsx) — build passed, 1 iteration |

---

## Changelog

| Date | Session | Action |
|------|---------|--------|
| 2026-04-30 12:00 UTC | 7 | Created tracker. F1 logged (Low Gap). |
| 2026-04-30 12:05 UTC | 7 | F1 stage → Designing. Design doc: docs/design/2026-04-30_1200_photo_nav_arrows.md |
| 2026-04-30 12:10 UTC | 7 | F1 stage → Blueprint Ready. Blueprint: docs/blueprints/2026-04-30_1200_photo_nav_arrows.md. Prompt: docs/prompts/2026-04-30_1200_photo_nav_arrows.md |
| 2026-04-30 12:16 UTC | 7 | F1 → Resolved. Implemented in src/hud/ProgressBar.tsx. Build passed (1 iteration). |
| 2026-04-30 12:20 UTC | 7 | F2 logged (Low Gap). Photo display panel. |
| 2026-04-30 12:25 UTC | 7 | F2 stage → Designing. Design doc: docs/design/2026-04-30_1220_photo_display_panel.md |
| 2026-04-30 12:30 UTC | 7 | F2 stage → Blueprint Ready. Blueprint: docs/blueprints/2026-04-30_1220_photo_display_panel.md. Prompt: docs/prompts/2026-04-30_1220_photo_display_panel.md |
| 2026-04-30 12:36 UTC | 7 | F2 → Resolved. Created src/hud/PhotoPanel.tsx, updated src/hud/HUD.tsx. Build passed (1 iteration). |
| 2026-05-01 10:00 UTC | 7 | F3 logged (Low Gap). Events panel always-visible photos + click-to-jump. |
| 2026-05-01 10:10 UTC | 7 | F3 stage → Designing. Design doc: docs/design/2026-05-01_1000_events_panel_photo_ux.md |
| 2026-05-01 10:10 UTC | 7 | F3 stage → Blueprint Ready. Blueprint: docs/blueprints/2026-05-01_1000_events_panel_photo_ux.md. Prompt: docs/prompts/2026-05-01_1000_events_panel_photo_ux.md |
| 2026-05-01 10:15 UTC | 7 | F3 → Resolved. Implemented in src/hud/MissionEventsPanel.tsx. Build passed (1 iteration). |

---

## Cross-References

| Document | Description |
|----------|-------------|
| docs/findings/2026-04-30_1200_photo_nav_gap.md | F1 finding report |
| docs/design/2026-04-30_1200_photo_nav_arrows.md | F1 design analysis |
| docs/blueprints/2026-04-30_1200_photo_nav_arrows.md | F1 blueprint |
| docs/prompts/2026-04-30_1200_photo_nav_arrows.md | F1 implementation prompt |
| docs/findings/2026-04-30_1220_photo_display_panel_gap.md | F2 finding report |
| docs/design/2026-04-30_1220_photo_display_panel.md | F2 design analysis |
| docs/blueprints/2026-04-30_1220_photo_display_panel.md | F2 blueprint |
| docs/prompts/2026-04-30_1220_photo_display_panel.md | F2 implementation prompt |
| docs/findings/2026-05-01_1000_events_panel_photo_ux_gap.md | F3 finding report |
| docs/design/2026-05-01_1000_events_panel_photo_ux.md | F3 design analysis |
| docs/blueprints/2026-05-01_1000_events_panel_photo_ux.md | F3 blueprint |
| docs/prompts/2026-05-01_1000_events_panel_photo_ux.md | F3 implementation prompt |

**2026-05-18 12:00 UTC**

# Promo & Attribution — Findings Tracker

**Created**: 2026-05-18 12:00 UTC
**Last Updated**: 2026-05-18 12:05 UTC
**Origin**: User request to add support CTA popup and attribution footer
**Session**: 7
**Scope**: Promotional widget and attribution footer for the Artemis II mission viewer

---

## Overview

Missing bottom-right promo widget with support CTA and attributed inspiration link to artemistimeline.com.

| # | Finding | Type | Severity | Status | Stage | Report |
|---|---------|------|----------|--------|-------|--------|
| F1 | No promo widget or attribution footer in HUD | Gap | **Low** | Resolved | Resolved | [Report](2026-05-18_1200_promo_attribution_gap.md) |

**Status legend**: `Open` → `In Progress` → `Resolved` → `Verified`
**Stage legend**: `Open` → `Designing` → `Blueprint Ready` → `Planned` → `Implementing` → `Reviewed` → `Resolved` → `Verified`

---

## Dependency Map

```
No dependencies. Standalone new component added to HUD.
```

---

## F1: No Promo Widget or Attribution Footer in HUD (Low Gap)

**Summary**: HUD has no bottom-right promotional popup and no attribution link to artemistimeline.com.

**Root cause**: Feature was never built — no PromoWidget component exists.

**Resolution tasks**:

- [x] **F1.1**: Design approach (→ /design → Stage: Designing)
- [x] **F1.2**: Blueprint + implementation prompt (→ /blueprint → Stage: Blueprint Ready)
- [x] **F1.3**: Implement changes — create `src/hud/PromoWidget.tsx`, add to `src/hud/HUD.tsx` (Stage: Implementing → Resolved)
- [ ] **F1.4**: Code review (→ /forge-review → Stage: Reviewed)
- [ ] **F1.5**: Verify implementation (Stage: Verified)

**Recommended approach**: `/design from-scratch F1 promo widget and attribution footer`

**Status**: Open
**Stage**: Open
**Resolved in session**: —
**Verified in session**: —
**Notes**: CTA text: "Like this tool? Support my work by playing my game & watch my youtube." Footer: "This project is inspired by artemistimeline.com" (clickable link)
**GitHub Issue**: —
**Project Item ID**: —

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-05-18 12:00 UTC | 7 | [Finding Report](2026-05-18_1200_promo_attribution_gap.md) |
| Designing | 2026-05-18 12:03 UTC | 7 | [Design Doc](../design/2026-05-18_1200_promo_widget.md) |
| Blueprint Ready | 2026-05-18 12:05 UTC | 7 | [Prompt](../prompts/2026-05-18_1200_promo_widget.md) |
| Resolved | 2026-05-18 12:08 UTC | 7 | [PromoWidget.tsx](../../src/hud/PromoWidget.tsx) + [HUD.tsx](../../src/hud/HUD.tsx) — build passed, 1 iteration |

---

## Changelog

| Date | Session | Action |
|------|---------|--------|
| 2026-05-18 12:00 UTC | 7 | Created tracker. F1 logged (Low Gap). |

---

## Cross-References

| Document | Description |
|----------|-------------|
| docs/findings/2026-05-18_1200_promo_attribution_gap.md | F1 finding report |

**2026-05-18 13:00 UTC**

# Wall Clock & Timezone — Findings Tracker

**Created**: 2026-05-18 13:00 UTC
**Last Updated**: 2026-05-18 13:00 UTC
**Origin**: User request to display actual date/time on timeline with selectable UTC offset
**Session**: 7
**Scope**: Wall-clock time display and timezone selector for the Artemis II mission viewer

---

## Overview

HUD shows only mission elapsed time with no wall-clock date/time or timezone selector.

| # | Finding | Type | Severity | Status | Stage | Report |
|---|---------|------|----------|--------|-------|--------|
| F1 | No wall-clock time display or timezone selector on HUD | Gap | **Low** | Resolved | Resolved | [Report](2026-05-18_1300_wall_clock_timezone_gap.md) |

**Status legend**: `Open` → `In Progress` → `Resolved` → `Verified`
**Stage legend**: `Open` → `Designing` → `Blueprint Ready` → `Planned` → `Implementing` → `Reviewed` → `Resolved` → `Verified`

---

## Dependency Map

```
No dependencies. Additive change to MissionClock.tsx + mission-store.ts.
```

---

## F1: No Wall-Clock Time Display or Timezone Selector (Low Gap)

**Summary**: MissionClock shows only elapsed time; no calendar date/time or UTC offset selector exists anywhere in the HUD.

**Root cause**: Feature was never built — MissionClock was implemented with elapsed-only display.

**Resolution tasks**:

- [x] **F1.1**: Design approach (→ /design → Stage: Designing)
- [x] **F1.2**: Blueprint + implementation prompt (→ /blueprint → Stage: Blueprint Ready)
- [ ] **F1.3**: Implement — add `utcOffset` to store, wall-clock row + ±UTC selector to MissionClock (Stage: Implementing → Resolved)
- [ ] **F1.4**: Code review (→ /forge-review → Stage: Reviewed)
- [ ] **F1.5**: Verify implementation (Stage: Verified)

**Recommended approach**: `/design from-scratch F1 wall-clock time display and UTC offset selector`

**Status**: Open
**Stage**: Open
**Resolved in session**: —
**Verified in session**: —
**Notes**: UTC offset stored in Zustand for future use by other components
**GitHub Issue**: —
**Project Item ID**: —

**Lifecycle**:
| Stage | Timestamp | Session | Artifact |
|-------|-----------|---------|----------|
| Open | 2026-05-18 13:00 UTC | 7 | [Finding Report](2026-05-18_1300_wall_clock_timezone_gap.md) |

---

## Changelog

| Date | Session | Action |
|------|---------|--------|
| 2026-05-18 13:00 UTC | 7 | Created tracker. F1 logged (Low Gap). |

---

## Cross-References

| Document | Description |
|----------|-------------|
| docs/findings/2026-05-18_1300_wall_clock_timezone_gap.md | F1 finding report |

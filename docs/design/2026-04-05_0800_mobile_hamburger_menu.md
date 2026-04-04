# Design Analysis: Mobile Hamburger Menu Overflow (F4)

**Date**: 2026-04-05
**Mode**: Tradeoff (streamlined)
**Finding**: F4 in `docs/findings/2026-04-04_2200_ui_visual_regressions_session5_FINDINGS_TRACKER.md`

---

## Current State

`MissionEventsPanel.tsx` dropdown on mobile:
- Width: `w-[calc(100vw-1.5rem)]` (near full-width)
- Height: `max-h-[70vh]` — on a 667px iPhone SE, 70vh = 467px
- Content: 19 milestones at ~36px each = ~684px → fills max-height, most of viewport
- Click-outside overlay blocks all 3D scene interaction

---

## Options Evaluated

### Option A: Reduced max-h + compact items (RECOMMENDED)

**Changes**:
1. `max-h-[70vh]` → `max-h-[50vh] sm:max-h-[70vh]` — 50% viewport on mobile, 70% on desktop
2. Milestone items: `py-1.5` → `py-1 sm:py-1.5`, `text-xs` → `text-[11px] sm:text-xs` on mobile
3. Auto-scroll to current milestone on open via `scrollIntoView`

**Impact**: On 667px viewport, 50vh = 333px — shows ~12 milestones with scroll, leaves 50% viewport for 3D scene. Auto-scroll ensures the current milestone is always visible.

**Effort**: 3 class changes + 5 lines for scrollIntoView. ~15 min.
**Risk**: Low — CSS-only mobile changes + one useEffect.

### Option B: Collapsible phase sections

**Changes**: Group milestones into 4 phases (Launch 0-2.5h, Outbound 5-48h, Lunar 80-120h, Return 144-240h). Each phase is a collapsible section, only current phase expanded by default.

**Impact**: Reduces initial visible content to ~4-5 items (current phase). More interactive but adds complexity.

**Effort**: ~30 lines new logic (phase grouping, collapse state). ~45 min.
**Risk**: Medium — new interaction pattern, touch targets, animation.

### Option C: Bottom sheet with drag handle

**Changes**: Replace dropdown with a bottom sheet that slides up, with a drag handle to resize. Common mobile pattern (Maps, ride-sharing apps).

**Impact**: Most mobile-native feel. But adds significant complexity and a new interaction paradigm.

**Effort**: ~100+ lines, new component. ~2 hours.
**Risk**: High — new pattern, accessibility concerns, touch gesture handling.

### Option D: max-h only (minimal)

**Changes**: Just `max-h-[70vh]` → `max-h-[50vh]` on mobile.

**Impact**: Reduces coverage but items still at full size. Minimal effort.

**Effort**: 1 class change. ~5 min.
**Risk**: None.

---

## Recommendation: Option A

**Reduced max-h + compact items + auto-scroll**

Best balance of impact vs effort. The 50vh cap leaves half the viewport for the 3D scene, compact items fit more milestones in less space, and auto-scroll ensures the user always sees the current mission phase.

**Key trade-off**: Slightly less content visible per scroll vs. not blocking the 3D scene.

---

## Specific Changes

### File: `src/hud/MissionEventsPanel.tsx`

1. **Line 102**: Change `max-h-[70vh]` to `max-h-[50vh] sm:max-h-[70vh]`

2. **Line 148**: Change milestone item padding `py-1.5` to `py-1 sm:py-1.5`

3. **Line 168**: Change milestone name font `text-xs` to `text-[11px] sm:text-xs`

4. **Add auto-scroll**: Use a ref on the current milestone item + `scrollIntoView` when panel opens

---

## Acceptance Criteria

- [ ] Mobile panel height ≤ 50% viewport
- [ ] Current milestone visible when panel opens (auto-scroll)
- [ ] Desktop layout unchanged (70vh, normal sizing)
- [ ] 3D scene visible behind panel (at least 50% viewport)
- [ ] Build passes

# Implementation Prompt: Mobile Hamburger Menu Compact View

**Blueprint Reference**: docs/blueprints/2026-04-05_0810_mobile_hamburger_menu.md
**Design Reference**: docs/design/2026-04-05_0800_mobile_hamburger_menu.md

## Context

The MissionEventsPanel dropdown on mobile fills 70% of the viewport with 19 milestones, leaving minimal space for the 3D scene. Reducing to 50vh with compact items and auto-scroll to the current milestone.

## Goal

Make the hamburger menu less intrusive on mobile while ensuring the current milestone is always visible.

## Requirements

1. `max-h-[70vh]` → `max-h-[50vh] sm:max-h-[70vh]`
2. Milestone padding: `py-1.5` → `py-1 sm:py-1.5`
3. Milestone font: `text-xs` → `text-[11px] sm:text-xs`
4. Auto-scroll to current milestone when panel opens

## Files Affected

- `src/hud/MissionEventsPanel.tsx` — single file, 4 changes

## Specific Changes

### 1. Line 102 — max-height
```tsx
max-h-[70vh] → max-h-[50vh] sm:max-h-[70vh]
```

### 2. Line 148 — milestone padding
```tsx
py-1.5 → py-1 sm:py-1.5
```

### 3. Line 168 — milestone font
```tsx
text-xs → text-[11px] sm:text-xs
```

### 4. Auto-scroll — add ref + useEffect
```tsx
const currentRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && currentRef.current) {
    currentRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}, [isOpen]);

// On current milestone div: ref={isCurrent ? currentRef : undefined}
```

## Constraints

- All sizing changes MUST use `sm:` prefix — mobile only
- Desktop (sm+) must remain unchanged
- Do NOT restructure the milestone list (no grouping/collapsing)

## Acceptance Criteria

- [ ] Mobile panel ≤ 50vh
- [ ] Current milestone centered on open (auto-scroll)
- [ ] Desktop unchanged (70vh, py-1.5, text-xs)
- [ ] Build passes

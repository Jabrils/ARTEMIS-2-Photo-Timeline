# Blueprint: Mobile Hamburger Menu Compact View

**Date**: 2026-04-05
**Design Reference**: docs/design/2026-04-05_0800_mobile_hamburger_menu.md

## Objective

Reduce the MissionEventsPanel dropdown's screen coverage on mobile from 70% to 50% of viewport, with compact milestone items and auto-scroll to the current milestone. Leaves half the viewport for the 3D scene.

## Requirements

1. Reduce `max-h` to 50vh on mobile, keep 70vh on desktop
2. Compact milestone items on mobile (tighter padding, smaller font)
3. Auto-scroll to current milestone when panel opens
4. Desktop layout unchanged

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Reduced max-h + compact + auto-scroll | Best effort/impact ratio (Option A from design) |
| Scroll behavior | `scrollIntoView({ block: 'center' })` | Centers current milestone in scroll area |
| Ref strategy | Callback ref on current milestone item | Avoids 19 refs — only the current item needs a ref |

## Scope

### In Scope
- MissionEventsPanel.tsx mobile sizing (max-h, padding, font)
- Auto-scroll to current milestone on panel open

### Out of Scope
- Collapsible phase sections (Option B — future enhancement)
- Bottom sheet pattern (Option C)
- Desktop layout changes

## Files Likely Affected

- `src/hud/MissionEventsPanel.tsx` — all changes in this single file

## Implementation Sequence

1. **CSS changes**: `max-h`, `py`, `text` responsive classes — no dependencies
2. **Auto-scroll ref**: Add `useRef` for current milestone element
3. **Auto-scroll effect**: `useEffect` that scrolls when `isOpen` becomes true

## Specific Changes

### Change 1: Line 102 — Responsive max-height

```tsx
// Before:
className="... max-h-[70vh] ..."

// After:
className="... max-h-[50vh] sm:max-h-[70vh] ..."
```

### Change 2: Line 148 — Compact milestone padding

```tsx
// Before:
className={`flex items-center gap-2 px-2 py-1.5 rounded ...`}

// After:
className={`flex items-center gap-2 px-2 py-1 sm:py-1.5 rounded ...`}
```

### Change 3: Line 168 — Compact milestone font

```tsx
// Before:
className={`flex-1 text-xs font-mono ...`}

// After:
className={`flex-1 text-[11px] sm:text-xs font-mono ...`}
```

### Change 4: Auto-scroll to current milestone

Add a ref for the current milestone and scroll into view when panel opens:

```tsx
const currentRef = useRef<HTMLDivElement>(null);

// In useEffect or after render:
useEffect(() => {
  if (isOpen && currentRef.current) {
    currentRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}, [isOpen]);

// On the current milestone div:
ref={isCurrent ? currentRef : undefined}
```

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| scrollIntoView jarring on fast open | Low | Low | Use `behavior: 'smooth'` |
| Compact items too small on small screens | Low | Low | 11px is above minimum readable size |

## Acceptance Criteria

- [ ] Mobile panel height ≤ 50% viewport (max-h-[50vh])
- [ ] Current milestone visible and centered when panel opens
- [ ] Desktop layout unchanged (70vh, py-1.5, text-xs)
- [ ] 3D scene visible behind panel (≥50% viewport on mobile)
- [ ] Build passes (`npm run build`)

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build`
- **Max iterations**: 3
- **Completion criteria**: Build passes, mobile panel ≤ 50vh
- **Invoke with**: `/wrought-implement`

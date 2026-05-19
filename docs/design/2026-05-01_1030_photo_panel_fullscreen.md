**2026-05-01 10:30 UTC**

# Design: PhotoPanel Fullscreen Toggle

**Mode**: from-scratch
**Finding**: F4 — PhotoPanel PIP image has no fullscreen toggle
**Tracker**: docs/findings/2026-04-30_1200_photo_navigation_FINDINGS_TRACKER.md

---

## Objective

Add a click-to-expand / click-to-collapse fullscreen toggle to `PhotoPanel.tsx`. Clicking the PIP image expands it to a full-viewport overlay; clicking anywhere on the overlay collapses it back to PIP.

---

## Current State

`PhotoPanel.tsx` renders a fixed `w-72 sm:w-80` PIP panel anchored `absolute left-4 top-14`. The `<img>` element has no `onClick`. The component already uses `AnimatePresence` + `motion.div` for the PIP fade-in/out.

---

## Design Decision

**Local `useState<boolean>` toggle with two render paths inside the existing `AnimatePresence` block.**

When `expanded` is `false`: render the existing PIP layout unchanged.
When `expanded` is `true`: render a `fixed inset-0` fullscreen overlay with a dark backdrop and the image centered and large.

### Rationale

- No store involvement — expanded state is purely local UI, nothing else in the app needs to know
- Reuses the existing `motion.div` animation infrastructure already in the file
- Single file, ~25 lines of new code
- Clicking the image toggles `expanded`; clicking the backdrop (fixed inset div behind the image) also collapses

### Fullscreen Overlay Layout

```
fixed inset-0 z-[var(--z-modal)]  ← full viewport, above HUD
  ├── backdrop div: fixed inset-0 bg-black/70 cursor-pointer  ← click-to-dismiss
  └── motion.div: absolute centered, max-w-[90vw] max-h-[90vh]
        └── img: w-full h-full object-contain
        └── caption row (same as PIP)
```

Use `--z-modal` (or `--z-tooltip: 55` if modal var doesn't exist — check `index.css`). The backdrop click calls `setExpanded(false)`. The image click calls `e.stopPropagation()` so backdrop click doesn't fire when clicking the image itself in fullscreen — though toggling on image click in fullscreen is also fine UX.

### Animation

Animate the fullscreen overlay in with `initial={{ opacity: 0, scale: 0.95 }}` and `animate={{ opacity: 1, scale: 1 }}` for a smooth expand feel.

### PIP Expand Affordance

Add a small expand icon (↗ or ⛶) overlaid on the PIP image (absolute top-right corner, appears on hover) so the user knows it's clickable. `cursor-pointer` on the image is also sufficient.

---

## Scope

### In Scope
- `src/hud/PhotoPanel.tsx` — only file affected

### Out of Scope
- No store changes
- No HUD.tsx changes
- No CSS/variable changes (reuse existing z-index vars)

---

## Files Affected

| File | Change |
|------|--------|
| `src/hud/PhotoPanel.tsx` | Add `expanded` state; split render into PIP / fullscreen paths; add backdrop + expand icon |

---

## Implementation Sequence

1. Add `useState` import (already present via React — check; if not, add)
2. Add `const [expanded, setExpanded] = useState(false);`
3. Check `src/index.css` for available z-index variables (--z-modal or highest available)
4. In the PIP `motion.div`: add `cursor-pointer` to `<img>`, add `onClick={() => setExpanded(true)}`, add a small expand indicator (top-right absolute overlay icon, opacity-0 group-hover:opacity-100)
5. After (or wrapping) the PIP block, add a second `AnimatePresence` + `motion.div` for the fullscreen overlay, rendered when `expanded` is true
6. Fullscreen overlay: fixed inset backdrop div + centered image + same caption row + `onClick` on backdrop to close

---

## Acceptance Criteria

- [ ] Clicking the PIP image expands it to fullscreen overlay
- [ ] Clicking the backdrop (outside the image) in fullscreen collapses back to PIP
- [ ] Expand/collapse is animated
- [ ] PIP image shows a hover affordance indicating it is clickable
- [ ] `npm run build` passes with no errors

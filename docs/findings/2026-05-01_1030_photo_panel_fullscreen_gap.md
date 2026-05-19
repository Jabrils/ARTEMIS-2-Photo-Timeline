**2026-05-01 10:30 UTC**

# Finding: PhotoPanel Has No Fullscreen Toggle

**Type**: Gap
**Severity**: Low
**File**: `src/hud/PhotoPanel.tsx`

---

## What Was Found

`PhotoPanel.tsx` renders a fixed-size PIP (picture-in-picture) overlay in the top-left of the viewport (`w-72 sm:w-80`, `absolute left-4 top-14`). There is no mechanism to expand the image to fullscreen or return it to PIP size. The `<img>` element at line 33 has no `onClick` handler.

## Scope

- `src/hud/PhotoPanel.tsx` — only file affected
  - `<img>` element (line 33) — missing `onClick` handler
  - Missing: expanded/fullscreen state (local `useState<boolean>`)
  - Missing: fullscreen overlay variant (fixed inset, higher z-index, larger image)
  - Missing: click-to-dismiss / click-to-shrink on the expanded view

## Preliminary Assessment

Straightforward local state addition. Add `const [expanded, setExpanded] = useState(false)` to the component. When `expanded` is false, render the existing PIP layout. When `expanded` is true, render a fixed full-viewport overlay with the image centered and full-size. Clicking the image in either state toggles `expanded`.

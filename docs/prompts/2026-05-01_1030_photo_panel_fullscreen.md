# Implementation Prompt: PhotoPanel Fullscreen Toggle

**Blueprint Reference**: docs/blueprints/2026-05-01_1030_photo_panel_fullscreen.md
**Design Reference**: docs/design/2026-05-01_1030_photo_panel_fullscreen.md
**Finding**: F4

## Context

`PhotoPanel.tsx` renders a fixed-size PIP overlay (top-left, `w-72 sm:w-80`). The image has no click handler. The user wants to click the image to expand it fullscreen and click again (or the backdrop) to return to PIP.

## Goal

Add a fullscreen toggle to `src/hud/PhotoPanel.tsx`. Single file change only.

## Requirements

1. Add `useState` to imports; add `const [expanded, setExpanded] = useState(false)`
2. PIP `<img>` wrapped in a `<div className="relative group">` with a hover expand icon (SVG arrows-out, top-right, opacity-0 group-hover:opacity-100)
3. Clicking PIP image sets `expanded(true)`
4. When `expanded && activePhoto`: render a fixed inset fullscreen overlay — dark backdrop div + centered motion.div with the image and caption
5. Backdrop click → `setExpanded(false)`. Image click in fullscreen → `setExpanded(false)`
6. Fullscreen overlay z-index: backdrop `z-[60]`, image container `z-[61]`
7. Animate fullscreen in/out with `opacity` + `scale` via existing `motion` + `AnimatePresence`

## Files Likely Affected

- `src/hud/PhotoPanel.tsx` — only file

## Key Code (blueprint excerpt)

**PIP image wrapper** (replace bare `<img>` with):
```tsx
<div className="relative group cursor-pointer" onClick={() => setExpanded(true)}>
  <img src={activePhoto.photo} alt={stem} className="w-full object-cover" />
  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  </div>
</div>
```

**Fullscreen overlay** (add after the PIP `AnimatePresence` block):
```tsx
<AnimatePresence>
  {expanded && activePhoto && (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70 cursor-pointer" onClick={() => setExpanded(false)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-[61] flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto max-w-[90vw] max-h-[90vh] flex flex-col">
          <img
            src={activePhoto.photo}
            alt={stem}
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-[rgba(0,212,255,0.3)] cursor-pointer"
            onClick={() => setExpanded(false)}
          />
          <div className="flex items-center justify-between px-3 py-1.5 bg-[rgba(10,10,30,0.85)] rounded-b-lg border-x border-b border-[rgba(0,212,255,0.3)]">
            <span className="text-[10px] font-mono text-gray-400 truncate pr-2">{stem}</span>
            <span className="text-[10px] font-mono text-[#00d4ff]/70 whitespace-nowrap">T+{activePhoto.missionElapsedHours}h</span>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

## Constraints

- Only `src/hud/PhotoPanel.tsx` should change
- Do not add new CSS variables or modify `index.css`

## Acceptance Criteria

- [ ] Clicking PIP image expands to fullscreen with animation
- [ ] Hover affordance (expand icon) visible on PIP image hover
- [ ] Clicking backdrop or fullscreen image collapses back to PIP
- [ ] `npm run build` passes

---

## Plan Output Instructions

1. Call `EnterPlanMode`
2. Read `src/hud/PhotoPanel.tsx` to confirm current structure
3. Write plan to `docs/plans/2026-05-01_1030_photo_panel_fullscreen.md`
4. Call `ExitPlanMode` for user approval
5. After approval, invoke `/wrought-implement`

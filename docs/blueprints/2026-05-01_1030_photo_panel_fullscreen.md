# Blueprint: PhotoPanel Fullscreen Toggle

**Date**: 2026-05-01
**Design Reference**: docs/design/2026-05-01_1030_photo_panel_fullscreen.md
**Finding**: F4

## Objective

Add click-to-expand / click-to-collapse fullscreen toggle to `PhotoPanel.tsx`. PIP image click → fullscreen overlay. Backdrop or image click → collapse back to PIP.

## Requirements

1. Add `const [expanded, setExpanded] = useState(false)` local state
2. PIP image gets `cursor-pointer` and `onClick={() => setExpanded(true)}`
3. PIP image gets a hover expand affordance (small ↗ icon, top-right corner, opacity-0 group-hover:opacity-100)
4. When `expanded` is true: render a fixed inset fullscreen overlay above all HUD elements
5. Fullscreen overlay: dark backdrop (`bg-black/70`) + centered image (`max-w-[90vw] max-h-[90vh] object-contain`)
6. Clicking the backdrop collapses (`setExpanded(false)`)
7. Fullscreen overlay animates in with `opacity + scale` via Framer Motion
8. Caption row (filename stem + T+hours) shown below image in both PIP and fullscreen

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State location | Local `useState` | Purely local UI — no other component needs this |
| Z-index | `z-[60]` inline | No `--z-modal` var exists; 60 > tooltip (55) = above everything |
| Backdrop click | Separate div behind image | Clean separation: backdrop closes, image click stops propagation in fullscreen (or also closes) |
| Animation | `motion.div` scale + opacity | Consistent with existing PIP fade animation |
| Expand icon | Absolute positioned span, group-hover reveal | Low-noise affordance that doesn't clutter the PIP |

## Scope

### In Scope
- `src/hud/PhotoPanel.tsx` — only file

### Out of Scope
- No CSS variable additions
- No store changes
- No other components

## Files Likely Affected

- `src/hud/PhotoPanel.tsx` — add expanded state, two render paths, fullscreen overlay

## Implementation Sequence

1. Add `useState` to the React import (it's already imported — `useMemo` is there, add `useState`)
2. Add `const [expanded, setExpanded] = useState(false);` after the `activePhoto` useMemo
3. Wrap the PIP `<img>` in a `<div className="relative group">`, add expand icon overlay:
   ```tsx
   <div className="relative group cursor-pointer" onClick={() => setExpanded(true)}>
     <img src={...} alt={...} className="w-full object-cover" />
     <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5">
       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
         <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
       </svg>
     </div>
   </div>
   ```
4. Add a second `AnimatePresence` block after the PIP block (outside the PIP `AnimatePresence`) for the fullscreen overlay:
   ```tsx
   <AnimatePresence>
     {expanded && activePhoto && (
       <>
         {/* Backdrop */}
         <div
           className="fixed inset-0 z-[60] bg-black/70 cursor-pointer"
           onClick={() => setExpanded(false)}
         />
         {/* Image */}
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

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `useState` not in React import | Low | Low | Add it alongside `useMemo` |
| Fullscreen overlay blocks HUD clicks | Low | Low | Use `pointer-events-none` on motion.div, `pointer-events-auto` on image container |
| `expanded` persists after `activePhoto` becomes null | Low | Low | Render condition checks `expanded && activePhoto` |

## Acceptance Criteria

- [ ] Clicking the PIP image expands to fullscreen
- [ ] A hover icon on PIP image signals it's clickable
- [ ] Clicking anywhere (backdrop or image) in fullscreen returns to PIP
- [ ] Expand/collapse is animated
- [ ] `npm run build` passes with no errors

## Debug Strategy

- **Verifier**: `npm run build`
- **Max iterations**: 5
- **Invoke with**: `/wrought-implement`

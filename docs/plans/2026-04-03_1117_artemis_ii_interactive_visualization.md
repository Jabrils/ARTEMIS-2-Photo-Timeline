# Implementation Plan: Artemis II Interactive Visualization

**Finding**: F1 in `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md`
**Blueprint**: `docs/blueprints/2026-04-03_1117_artemis_ii_interactive_visualization.md`
**Prompt**: `docs/prompts/2026-04-03_1117_artemis_ii_interactive_visualization.md`

## Context

ARTEMIS is a greenfield project. No code exists. The Artemis II mission launched April 1, 2026 and has ~7 days remaining. We need to build and deploy an interactive 3D mission tracker consuming live NASA data (OEM ephemeris, DSN XML, JPL Horizons) with an AI chatbot (Gemini Flash, system prompt approach). Time is the dominant constraint.

## Corrections to Blueprint (from plan analysis)

| Issue | Blueprint Says | Correction |
|-------|---------------|------------|
| `tailwind.config.ts` | Listed as file to create | **Remove** — Tailwind v4 uses CSS-only config (`@theme` in `index.css`) |
| Phase 4 order | Scene.tsx created last | **Scene.tsx shell FIRST** in Phase 4 (Canvas needed to test child components) |
| `useSpacecraft` | Listed in `src/hooks/` | **Must run inside `<Canvas>`** — create a `DataDriver.tsx` component inside Scene |
| `api/chat.ts` imports | Implies import from `src/data/artemis-knowledge.ts` | **Cannot import `src/` from `api/`** — inline system prompt in `api/chat.ts` |
| Dependencies | Missing `@vercel/node` | **Add as devDependency** for serverless function types |
| Gemini API | Implies streaming | **Use non-streaming** `generateContent` for MVP (1-3s responses are fine for FAQ) |
| Textures | No acquisition step | **Add download step** before Phase 4 |
| Gemini roles | Not specified | Uses `"role": "model"` not `"assistant"`; system prompt goes in `system_instruction` field |
| OEM parser | Simple parse | Must handle **multiple META_START/META_STOP segments** and epoch format variations |

## Implementation Sequence (8 phases, ~47 files)

### Phase 1: Project Scaffold
1. `npm create vite@latest artemis-tracker -- --template react-ts`
2. Install: three, @react-three/fiber, @react-three/drei, zustand, framer-motion, @types/three, @tailwindcss/vite, vitest, @vercel/node
3. `vite.config.ts` — React plugin, Tailwind v4 plugin, Vitest, manual chunks for Three.js
4. `src/index.css` — `@import "tailwindcss"` + `@theme` (space colors, mono font)
5. `src/App.tsx`, `src/main.tsx`, `index.html`, `.gitignore`, `.env.example`

### Phase 2: Data Pipeline
6. `src/data/mission-config.ts` — launch epoch, crew, milestones
7. `src/data/oem-parser.ts` + `tests/oem-parser.test.ts` — CCSDS OEM parser
8. `src/data/interpolator.ts` + `tests/interpolator.test.ts` — Lagrange degree-8
9. `src/data/dsn-parser.ts` — DOMParser XML parsing

### Phase 3: Store + Hooks
10. `src/store/mission-store.ts` — Zustand store
11. `src/hooks/useOEM.ts` — fetch OEM + moon position, parse, poll
12. `src/hooks/useDSN.ts` — fetch DSN XML, parse, poll
13. `src/hooks/useMission.ts` — elapsed time, phase, progress

### Phase 4: Vercel API Routes
14. `vercel.json` — SPA fallback rewrite
15. `api/oem.ts`, `api/dsn.ts`, `api/horizons.ts`, `api/donki.ts`, `api/chat.ts`

### Phase 5: 3D Scene
16. Download textures: earth-day.jpg, moon.jpg, favicon.svg
17. `src/components/Scene.tsx` — Canvas shell (CREATE FIRST)
18. `src/components/DataDriver.tsx` — useFrame interpolation (renders null)
19. `src/components/Stars.tsx`, `Earth.tsx`, `Moon.tsx`, `Trajectory.tsx`, `Spacecraft.tsx`, `CameraController.tsx`

### Phase 6: HUD Overlay
20. `src/hud/TelemetryCard.tsx`, `MissionClock.tsx`, `ProgressBar.tsx`, `DSNStatus.tsx`, `CameraControls.tsx`, `HUD.tsx`

### Phase 7: AI Chatbot
21. `src/data/artemis-knowledge.ts` — quick-answer Q&A pairs
22. `src/hooks/useChat.ts` — message history, send, quick-answer resolution
23. `src/chat/ChatMessage.tsx`, `QuickAnswers.tsx`, `ChatPanel.tsx`

### Phase 8: Integration & Deploy
24. Wire App.tsx — Scene + HUD + ChatPanel + hooks + loading screen
25. Cross-validation logging, final build, deploy to Vercel

## Verification

1. `npm run test` — OEM parser + interpolator tests pass
2. `npm run build` — no TS errors
3. Visual check — 3D scene, HUD, chat all functional
4. API check — all 5 endpoints return valid data
5. Accuracy — within 5% of NASA AROW values
6. Chatbot — quick answers instant, free-text accurate, refuses unknown topics

## Key Gotchas

- `useFrame` only inside `<Canvas>` children — use DataDriver.tsx
- `api/` can't import `src/` — inline system prompt in `api/chat.ts`
- Tailwind v4: no config file, use `@theme` in CSS
- Gemini: `"role": "model"`, `system_instruction` top-level field
- Vercel for Vite: `VercelRequest/VercelResponse` from `@vercel/node`
- Three.js manual chunks prevent 1MB+ bundle

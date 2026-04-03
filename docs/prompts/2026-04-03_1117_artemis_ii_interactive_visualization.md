# Implementation Prompt: Artemis II Interactive Visualization

**Blueprint Reference**: docs/blueprints/2026-04-03_1117_artemis_ii_interactive_visualization.md
**Design Reference**: docs/design/2026-04-03_1100_artemis_ii_interactive_visualization.md
**Research Reference**: docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md

## Context

The ARTEMIS project needs a greenfield interactive 3D web visualization of the Artemis II lunar flyby mission. Artemis II launched on April 1, 2026 and is currently on Day 3 of a ~10-day lunar flyby. NASA does not provide a unified telemetry API, but three machine-readable data sources exist: OEM ephemeris files (trajectory state vectors), DSN Now XML (real-time antenna communications), and JPL Horizons API (planetary ephemeris). The visualization must be built and deployed within the mission's remaining ~7-day flight window.

A design analysis evaluated four architecture options and selected **Vite + React + React Three Fiber on Vercel** as the optimal approach, scoring 8.6/10 across weighted priorities (speed to ship, visual wow-factor, technical accuracy, code quality).

## Goal

Implement the MVP of an interactive Artemis II mission tracker:
- 3D scene with Earth, Moon, Orion spacecraft marker, and trajectory line
- Real-time telemetry HUD showing Speed (km/h), Earth Distance (km), Moon Distance (km), Mission Elapsed Time, Progress %
- OEM ephemeris parser + Lagrange interpolation for accurate spacecraft positioning
- Vercel serverless API proxies for NASA data sources
- Interactive camera controls (rotate, zoom, pan)
- AI mission chatbot: floating chat panel with quick-answer buttons (client-side) and free-text questions via Gemini 2.5 Flash (system prompt stuffed with mission facts)

## Requirements

1. Scaffold Vite + React 19 + TypeScript project with Tailwind CSS 4
2. Create 4 Vercel serverless API proxy functions (OEM, DSN, Horizons, DONKI)
3. Implement CCSDS OEM parser: text -> StateVector[] with typed output
4. Implement degree-8 Lagrange interpolation for position + velocity at arbitrary epoch
5. Implement DSN XML parser using DOMParser
6. Build 3D scene with React Three Fiber: Earth (textured), Moon (textured, Horizons-positioned), Orion (glowing marker), trajectory (past=orange solid, future=cyan dashed), stars
7. Build HUD overlay with Framer Motion animated counters: Speed, Earth Dist, Moon Dist, MET, Progress
8. Wire data pipeline: useOEM (5-min poll) -> Zustand store -> useSpacecraft (per-frame interpolation) -> 3D + HUD
9. Add OrbitControls camera navigation
10. Configure Vercel deployment (vercel.json, env vars)
11. Write unit tests for OEM parser and Lagrange interpolator (Vitest)
12. Cross-validate displayed values against NASA AROW (within 5%)
13. Create Artemis II knowledge base file (~2-4K tokens of mission facts + 10-15 quick-answer Q&A pairs)
14. Create `/api/chat` serverless function: proxy to Gemini 2.5 Flash with system prompt, stream response
15. Build chat UI: floating toggle button, slide-in panel, message list, quick-answer buttons, text input
16. Create `useChat` hook: message history, send/receive, quick-answer client-side resolution

## Files to Create

### Config & Root (~8 files)
- `package.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `.env.example`, `.gitignore`, `index.html`, `tailwind.config.ts`

### Vercel API Routes (5 files)
- `api/oem.ts`, `api/dsn.ts`, `api/horizons.ts`, `api/donki.ts`, `api/chat.ts`

### Data Layer (5 files)
- `src/data/oem-parser.ts`, `src/data/interpolator.ts`, `src/data/dsn-parser.ts`, `src/data/mission-config.ts`, `src/data/artemis-knowledge.ts`

### Hooks (5 files)
- `src/hooks/useOEM.ts`, `src/hooks/useDSN.ts`, `src/hooks/useSpacecraft.ts`, `src/hooks/useMission.ts`, `src/hooks/useChat.ts`

### Store (1 file)
- `src/store/mission-store.ts`

### 3D Components (7 files)
- `src/components/Scene.tsx`, `src/components/Earth.tsx`, `src/components/Moon.tsx`, `src/components/Spacecraft.tsx`, `src/components/Trajectory.tsx`, `src/components/Stars.tsx`, `src/components/CameraController.tsx`

### HUD Components (6 files)
- `src/hud/HUD.tsx`, `src/hud/TelemetryCard.tsx`, `src/hud/MissionClock.tsx`, `src/hud/ProgressBar.tsx`, `src/hud/DSNStatus.tsx`, `src/hud/CameraControls.tsx`

### App (3 files)
- `src/main.tsx`, `src/App.tsx`, `src/index.css`

### Tests (2 files)
- `tests/oem-parser.test.ts`, `tests/interpolator.test.ts`

### Chatbot (3 files)
- `src/chat/ChatPanel.tsx`, `src/chat/ChatMessage.tsx`, `src/chat/QuickAnswers.tsx`

### Public Assets (3+ files)
- `public/textures/earth-day.jpg`, `public/textures/moon.jpg`, `public/favicon.svg`

**Total: ~48 files**

## Implementation Sequence

### Phase 1: Project Foundation
1. Scaffold Vite + React + TS project
2. Install dependencies: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, framer-motion, zustand, vitest
3. Configure Tailwind CSS 4
4. Create mission-config.ts with launch epoch, crew, milestones
5. Create Zustand store skeleton
6. Create App.tsx shell

### Phase 2: Data Pipeline
7. Implement OEM parser + unit tests
8. Implement Lagrange interpolator + unit tests
9. Implement DSN XML parser
10. Create all 4 Vercel API proxy functions

### Phase 3: Data Hooks
11. Implement useOEM (fetch, parse, poll)
12. Implement useDSN (fetch, parse, poll)
13. Implement useSpacecraft (interpolate, derive metrics)
14. Implement useMission (elapsed time, phase, progress)

### Phase 4: 3D Scene
15. Stars background
16. Earth (textured sphere + lighting)
17. Moon (textured, positioned)
18. Trajectory line (split past/future)
19. Spacecraft marker (glowing, labeled)
20. Camera controller (OrbitControls)
21. Scene composition (Canvas + Suspense)

### Phase 5: HUD Overlay
22. TelemetryCard (animated counter)
23. MissionClock (live MET)
24. ProgressBar
25. DSNStatus
26. CameraControls buttons
27. HUD composition

### Phase 6: AI Mission Chatbot
28. Create artemis-knowledge.ts (system prompt + quick-answer Q&A pairs)
29. Create api/chat.ts (Gemini 2.5 Flash proxy with system prompt)
30. Create useChat hook (message history, send/receive, quick-answer resolution)
31. Create ChatMessage.tsx + QuickAnswers.tsx + ChatPanel.tsx

### Phase 7: Integration
32. Wire App.tsx (Scene + HUD + ChatPanel + hooks)
33. Loading screen
34. Cross-validation logging
35. Vercel deployment config

### Phase 8: Test & Deploy
36. Run unit tests
37. Manual AROW comparison
38. Test chatbot (quick answers + free-text + hallucination guard)
39. Deploy to Vercel

## Constraints

- Time-critical: MVP must ship within 1-2 days
- $0 budget: Vercel free tier, NASA free APIs, Gemini Flash free tier (1,000 RPD)
- Textures: NASA public domain only (download Blue Marble 2K, CGI Moon Kit)
- Accuracy: Displayed values within 5% of NASA AROW
- Bundle: Initial JS < 500KB gzipped
- Browsers: Latest 2 versions of Chrome, Firefox, Safari, Edge with WebGL2

## Key Technical Details

### OEM File Format
```
CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-04-02T...
ORIGINATOR = JSC
META_START
OBJECT_NAME = ORION
REF_FRAME = EME2000
TIME_SYSTEM = UTC
INTERPOLATION = LAGRANGE
INTERPOLATION_DEGREE = 8
META_STOP
2026-04-01T22:35:00.000  X  Y  Z  VX  VY  VZ
...
```
Each data line: ISO timestamp + 6 space-separated floats (km, km/s).

### Lagrange Interpolation
For target epoch t, find nearest 9 data points (degree 8). For each component (x, y, z, vx, vy, vz):
```
L(t) = sum(i=0..n) yi * product(j=0..n, j!=i) (t - tj) / (ti - tj)
```

### Coordinate Scaling
OEM positions are in km, Earth-centered J2000. For the 3D scene:
- Scale: divide by 10,000 (1 Three.js unit = 10,000 km)
- Earth radius: ~0.637 units
- Moon distance: ~38.4 units
- This keeps the scene within comfortable camera range

### DSN XML Structure
```xml
<dsn>
  <station name="gdscc" friendly="Goldstone">
    <dish name="DSS-14" azimuth="..." elevation="...">
      <target name="ORION" id="..." uplegRange="..." downlegRange="..." rtlt="..."/>
    </dish>
  </station>
</dsn>
```

### Chatbot Architecture
```
User clicks chat icon (bottom-right)
    |
    v
ChatPanel.tsx (slide-in panel)
    |-- QuickAnswers.tsx: clickable pill buttons
    |   -> Resolves from artemis-knowledge.ts (client-side, instant, no API)
    |-- Free-text input
            |
            v
        /api/chat (Vercel serverless function)
            |-- System prompt: ~2-4K tokens of Artemis II facts
            |-- User message + conversation history appended
            |-- Call Gemini 2.5 Flash (free tier)
            |   Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
            |   Auth: x-goog-api-key header (from GEMINI_API_KEY env var)
            |
            v
        Response streamed back to ChatPanel
```

### System Prompt Structure
```
You are ARTEMIS AI, an expert assistant for the Artemis II mission tracker.

MISSION FACTS:
- Launch: April 1, 2026, 6:35 PM EDT from LC-39B, Kennedy Space Center
- Duration: ~10 days (return ~April 10-11, 2026)
- Crew: Reid Wiseman (Commander), Victor Glover (Pilot),
  Christina Koch (Mission Specialist), Jeremy Hansen (CSA, Mission Specialist)
- Vehicle: Orion spacecraft atop SLS Block 1
- Objective: First crewed Artemis mission; test Orion life support; lunar flyby
- Trajectory: Earth orbit -> TLI -> lunar flyby (~8,900 km above far side) -> free return -> Pacific splashdown
- Record: Will surpass Apollo 13's record for farthest humans from Earth
[... additional facts ...]

RULES:
- Answer ONLY from the facts above and general publicly known space knowledge
- If you don't know, say "I don't have that specific information"
- Keep answers concise (2-4 sentences)
- Be enthusiastic about space exploration
- Never speculate about mission anomalies or safety
```

### Quick-Answer Buttons (client-side, no API)
Pre-written Q&A pairs in artemis-knowledge.ts:
- "Who are the crew?" / "How long is the mission?" / "What is Orion?"
- "What's the trajectory?" / "When did it launch?" / "What records will it break?"
- "What is SLS?" / "What is the Artemis program?" / "How far from Earth?"
- "What is TLI?" / "When does it return?" / "Who built the spacecraft?"

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds without errors or TS errors
- [ ] `npm run test` — all unit tests pass
- [ ] OEM parser correctly parses real Artemis II OEM data
- [ ] Lagrange interpolator error < 0.001 km at known data points
- [ ] 3D scene renders Earth, Moon, Orion, trajectory, stars
- [ ] Textures are visible on Earth and Moon
- [ ] Orion position updates based on interpolated OEM data
- [ ] HUD shows Speed, Earth Distance, Moon Distance, MET
- [ ] Numbers animate smoothly (no jarring jumps)
- [ ] Camera can be rotated, zoomed, panned
- [ ] API proxies return valid data
- [ ] Displayed metrics within 5% of NASA AROW values
- [ ] Deploys successfully to Vercel
- [ ] No console errors in production
- [ ] Chat toggle button opens/closes chat panel
- [ ] Quick-answer buttons resolve instantly client-side
- [ ] Free-text questions return relevant answers from Gemini API
- [ ] Chatbot refuses to speculate on unknown topics
- [ ] Gemini API key not exposed in client bundle

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode (compresses context and enables read-only exploration)
2. Explore the codebase and design your implementation approach using read-only tools (Read, Grep, Glob)
3. Write the plan to `docs/plans/2026-04-03_1117_artemis_ii_interactive_visualization.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop with test verification.

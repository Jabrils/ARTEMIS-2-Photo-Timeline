# Blueprint: Artemis II Interactive Visualization

**Date**: 2026-04-03
**Design Reference**: docs/design/2026-04-03_1100_artemis_ii_interactive_visualization.md
**Research Reference**: User-provided NASA API research (session context); docs/research/2026-04-03_1230_artemis_ii_chatbot_approaches.md

## Objective

Build a greenfield interactive 3D web visualization of the Artemis II lunar flyby mission using Vite + React + React Three Fiber, deployed on Vercel. The app consumes NASA OEM ephemeris files, DSN Now XML, and JPL Horizons API to display real-time spacecraft telemetry (velocity, Earth/Moon distances, mission elapsed time) in an animated HUD overlay atop an interactive 3D Earth-Moon-Orion scene. An AI-powered chatbot allows users to ask questions about the mission, using a system-prompt-stuffed LLM (Gemini 2.5 Flash free tier) with quick-answer buttons for common questions. The visualization must surpass existing passive YouTube overlay trackers in interactivity, visual quality, and accuracy.

## Requirements

### MVP (Sprint 1 — Ship in ~1-2 days)
1. **Project scaffold**: Vite + React 19 + TypeScript + Tailwind CSS 4, configured for Vercel deployment
2. **Vercel serverless API proxies**: `/api/oem` (OEM file), `/api/dsn` (DSN XML), `/api/horizons` (JPL Horizons) with CORS headers and response caching
3. **OEM parser**: Parse CCSDS OEM text files into typed state vector arrays `[{ epoch, x, y, z, vx, vy, vz }]`
4. **Lagrange interpolator**: Degree-8 interpolation across nearest 9 state vectors to compute position/velocity at arbitrary UTC epoch
5. **3D scene**: Earth (textured sphere), Moon (textured, positioned from Horizons data), Orion (glowing marker at interpolated position), trajectory line (OEM path, past=solid orange, future=dashed cyan), star field background
6. **HUD overlay**: Speed (km/h), Distance from Earth (km), Distance to Moon (km), Mission Elapsed Time (M+ DD:HH:MM:SS), Mission Progress (%)
7. **Camera controls**: OrbitControls for free navigation (rotate, zoom, pan)
8. **Data accuracy**: Cross-validate interpolated positions against DSN range measurements; show "last updated" timestamps
9. **Loading state**: Loading screen while OEM data is fetched and parsed
10. **AI Mission Chatbot**: Floating chat panel powered by Gemini 2.5 Flash (free tier, 1,000 RPD) via `/api/chat` serverless function. System prompt stuffed with ~2,000-4,000 tokens of Artemis II mission facts (crew, timeline, objectives, spacecraft, milestones). Quick-answer buttons for 10-15 common questions resolve client-side without API call. Model instructed to answer only from provided facts, refuse speculation, and say "I don't have that information" when unsure.

### Post-MVP (Sprint 2 — Days 3-7)
10. DSN antenna status indicators (which dishes are talking to Orion)
11. Camera presets (Follow Orion, Earth View, Moon View, Free Orbit)
12. Bloom/glow postprocessing effects
13. Earth atmosphere shader + day/night terminator
14. Crew activity timeline
15. Space weather alerts (DONKI integration)
16. Mobile responsive layout
17. Mission branding and polish

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Vite + React (SPA) | Fastest DX for client-side visualization; no SSR needed |
| 3D Engine | React Three Fiber + drei | Component model for Three.js; mature ecosystem (OrbitControls, Html, effects) |
| State management | Zustand | Lightweight, works outside React tree (3D render loop access) |
| HUD animation | Framer Motion | Spring-physics animated counters; smooth number transitions |
| Styling | Tailwind CSS 4 | Rapid HUD layout; utility-first; small bundle |
| API proxy | Vercel Serverless Functions | Free tier; solves CORS; edge caching built in |
| Primary data | OEM ephemeris files | Most authoritative public trajectory source; 4-min intervals |
| Interpolation | Lagrange degree 8 | Matches OEM INTERPOLATION_DEGREE metadata; proven accuracy |
| Moon position | JPL Horizons API | Authoritative; command='301', Earth-centered vectors |
| Coordinate system | J2000/EME2000, Earth-centered | Matches OEM REF_FRAME; Earth at origin; scale 1 unit = 10,000 km |
| Chatbot approach | System prompt + LLM API | Entire knowledge base is ~2-4K tokens; fits in one prompt; RAG is overkill |
| Chatbot LLM provider | Google Gemini 2.5 Flash | Genuinely free (15 RPM, 1,000 RPD, no CC); sufficient quality for FAQ Q&A |
| Chatbot fallback | Client-side quick-answer buttons | Instant responses for common questions; no API call needed; $0 cost |

## Scope

### In Scope
- Complete Vite + React + R3F project scaffold with TypeScript
- 5 Vercel serverless API functions (OEM, DSN, Horizons, DONKI, Chat)
- CCSDS OEM parser (KVN format, version 1.0 and 2.0)
- Lagrange interpolation engine (degree 8)
- DSN XML parser (DOMParser-based)
- 3D scene: Earth, Moon, Orion marker, trajectory line, stars, lighting
- HUD: 5 telemetry metrics + DSN status + camera controls
- AI chatbot: system prompt + Gemini Flash API + quick-answer buttons
- OrbitControls camera navigation
- Vercel deployment configuration
- Unit tests for OEM parser and Lagrange interpolator

### Out of Scope
- RAG pipeline (vector DB, embeddings, chunking — overkill for ~2-4K token knowledge base)
- Fine-tuning an LLM on Artemis II data
- User authentication or accounts
- Database or persistent storage
- Full numerical orbital propagation (Runge-Kutta, multi-body gravity solver)
- 3D Orion spacecraft model (using glowing marker instead)
- Historical mission replay/scrubbing
- Push notifications
- Native mobile app
- Accessibility (WCAG) beyond basic keyboard navigation
- i18n/localization

## Files to Create

### Project Root
- `package.json` — Dependencies and scripts
- `tsconfig.json` — TypeScript configuration
- `vite.config.ts` — Vite + React plugin config
- `tailwind.config.ts` — Tailwind CSS 4 config (if needed; v4 may use CSS-only config)
- `vercel.json` — API route rewrites, caching headers
- `.env.example` — NASA_API_KEY and GEMINI_API_KEY placeholders
- `.gitignore` — Node, Vite, env exclusions
- `index.html` — Vite entry HTML

### Vercel API Routes (`api/`)
- `api/dsn.ts` — Fetch `eyes.nasa.gov/apps/dsn-now/dsn.xml`, return with CORS headers
- `api/oem.ts` — Fetch latest OEM file from NASA, return raw text with CORS + cache headers
- `api/horizons.ts` — Proxy JPL Horizons API requests, return JSON
- `api/donki.ts` — Proxy api.nasa.gov DONKI endpoints, return JSON
- `api/chat.ts` — Proxy chat messages to Gemini 2.5 Flash with Artemis II system prompt; stream response back

### Source (`src/`)
- `src/main.tsx` — React entry point, mount App
- `src/App.tsx` — Root layout: Canvas + HUD overlay
- `src/index.css` — Tailwind directives + custom dark theme styles

### Data Layer (`src/data/`)
- `src/data/oem-parser.ts` — Parse CCSDS OEM text into typed StateVector[]
- `src/data/interpolator.ts` — Lagrange interpolation (degree 8) for position + velocity
- `src/data/dsn-parser.ts` — Parse DSN XML into typed DsnStation[] and DsnTarget[]
- `src/data/mission-config.ts` — Launch epoch, crew names, mission milestones, phase timeline
- `src/data/artemis-knowledge.ts` — System prompt content: all Artemis II mission facts (~2-4K tokens) + quick-answer Q&A pairs

### Hooks (`src/hooks/`)
- `src/hooks/useOEM.ts` — Fetch /api/oem, parse, store in Zustand, poll every 5 min
- `src/hooks/useDSN.ts` — Fetch /api/dsn, parse XML, poll every 30 sec
- `src/hooks/useSpacecraft.ts` — Derive speed, earthDist, moonDist from interpolated state
- `src/hooks/useMission.ts` — Compute mission elapsed time, current phase, progress %
- `src/hooks/useChat.ts` — Chat state management: message history, send message, streaming response, quick-answer resolution

### Store (`src/store/`)
- `src/store/mission-store.ts` — Zustand store: OEM data, DSN data, current spacecraft state, camera mode, chat state

### 3D Components (`src/components/`)
- `src/components/Scene.tsx` — R3F Canvas, Suspense, scene composition
- `src/components/Earth.tsx` — Textured sphere + atmosphere glow
- `src/components/Moon.tsx` — Textured sphere, positioned from store
- `src/components/Spacecraft.tsx` — Orion glowing marker + Html label
- `src/components/Trajectory.tsx` — Line from OEM vectors, past/future coloring
- `src/components/Stars.tsx` — Points geometry star field
- `src/components/CameraController.tsx` — OrbitControls + preset camera positions

### HUD Components (`src/hud/`)
- `src/hud/HUD.tsx` — Overlay container (absolute positioned over canvas)
- `src/hud/TelemetryCard.tsx` — Animated number counter card (speed, distance)
- `src/hud/MissionClock.tsx` — M+ DD:HH:MM:SS live counter
- `src/hud/ProgressBar.tsx` — Mission progress percentage bar
- `src/hud/DSNStatus.tsx` — Antenna status dots (Goldstone, Canberra, Madrid)
- `src/hud/CameraControls.tsx` — Camera preset buttons

### Chatbot (`src/chat/`)
- `src/chat/ChatPanel.tsx` — Sliding chat panel: message list, input field, quick-answer buttons, toggle button
- `src/chat/ChatMessage.tsx` — Individual message bubble (user/assistant styling)
- `src/chat/QuickAnswers.tsx` — Grid of clickable quick-answer buttons for common questions

### Public Assets (`public/`)
- `public/textures/earth-day.jpg` — NASA Blue Marble 2K texture
- `public/textures/moon.jpg` — Lunar surface texture
- `public/favicon.svg` — Mission-themed favicon

### Tests (`tests/`)
- `tests/oem-parser.test.ts` — Unit tests for OEM parsing
- `tests/interpolator.test.ts` — Unit tests for Lagrange interpolation accuracy

## Implementation Sequence

The sequence is ordered by data dependencies — each phase builds on the previous.

### Phase 1: Project Foundation (no NASA data needed)
1. **Scaffold project** — `npm create vite@latest`, install all dependencies, configure TypeScript, Tailwind, Vite
2. **Create mission-config.ts** — Hardcode launch epoch (2026-04-01T22:35:00Z), crew names, mission duration, milestones
3. **Create Zustand store** — Define store shape: oemData, dsnData, spacecraftState, cameraMode, isLoading
4. **Create App.tsx shell** — Basic layout with placeholder Canvas and HUD sections

### Phase 2: Data Pipeline (core accuracy layer)
5. **Create OEM parser** — Parse CCSDS OEM text format. Handle header/metadata/data sections. Return typed StateVector[]. Write unit tests with sample OEM data.
6. **Create Lagrange interpolator** — Implement degree-8 polynomial interpolation. Input: StateVector[], target epoch. Output: interpolated { x, y, z, vx, vy, vz }. Write unit tests comparing against known OEM data points (interpolation at data points should return exact values).
7. **Create DSN XML parser** — Parse XML string with DOMParser. Extract station info and spacecraft targets. Return typed arrays.
8. **Create Vercel API proxies** — All 4 API routes (oem, dsn, horizons, donki). Each fetches upstream, adds CORS headers, returns response. Add Cache-Control headers (OEM: 5 min, DSN: 30 sec, Horizons: 30 min, DONKI: 15 min).

### Phase 3: Data Hooks (connect pipeline to React)
9. **Create useOEM hook** — Fetch /api/oem on mount, parse with oem-parser, store in Zustand, set up 5-min polling interval
10. **Create useDSN hook** — Fetch /api/dsn on mount, parse with dsn-parser, store in Zustand, set up 30-sec polling
11. **Create useSpacecraft hook** — On each animation frame (or 1-sec interval): Lagrange interpolate current UTC from OEM data, compute speed (km/h), earthDist, moonDist. Update store.
12. **Create useMission hook** — Compute mission elapsed time from launch epoch, determine current phase from milestones, calculate progress %

### Phase 4: 3D Scene (visual layer)
13. **Create Stars.tsx** — Random Points geometry, ~5000 stars
14. **Create Earth.tsx** — SphereGeometry(1, 64, 64) with day texture. AmbientLight + DirectionalLight (Sun direction).
15. **Create Moon.tsx** — SphereGeometry(0.27, 32, 32) with lunar texture. Position from Horizons moon vector (scaled: pos / 10000).
16. **Create Trajectory.tsx** — Line geometry from OEM state vectors. Split at current epoch: solid orange (past), dashed cyan (future).
17. **Create Spacecraft.tsx** — Small emissive sphere at interpolated Orion position (scaled). Html label with "ORION" text.
18. **Create CameraController.tsx** — drei OrbitControls. Camera preset functions (Follow Orion, Earth View, Moon View).
19. **Create Scene.tsx** — R3F Canvas with Suspense. Compose all 3D components. Set background to black. Configure camera (fov: 45, position: [0, 5, 15]).

### Phase 5: HUD Overlay (UI layer)
20. **Create TelemetryCard.tsx** — Card with label, animated number (Framer Motion `animate`), and unit. Accepts value prop, smoothly transitions between values.
21. **Create MissionClock.tsx** — Live M+ DD:HH:MM:SS counter updating every second.
22. **Create ProgressBar.tsx** — Horizontal bar with percentage label and animated fill.
23. **Create DSNStatus.tsx** — Row of antenna indicators: green dot = active, gray = inactive. Station name labels.
24. **Create CameraControls.tsx** — Row of buttons triggering camera presets in store.
25. **Create HUD.tsx** — Compose all HUD components in overlay layout. Position: absolute, inset: 0, pointer-events: none (children with pointer-events: auto).

### Phase 6: AI Mission Chatbot
26. **Create artemis-knowledge.ts** — System prompt with all Artemis II mission facts (~2-4K tokens): crew bios, launch details, mission timeline, spacecraft specs, objectives, milestones, records. Plus 10-15 quick-answer Q&A pairs (question + pre-written answer).
27. **Create api/chat.ts** — Vercel serverless function: receives `{ messages: [...] }`, prepends Artemis II system prompt, calls Gemini 2.5 Flash API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`), streams response back with CORS headers. Reads `GEMINI_API_KEY` from env.
28. **Create useChat hook** — Manages message history array, handles sending messages to `/api/chat`, processes streamed responses, resolves quick-answer buttons client-side (matches question to pre-written answer without API call).
29. **Create ChatMessage.tsx** — Message bubble component: user messages right-aligned (blue), assistant messages left-aligned (dark), with typing indicator during streaming.
30. **Create QuickAnswers.tsx** — Grid of clickable pill buttons: "Who are the crew?", "How long is the mission?", "What is Orion?", "What's the trajectory?", etc. Clicking resolves client-side from artemis-knowledge.ts.
31. **Create ChatPanel.tsx** — Floating chat panel: toggle button (bottom-right corner), slide-in panel with message list + quick answers + text input. Panel has pointer-events: auto so it doesn't conflict with 3D scene.

### Phase 7: Integration & Polish
32. **Wire App.tsx** — Integrate Scene + HUD + ChatPanel. Initialize all data hooks. Show loading screen while OEM data loads.
33. **Create loading screen** — Full-screen "ARTEMIS II" title with "Loading trajectory data..." message
34. **Cross-validation** — Compare interpolated Earth distance with DSN downlegRange. Log warnings if delta > 1000 km.
35. **Vercel deployment config** — vercel.json with API rewrites. Test deployment.

### Phase 8: Testing & Verification
36. **Run unit tests** — OEM parser + interpolator tests must pass
37. **Manual verification** — Compare displayed values against NASA AROW (https://www.nasa.gov/trackartemis). Speed, Earth distance, Moon distance must be within 5% of AROW values.
38. **Test chatbot** — Verify quick-answer buttons resolve client-side; verify free-text questions hit /api/chat and return accurate responses; verify system prompt prevents hallucination on unknown questions.
39. **Deploy to Vercel** — Production deployment, verify all API proxies + chat endpoint work

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OEM file URL changes or becomes unavailable | Medium | High | Cache last-known-good OEM in /public as fallback; try multiple known URLs |
| DSN feed doesn't list Artemis II spacecraft target | Low | Medium | Graceful degradation: show "No DSN contact" state |
| NASA endpoints CORS-block even the proxy | Low | Low | Serverless functions make server-side requests; CORS is only a browser issue |
| Incorrect data displayed (HN lesson) | Medium | High | Unit test parser/interpolator; cross-validate vs DSN range; compare vs AROW before announcing |
| Lagrange interpolation diverges near trajectory boundaries | Low | Medium | Clamp interpolation to available epoch range; show "No data" outside range |
| Large earth texture slows initial load | Medium | Low | Use 2K (not 8K) textures; compress with WebP; show loading screen |
| WebGL not supported on user's device | Low | Medium | Check `WebGLRenderer` support; show text-only fallback message |
| Mission ends before tracker ships | Medium | High | Focus exclusively on MVP (Phase 1-6); defer all post-MVP features |
| JPL Horizons returns unexpected format | Low | Medium | Parse defensively; fall back to hardcoded mean Moon distance (384,400 km) |
| Gemini API free tier rate-limited | Low | Low | Quick-answer buttons handle most common questions client-side; show "Please try again" on 429 |
| Chatbot hallucinates mission facts | Medium | Medium | System prompt instructs "answer ONLY from provided facts"; refuse speculation; say "I don't know" |
| Gemini API key exposed client-side | Low | High | All chat requests proxied through /api/chat serverless function; key in env vars only |

## Acceptance Criteria

### MVP Must-Have
- [ ] Vite dev server starts without errors (`npm run dev`)
- [ ] Production build succeeds without errors (`npm run build`)
- [ ] OEM parser correctly parses a real Artemis II OEM file into StateVector[]
- [ ] Lagrange interpolator returns exact values when queried at OEM data point epochs (error < 0.001 km)
- [ ] 3D scene renders Earth, Moon, Orion marker, and trajectory line
- [ ] Earth and Moon have visible textures applied
- [ ] Orion marker position updates in real-time based on interpolated OEM data
- [ ] HUD displays: Speed (km/h), Earth Distance (km), Moon Distance (km), Mission Elapsed Time
- [ ] Telemetry numbers animate smoothly between updates (no jarring jumps)
- [ ] Camera can be rotated, zoomed, and panned via mouse/touch
- [ ] All 4 Vercel API proxies return valid data when called
- [ ] Displayed Speed is within 5% of NASA AROW value
- [ ] Displayed Earth Distance is within 5% of NASA AROW value
- [ ] Displayed Moon Distance is within 5% of NASA AROW value
- [ ] App deploys successfully to Vercel
- [ ] No console errors in production build
- [ ] Chat toggle button is visible and opens/closes the chat panel
- [ ] Quick-answer buttons resolve instantly without API call
- [ ] Free-text questions return relevant answers via Gemini API
- [ ] Chatbot refuses to answer questions outside its knowledge ("I don't have that information")
- [ ] Chat API key is not exposed in client-side bundle

### Post-MVP Nice-to-Have
- [ ] DSN antenna status shows which stations are communicating with Orion
- [ ] Camera presets smoothly animate to predefined positions
- [ ] Bloom/glow effects on Orion marker and Earth atmosphere
- [ ] Crew activity timeline shows current and upcoming activities
- [ ] Space weather alert badge appears when DONKI reports active events
- [ ] Layout adapts to mobile viewports

## Constraints

- **Time**: Mission has ~7 days remaining. MVP must ship within 1-2 days.
- **Budget**: $0 — all services must use free tiers (Vercel free, NASA APIs free, Gemini Flash free tier)
- **Textures**: Use NASA public domain imagery only (Blue Marble, CGI Moon Kit)
- **Data accuracy**: Interpolated values must be within 5% of AROW official values
- **Bundle size**: Keep initial JS bundle under 500KB gzipped (textures load separately)
- **Browser support**: Modern browsers with WebGL2 support (Chrome, Firefox, Safari, Edge — latest 2 versions)

## Debug Strategy

- **Self-debug**: enabled
- **Verifier**: `npm run build && npm run test` (Vite build + Vitest)
- **Max iterations**: 5
- **Completion criteria**: Build succeeds, all unit tests pass, no TypeScript errors
- **Escape hatch**: After 5 iterations, document blockers and request human review
- **Invoke with**: `/wrought-implement` (activates Stop hook verifier loop)

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

## Tech Stack

- Vite 6.x + React 19 + TypeScript 5.x
- Three.js r170+ / @react-three/fiber 9.x / @react-three/drei 9.x
- Framer Motion 12.x, Zustand 5.x
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin, CSS-only config)
- Vercel (static SPA + serverless functions)
- Gemini 2.5 Flash (free tier, non-streaming)
- Vitest for unit tests

## Implementation Sequence

### Phase 1: Project Scaffold (~15 min)

**Goal**: `npm run dev` shows a page, `npm run build` succeeds.

1. Run `npm create vite@latest artemis-tracker -- --template react-ts` in project root
2. Install dependencies:
   ```
   npm install three @react-three/fiber @react-three/drei zustand framer-motion
   npm install -D @types/three @tailwindcss/vite vitest @vercel/node
   ```
3. Configure `vite.config.ts`:
   - Add `@vitejs/plugin-react` + `@tailwindcss/vite` plugins
   - Add Vitest config (`test: { globals: true, environment: 'node' }`)
   - Add manual chunks for Three.js (separate bundle)
   - Set `build.target: 'es2022'`
4. Create `src/index.css` with `@import "tailwindcss"` + `@theme` block (space-dark colors, HUD colors, mono font)
5. Create minimal `src/App.tsx` (returns div with "ARTEMIS II Loading...")
6. Create `src/main.tsx` (mount App)
7. Update `index.html` (title, dark bg, no-margin body)
8. Create `.gitignore` (node_modules, dist, .env, .vercel)
9. Create `.env.example` (NASA_API_KEY, GEMINI_API_KEY)
10. **Delete** `tailwind.config.ts` if Vite template creates one — Tailwind v4 doesn't use it

**Verify**: `npm run dev` works, `npm run build` succeeds.

### Phase 2: Data Layer (~1-2 hours)

**Goal**: OEM parser + interpolator unit tests pass.

11. Create `src/data/mission-config.ts`:
    - `LAUNCH_EPOCH = new Date('2026-04-01T22:35:00Z')`
    - `MISSION_DURATION_DAYS = 10`
    - Crew array: `[{ name, role, agency }]`
    - Milestones array: `[{ name, missionElapsedHours, description }]`

12. Create `src/data/oem-parser.ts`:
    - Type: `StateVector = { epoch: Date; x,y,z,vx,vy,vz: number }`
    - Parse CCSDS OEM text: split lines, handle multiple META_START/META_STOP segments
    - Handle both `T` and space epoch separators
    - Skip COMMENT lines, header lines, empty lines
    - Return `StateVector[]` sorted by epoch

13. Create `tests/oem-parser.test.ts`:
    - Embed a sample OEM snippet (real format)
    - Test: parses correct number of state vectors
    - Test: epoch dates are correct
    - Test: position/velocity values match input
    - Test: handles multiple segments

14. Create `src/data/interpolator.ts`:
    - `lagrangeInterpolate(vectors: StateVector[], targetEpoch: Date): { x,y,z,vx,vy,vz }`
    - Find nearest 9 points (degree 8) to target epoch
    - Handle boundary cases: reduce degree if fewer than 9 points available at edges
    - Interpolate each component independently
    - Convert epoch to numeric (milliseconds) for polynomial math

15. Create `tests/interpolator.test.ts`:
    - Test: interpolation at exact data point returns that point's values (error < 0.001 km)
    - Test: interpolation between points returns reasonable values
    - Test: boundary behavior (near start/end of data)

16. Create `src/data/dsn-parser.ts`:
    - Types: `DsnStation = { name, friendly, dishes: DsnDish[] }`, `DsnDish = { name, azimuth, elevation, targets: DsnTarget[] }`, `DsnTarget = { name, id, uplegRange, downlegRange, rtlt }`
    - Parse XML string with `DOMParser` (or provide a Node-compatible parser for tests)
    - Filter for Artemis II / ORION target

**Verify**: `npm run test` — all tests pass. `npm run build` succeeds.

### Phase 3: Zustand Store + Hooks (~1 hour)

**Goal**: Data flows from API -> store. Console.log verifies interpolation.

17. Create `src/store/mission-store.ts`:
    - Zustand store with: `isLoading`, `oemData: StateVector[] | null`, `moonPosition: {x,y,z} | null`, `spacecraft: { x,y,z,vx,vy,vz, speed, earthDist, moonDist }`, `dsnStations: DsnStation[]`, `cameraMode`, `chatOpen`
    - Actions: `setOemData`, `setMoonPosition`, `setSpacecraft`, `setDsnStations`, `setCameraMode`, `toggleChat`

18. Create `src/hooks/useOEM.ts`:
    - Fetch `/api/oem` on mount (with fallback to local file during dev)
    - Parse with `parseOEM()`
    - Store in Zustand via `setOemData()`
    - Poll every 5 minutes via `setInterval`
    - Also fetch moon position from `/api/horizons` and store via `setMoonPosition()`

19. Create `src/hooks/useDSN.ts`:
    - Fetch `/api/dsn` on mount
    - Parse with `parseDSN()`
    - Store in Zustand via `setDsnStations()`
    - Poll every 30 seconds

20. Create `src/hooks/useMission.ts`:
    - Compute mission elapsed time from `LAUNCH_EPOCH`
    - Determine current phase from milestones
    - Calculate progress % (`elapsed / total_duration`)
    - Update every second via `setInterval`
    - Return `{ elapsed: string, phase: string, progress: number }`

21. Note: `useSpacecraft` logic goes in a `DataDriver.tsx` component inside Canvas (see Phase 4), not as a standalone hook, because it needs `useFrame`.

**Verify**: Wire `useOEM` + `useMission` into App.tsx temporarily. Console shows OEM data loading and mission time ticking.

### Phase 4: Vercel API Routes (~30 min)

**Goal**: All 5 API endpoints return valid data.

22. Create `vercel.json`:
    ```json
    { "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
    ```

23. Create `api/oem.ts`:
    - Fetch OEM file from NASA AROW page (URL to be confirmed from https://www.nasa.gov/trackartemis)
    - CORS headers, Cache-Control: `s-maxage=300`
    - Return raw text

24. Create `api/dsn.ts`:
    - Fetch `https://eyes.nasa.gov/apps/dsn-now/dsn.xml`
    - CORS headers, Cache-Control: `s-maxage=30`
    - Return XML text

25. Create `api/horizons.ts`:
    - Fetch JPL Horizons for Moon position: `command=301`, `center=500@399`, `ephem_type=VECTORS`, `format=json`
    - CORS headers, Cache-Control: `s-maxage=1800`
    - Return JSON

26. Create `api/donki.ts`:
    - Fetch `https://api.nasa.gov/DONKI/FLR?api_key=DEMO_KEY`
    - CORS headers, Cache-Control: `s-maxage=900`
    - Return JSON

27. Create `api/chat.ts`:
    - Receive `POST { messages: [{ role, text }] }`
    - Prepend system prompt via `system_instruction` field
    - Call Gemini 2.5 Flash `generateContent` (non-streaming)
    - Return `{ text: "response" }`
    - System prompt inlined directly (can't import from `src/`)

**Verify**: `vercel dev` + `curl` each endpoint.

### Phase 5: 3D Scene (~2-3 hours)

**Goal**: Interactive 3D Earth-Moon-Orion scene with trajectory.

28. Download textures into `public/textures/`:
    - `earth-day.jpg` — NASA Blue Marble 2K
    - `moon.jpg` — Lunar surface texture
    - Create `favicon.svg` — simple mission-themed icon

29. Create `src/components/Scene.tsx` **FIRST**:
    - `<Canvas camera={{ fov: 45, position: [0, 5, 25] }}>` 
    - `<Suspense fallback={null}>` wrapping all children
    - Black background (`<color attach="background" args={['#050510']} />`)
    - `<ambientLight intensity={0.1} />` + `<directionalLight position={[100, 0, 0]} />`
    - Compose all child components

30. Create `src/components/DataDriver.tsx`:
    - Uses `useFrame` to interpolate spacecraft position every frame
    - Reads OEM data from `useMissionStore.getState()`
    - Computes speed, earthDist, moonDist
    - Updates store via `setSpacecraft()`
    - This component renders nothing (`return null`)

31. Create `src/components/Stars.tsx`:
    - `<Points>` with ~5000 random positions in a large sphere
    - Small white dots, no animation

32. Create `src/components/Earth.tsx`:
    - `<mesh>` with `<sphereGeometry args={[1, 64, 64]} />`
    - `useTexture('/textures/earth-day.jpg')` from drei
    - Slow rotation: `useFrame` rotates mesh.rotation.y

33. Create `src/components/Moon.tsx`:
    - `<mesh>` with `<sphereGeometry args={[0.27, 32, 32]} />`
    - `useTexture('/textures/moon.jpg')`
    - Position from store's `moonPosition` (divided by 10,000 for scale)
    - Fallback position if no Horizons data: `[38.4, 0, 0]` (mean distance)

34. Create `src/components/Trajectory.tsx`:
    - Read OEM data from store
    - Convert positions to scene scale (divide by 10,000)
    - Split at current epoch: past points and future points
    - `<Line points={pastPoints} color="orange" lineWidth={2} />`
    - `<Line points={futurePoints} color="cyan" lineWidth={1} dashed dashSize={0.5} gapSize={0.3} />`

35. Create `src/components/Spacecraft.tsx`:
    - Read spacecraft position from store (scaled)
    - Small emissive sphere (`<meshBasicMaterial color="#00ff88" />`) with bloom-ready emissive
    - Pulsing scale animation via `useFrame`
    - `<Html>` label: "ORION" text with `zIndexRange={[0, 0]}`

36. Create `src/components/CameraController.tsx`:
    - drei `<OrbitControls enableDamping dampingFactor={0.05} />`
    - Camera preset functions stored in Zustand (follow Orion, Earth view, Moon view)
    - Animate camera position transitions with `useFrame` + lerp

**Verify**: `npm run dev` shows interactive 3D scene. Can rotate, zoom. Earth/Moon/Orion/trajectory visible.

### Phase 6: HUD Overlay (~1-2 hours)

**Goal**: Animated telemetry dashboard overlaid on 3D scene.

37. Create `src/hud/TelemetryCard.tsx`:
    - Props: `label: string, value: number, unit: string, decimals?: number`
    - Framer Motion `animate` for smooth number transitions
    - Format large numbers with commas (`Intl.NumberFormat`)
    - Dark glass-morphism card style (backdrop-blur, border, rounded)

38. Create `src/hud/MissionClock.tsx`:
    - Uses `useMission()` hook
    - Displays `M+ DD:HH:MM:SS` format
    - Updates every second

39. Create `src/hud/ProgressBar.tsx`:
    - Horizontal bar with animated fill width
    - Percentage label
    - Uses mission progress from store

40. Create `src/hud/DSNStatus.tsx`:
    - Row of station indicators
    - Green dot + name when active (has Orion target), gray when inactive
    - Three stations: Goldstone, Canberra, Madrid

41. Create `src/hud/CameraControls.tsx`:
    - Row of buttons: "Follow Orion", "Earth View", "Moon View", "Free"
    - Each sets `cameraMode` in store
    - Active button highlighted

42. Create `src/hud/HUD.tsx`:
    - Absolute overlay container (`inset-0`, `pointer-events-none`)
    - Top bar: "ARTEMIS II" title + MissionClock
    - Bottom bar: 3x TelemetryCard (Speed, Earth Dist, Moon Dist) + ProgressBar
    - Middle row: DSNStatus + CameraControls (with `pointer-events-auto`)

**Verify**: HUD visible over 3D scene. Numbers update. Buttons work.

### Phase 7: AI Chatbot (~1-2 hours)

**Goal**: Floating chat panel with quick answers + free-text via Gemini.

43. Create `src/data/artemis-knowledge.ts`:
    - `QUICK_ANSWERS: Array<{ question: string, answer: string }>` (10-15 pairs)
    - Questions: "Who are the crew?", "How long is the mission?", "What is Orion?", "What's the trajectory?", "When did it launch?", "What records will it break?", "What is SLS?", "What is TLI?", "When does it return?", "What is the Artemis program?"
    - Each answer: 2-4 sentences, factual, enthusiastic

44. Create `src/hooks/useChat.ts`:
    - State: `messages: Array<{ role: 'user'|'assistant', text: string }>`, `isLoading: boolean`
    - `sendMessage(text)`: Check if text matches a quick-answer question first (client-side). If not, POST to `/api/chat` with message history.
    - `askQuickAnswer(question)`: Instant client-side resolution from `QUICK_ANSWERS`

45. Create `src/chat/ChatMessage.tsx`:
    - User messages: right-aligned, blue-ish background
    - Assistant messages: left-aligned, dark background
    - Typing indicator (three dots animation) when `isLoading`

46. Create `src/chat/QuickAnswers.tsx`:
    - Grid of pill-shaped buttons
    - Each shows question text
    - onClick calls `askQuickAnswer()`
    - Shown when message list is empty (initial state)

47. Create `src/chat/ChatPanel.tsx`:
    - Toggle button: bottom-right corner, floating, `pointer-events-auto`
    - Panel: slides in from right, ~350px wide, full height
    - Contains: message list (scrollable), QuickAnswers (when empty), text input + send button
    - Opens/closes via `chatOpen` in store

**Verify**: Chat icon visible. Opens panel. Quick answers work instantly. Free-text returns Gemini response.

### Phase 8: Integration & Deploy (~30 min)

48. Update `src/App.tsx`:
    - Full layout: `<Scene />` (full viewport) + `<HUD />` (overlay) + `<ChatPanel />` (overlay)
    - Initialize hooks: `useOEM()`, `useDSN()` (called from App, outside Canvas)
    - Loading screen: show while `isLoading` is true in store
    - Loading screen: "ARTEMIS II" title, pulsing animation, "Loading trajectory data..."

49. Cross-validation:
    - In `DataDriver.tsx`, compare interpolated earthDist with DSN `downlegRange` if available
    - Log warning if delta > 1000 km
    - Display "Last updated" timestamp in HUD

50. Final build + deploy:
    - `npm run build` — verify no errors
    - `npm run test` — verify all tests pass
    - Deploy to Vercel (connect repo or `vercel deploy`)
    - Verify all API endpoints work in production
    - Compare displayed values against NASA AROW

## Verification Strategy

1. **Unit tests** (`npm run test`): OEM parser, Lagrange interpolator
2. **Build check** (`npm run build`): No TS errors, no build failures
3. **Dev server visual check**: 3D scene renders, HUD updates, chat works
4. **API proxy check**: `curl` each `/api/` endpoint on Vercel
5. **Accuracy check**: Compare Speed/EarthDist/MoonDist against https://www.nasa.gov/trackartemis (within 5%)
6. **Chatbot check**: Quick answers resolve client-side; free-text returns accurate answers; unknown questions get "I don't have that information"

## Key Gotchas

- `useFrame` (R3F) can only be used inside `<Canvas>` children — spacecraft interpolation goes in `DataDriver.tsx`, not a standalone hook
- `api/` files cannot import from `src/` — Vercel compiles them separately — inline the system prompt in `api/chat.ts`
- Tailwind v4 has no `tailwind.config.ts` — all config in CSS via `@theme`
- Gemini API uses `"role": "model"` not `"assistant"`, and `system_instruction` is a top-level field
- Vercel serverless for Vite uses `VercelRequest/VercelResponse` from `@vercel/node`, not Next.js types
- Three.js manual chunks in Vite config prevent a 1MB+ monolithic bundle

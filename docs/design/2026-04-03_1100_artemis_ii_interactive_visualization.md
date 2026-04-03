# Design Analysis: Artemis II Interactive Visualization

**Date**: 2026-04-03 11:00 UTC
**Analyst**: Claude Code (Session 1)
**Mode**: From-Scratch (Tradeoff variant)
**Interactive Checkpoints**: 4 decisions made by user
**Finding**: F1 in `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md`

---

## Executive Summary

Build a greenfield interactive 3D web visualization of the Artemis II lunar flyby mission using **Vite + React + React Three Fiber**, deployed on **Vercel** with serverless API proxies for NASA data feeds. The visualization consumes OEM ephemeris files (trajectory), DSN Now XML (real-time comms), and JPL Horizons (supplementary ephemeris), displaying velocity, Earth/Moon distances, mission elapsed time, crew schedule, and DSN status in an animated HUD overlay atop an interactive 3D Earth-Moon-Orion scene.

---

## User Context

- **Goal**: Build a new interactive, animated web visualization of Artemis II that surpasses existing passive YouTube overlay trackers
- **Constraints**: Time-critical (~7 days remaining in mission), solo developer, minimal backend, standard free hosting, no paid APIs
- **Priorities**: Speed to ship (40%) > Visual wow-factor (30%) > Technical accuracy (20%) > Code quality (10%)

---

## Current State Analysis

Greenfield project. No existing code, components, or infrastructure. The ARTEMIS project contains only scaffolding (`docs/` directories, `.wrought` marker, `CLAUDE.md`).

**Reference**: NASASpaceflight YouTube overlay (screenshot at `docs/screenshots/Screenshot 2026-04-03 at 12.58.32.png`) showing static telemetry bar, 3D Orion render, crew schedule sidebar, trajectory diagram, and Moon view. This is a non-interactive broadcast overlay — the target is to exceed this in every dimension.

---

## External Research (2026 Sources)

### Visualization Technology

- **React Three Fiber (R3F)** is the standard React wrapper for Three.js, with mature ecosystem including `@react-three/drei` (controls, effects, helpers) and `@react-three/postprocessing` (bloom, glow effects). Multiple working solar system/orbit visualization examples exist.
- **Atlas26** (Three.js forum showcase) demonstrates a real-time 3D solar system simulation built with Next.js + R3F, using Kepler-based orbital motion and device-aware performance optimization.
- **Vite vs Next.js (2026)**: For client-side dashboards/visualizations, Vite wins on dev speed (sub-second HMR), bundle size, and TTI. Next.js adds SSR complexity unnecessary for this use case.

### Data Sources

- **CCSDS OEM format**: Simple text format — header metadata followed by `Epoch X Y Z Vx Vy Vz` records (km, km/s). No JavaScript npm parser exists, but the format is trivial to parse (~50 lines of code). Lagrange interpolation (degree 8, per the OEM metadata) bridges the 4-minute intervals.
- **DSN Now XML**: Real-time 5-second refresh at `https://eyes.nasa.gov/apps/dsn-now/dsn.xml`. Requires CORS proxy. Fields include dish name/azimuth/elevation, spacecraft target, upleg/downleg range (km), round-trip light time, signal band, and data rate.
- **JPL Horizons API**: REST API at `https://ssd.jpl.nasa.gov/api/horizons.api`. JSON output, no auth. Artemis I ID is `-1023`; Artemis II ID to be confirmed via lookup.
- **Vercel serverless CORS proxy**: Well-documented pattern. A simple API route fetches the NASA endpoint server-side and returns with CORS headers.

### Lessons from Community Trackers

- **Critical lesson (HN discussion)**: A community Artemis II tracker was heavily criticized for showing incorrect distances (154K km vs NASA's 44K km) and velocities (7 km/s vs 4 km/s). Data accuracy validation against AROW/official sources is non-negotiable, even for a fast-shipped MVP.
- **KeepTrack.Space**: Uses OEM data directly for 3D positioning. Gold standard for community trackers.
- **artemistracker.io**: Demonstrates that a clean, focused dashboard with accurate data beats a flashy but wrong visualization.

---

## Architecture Options Evaluated

### Option A: Vite + React + React Three Fiber (Recommended)

Full 3D interactive Earth-Moon-Orion scene with R3F component model and Vercel serverless proxies.

**How it works**: Vite builds a React SPA. R3F renders a Three.js scene as React components (Earth sphere, Moon sphere, Orion marker, trajectory line, star field). `@react-three/drei` provides OrbitControls, camera animations, glow effects, HTML overlays. A React HUD layer atop the 3D canvas shows animated telemetry counters, crew timeline, and DSN status. Zustand manages shared state between 3D scene and HUD. Custom hooks poll Vercel API routes that proxy NASA data sources.

**Pros**: Maximum visual impact. R3F component model accelerates 3D dev. Rich ecosystem (drei, postprocessing). Clean separation of 3D scene and UI. Vite's fast HMR keeps iteration tight.

**Cons**: Slightly more complex than 2D. R3F learning curve if unfamiliar. WebGL can be heavy on low-end devices.

### Option B: Vite + React + 2D Canvas/SVG

Animated 2D dashboard with trajectory diagram rendered on canvas or as SVG.

**How it works**: 2D trajectory view (similar to the screenshot's top-right panel), animated counters, CSS/Framer Motion animations. No 3D rendering.

**Pros**: Fastest to build. Lightest bundle. Works on all devices. Simplest mental model.

**Cons**: Lacks the "wow" of 3D. Can't freely rotate/explore. Harder to convey spatial relationships. Similar to what already exists.

### Option C: Next.js + Three.js (SSR + 3D)

Server-rendered app with Three.js 3D visualization, similar to Atlas26's architecture.

**How it works**: Next.js App Router with server components for data fetching, client components for Three.js scene. API routes for NASA proxies built in.

**Pros**: Built-in API routes. SEO if needed. Server-side data fetching. Atlas26 proves the pattern works.

**Cons**: SSR + Three.js = hydration complexity. Heavier framework. Slower dev iteration. Over-engineered for a client-side visualization. Adds ~200KB to bundle vs Vite.

### Option D: Vanilla HTML + Three.js

No framework. Pure Three.js with vanilla HTML/CSS for the UI.

**How it works**: Single HTML file (or minimal build tool), Three.js from CDN, vanilla JS for data fetching and DOM manipulation.

**Pros**: Zero framework overhead. Smallest possible bundle. Full Three.js control. Deploy anywhere.

**Cons**: No component model — UI state management becomes manual spaghetti. Harder to iterate on complex UI. No HMR. No ecosystem for effects/controls without importing drei patterns manually.

---

## Trade-Off Matrix

| Criterion | Weight | A: Vite+R3F | B: Vite+2D | C: Next+3D | D: Vanilla |
|-----------|--------|-------------|------------|------------|------------|
| Speed to ship | 40% | 8 | 9 | 5 | 7 |
| Visual wow-factor | 30% | 10 | 6 | 9 | 9 |
| Technical accuracy | 20% | 8 | 7 | 8 | 8 |
| Code quality | 10% | 8 | 7 | 8 | 5 |
| **Weighted Total** | | **8.6** | **7.5** | **7.1** | **7.6** |

---

## Recommendation: Option A — Vite + React + React Three Fiber on Vercel

**Rationale**: R3F scores highest across weighted priorities. Its visual wow-factor (10/10) is unmatched, and the mature ecosystem (`@react-three/drei` for OrbitControls, Html overlays, effects; `@react-three/postprocessing` for bloom/glow) accelerates development to nearly match Option B's speed. Vite eliminates Next.js's SSR overhead while providing the same fast DX. Vercel's free tier includes serverless functions for the CORS proxy layer.

**Key trade-off**: Slightly more complex than 2D (Option B), but the visual payoff justifies it — the whole point is to be "interactive, fun and much better" than the YouTube overlay.

---

## Detailed Architecture

### System Architecture

```
┌──────────────────────────────────────────────────┐
│  Vercel Deployment                               │
│                                                  │
│  Serverless API Routes (/api/)                   │
│  ┌────────────────────────────────────────────┐  │
│  │  /api/dsn       → eyes.nasa.gov DSN XML   │  │
│  │  /api/oem       → nasa.gov OEM file       │  │
│  │  /api/horizons  → ssd.jpl.nasa.gov API    │  │
│  │  /api/donki     → api.nasa.gov DONKI      │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Static SPA (Vite + React + TypeScript)          │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  │  3D Scene Layer (React Three Fiber)        │  │
│  │  ├── Earth (textured sphere + atmosphere)  │  │
│  │  ├── Moon (textured, orbital position)     │  │
│  │  ├── Orion (glowing marker + label)        │  │
│  │  ├── Trajectory (line: past=solid,         │  │
│  │  │    future=dashed, gradient color)       │  │
│  │  ├── Stars (particle system background)    │  │
│  │  └── Lighting (Sun directional + ambient)  │  │
│  │                                            │  │
│  │  HUD Overlay (React + Framer Motion)       │  │
│  │  ├── Velocity gauge (animated counter)     │  │
│  │  ├── Earth distance (animated counter)     │  │
│  │  ├── Moon distance (animated counter)      │  │
│  │  ├── Mission elapsed time (live clock)     │  │
│  │  ├── Mission progress bar (% complete)     │  │
│  │  ├── DSN status (antenna indicators)       │  │
│  │  ├── Crew activity timeline                │  │
│  │  └── Camera preset buttons                 │  │
│  │                                            │  │
│  │  Data Layer (Zustand + custom hooks)       │  │
│  │  ├── useOEM() — fetch, parse, interpolate  │  │
│  │  ├── useDSN() — poll XML, parse targets    │  │
│  │  ├── useMission() — elapsed time, phase    │  │
│  │  └── useSpacecraft() — derived metrics     │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Build | Vite | 6.x | Dev server, bundler |
| UI Framework | React | 19.x | Component model |
| Language | TypeScript | 5.x | Type safety |
| 3D Engine | Three.js | r170+ | WebGL rendering |
| 3D React | @react-three/fiber | 9.x | React-Three.js bridge |
| 3D Helpers | @react-three/drei | 9.x | Controls, effects, Html overlay |
| Post-processing | @react-three/postprocessing | 3.x | Bloom, glow effects |
| Animation | Framer Motion | 12.x | HUD animations, counters |
| State | Zustand | 5.x | Lightweight global state |
| Styling | Tailwind CSS | 4.x | HUD styling |
| Hosting | Vercel | — | Static + serverless functions |

### Data Pipeline

#### 1. OEM Ephemeris (Primary trajectory source)

```
Fetch /api/oem → Raw OEM text
  → Parse header (OBJECT_NAME, REF_FRAME, TIME_SYSTEM)
  → Parse state vectors: [{ epoch, x, y, z, vx, vy, vz }]
  → Store in Zustand
  → On each frame: Lagrange interpolate to current UTC
  → Compute derived metrics:
     - speed = sqrt(vx² + vy² + vz²) × 3600 (km/s → km/h)
     - earthDist = sqrt(x² + y² + z²)
     - moonDist = distance(orionPos, moonPos)  // Moon pos from JPL or analytical
```

**Polling**: Every 5 minutes (OEM files update periodically, not continuously).

**OEM Parser** (~50 lines): Split lines, skip `META_*`/`COMMENT` lines, parse `YYYY-MM-DDTHH:MM:SS.SSS X Y Z VX VY VZ` records.

**Lagrange Interpolation**: Degree 8 (as specified in OEM metadata). Use nearest 9 state vectors to interpolate position and velocity at arbitrary epoch. This provides smooth, accurate positions between the 4-minute data points.

**Coordinate Transform**: OEM uses J2000/EME2000 Earth-centered frame. For the 3D scene:
- Earth at origin
- Scale factor: 1 unit = 10,000 km (keeps scene manageable)
- Moon position: compute from JPL Horizons or use analytical lunar ephemeris (sufficient accuracy for visualization)

#### 2. DSN Now XML (Real-time communications)

```
Poll /api/dsn every 30 seconds (5s is aggressive for a frontend)
  → Parse XML with DOMParser
  → Filter for Artemis II spacecraft target
  → Extract: dish name, azimuth, elevation, range, signal strength, data rate
  → Display as antenna status indicators in HUD
```

**Note**: DSN range (`downlegRange`) provides an independent distance measurement that can cross-validate OEM interpolation. Display discrepancy warning if delta > 1000 km.

#### 3. JPL Horizons (Moon position + validation)

```
Fetch /api/horizons on load and every 30 minutes
  → Request Moon state vector relative to Earth at current epoch
  → Use for Moon positioning in 3D scene
  → Optionally request Artemis II ephemeris for cross-validation
```

**Query parameters**: `command='301'` (Moon), `center='500@399'` (Earth geocenter), `make_ephem='YES'`, `ephem_type='VECTORS'`, `format='json'`.

#### 4. DONKI Space Weather (Supplementary)

```
Fetch /api/donki on load and every 15 minutes
  → Check for active solar flares, CMEs, radiation storms
  → Display alert badge in HUD if active event detected
```

### 3D Scene Design

#### Earth
- `SphereGeometry(1, 64, 64)` with high-res texture (NASA Blue Marble, ~2K resolution)
- Atmosphere glow using custom shader or drei's `MeshDistortMaterial` with bloom
- Day/night terminator via Sun position + shader
- Rotation: 360deg per 24h at current rate

#### Moon
- `SphereGeometry(0.27, 32, 32)` (to-scale ratio with Earth)
- Positioned from JPL Horizons data (or analytical ephemeris)
- Lunar texture (NASA CGI Moon Kit)
- Correct phase lighting from Sun direction

#### Orion Spacecraft
- Glowing dot/marker (`Sprite` or small `SphereGeometry` with emissive material + bloom)
- Label via drei's `Html` component (shows name, clickable for details)
- Pulsing animation to draw attention

#### Trajectory
- `Line` geometry from OEM state vectors
- Past trajectory: solid line, warm color (orange/gold)
- Future trajectory: dashed line, cool color (blue/cyan)
- Current position highlighted with radial glow

#### Background
- Star field: `Points` geometry with ~5000 random positions + star texture
- Optional: Milky Way skybox for realism

### HUD Overlay Design

The HUD floats above the 3D canvas as a React layer with `pointer-events: none` (except interactive elements).

```
┌─────────────────────────────────────────────────────────┐
│  ARTEMIS II                        M+ DD:HH:MM:SS  ⚡  │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│                                                         │
│              [ 3D Interactive Scene ]                   │
│                                                         │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ SPEED   │ │ EARTH    │ │ MOON     │ │ PROGRESS  │  │
│  │ 7,675   │ │ 126,953  │ │ 289,820  │ │ ████░ 15% │  │
│  │ km/h    │ │ km       │ │ km       │ │           │  │
│  └─────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                                                         │
│  DSN: ● Goldstone 70m  ○ Canberra  ○ Madrid           │
│                                                         │
│  📷 Follow Orion │ 🌍 Earth View │ 🌙 Moon View │ Free │
└─────────────────────────────────────────────────────────┘
```

**Animated counters**: Numbers roll/count using Framer Motion's `animate` with spring physics. Updates smooth-interpolate between data points rather than jumping.

**Camera presets**: Buttons that `gsap` or Framer Motion tween the camera to predefined positions:
- **Follow Orion**: Camera tracks behind Orion, looking toward Moon
- **Earth View**: Camera near Earth surface, looking at Orion's trajectory
- **Moon View**: Camera at Moon, looking back at approaching Orion
- **Free Orbit**: Standard OrbitControls, user navigates freely

### File Structure

```
artemis-tracker/
├── public/
│   ├── textures/
│   │   ├── earth-day.jpg        # NASA Blue Marble 2K
│   │   ├── earth-night.jpg      # Earth city lights
│   │   ├── earth-clouds.png     # Cloud layer (transparent)
│   │   ├── moon.jpg             # Lunar surface
│   │   └── star-particle.png    # Star sprite
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Scene.tsx            # R3F Canvas + scene composition
│   │   ├── Earth.tsx            # Earth sphere + atmosphere
│   │   ├── Moon.tsx             # Moon sphere + positioning
│   │   ├── Spacecraft.tsx       # Orion marker + label
│   │   ├── Trajectory.tsx       # OEM trajectory line
│   │   ├── Stars.tsx            # Background star field
│   │   └── CameraController.tsx # Camera presets + animation
│   ├── hud/
│   │   ├── HUD.tsx              # Main HUD overlay container
│   │   ├── TelemetryCard.tsx    # Individual metric card (speed, distance)
│   │   ├── MissionClock.tsx     # Mission elapsed time
│   │   ├── ProgressBar.tsx      # Mission progress indicator
│   │   ├── DSNStatus.tsx        # DSN antenna status
│   │   ├── CrewTimeline.tsx     # Crew activity schedule
│   │   └── CameraControls.tsx   # Camera preset buttons
│   ├── data/
│   │   ├── oem-parser.ts        # CCSDS OEM file parser
│   │   ├── interpolator.ts      # Lagrange interpolation
│   │   ├── dsn-parser.ts        # DSN XML parser
│   │   └── mission-config.ts    # Launch time, crew, milestones
│   ├── hooks/
│   │   ├── useOEM.ts            # OEM fetch + parse + interpolate
│   │   ├── useDSN.ts            # DSN polling + parse
│   │   ├── useSpacecraft.ts     # Derived metrics (speed, distances)
│   │   └── useMission.ts        # Mission elapsed time, phase
│   ├── store/
│   │   └── mission-store.ts     # Zustand store
│   ├── App.tsx                  # Root layout
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + custom styles
├── api/
│   ├── dsn.ts                   # Vercel serverless: DSN XML proxy
│   ├── oem.ts                   # Vercel serverless: OEM file proxy
│   ├── horizons.ts              # Vercel serverless: JPL Horizons proxy
│   └── donki.ts                 # Vercel serverless: DONKI proxy
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json
└── README.md
```

---

## Impact Assessment

### Code Changes
- **Files to create**: ~30 files (greenfield)
- **Estimated total lines**: ~2,500-3,500 lines of TypeScript/TSX
- **New dependencies**: 12 packages (React, Three.js, R3F, drei, postprocessing, Framer Motion, Zustand, Tailwind, Vite, TypeScript, plus dev tooling)

### Tests
- **OEM parser**: Unit tests for parsing real OEM file samples
- **Interpolator**: Unit tests for Lagrange interpolation accuracy
- **DSN parser**: Unit tests for XML parsing
- **Visual**: Manual verification against AROW (https://www.nasa.gov/trackartemis)

### Configuration
- `vercel.json`: API route rewrites
- `.env`: NASA API key (DEMO_KEY for development, registered key for production)
- `vite.config.ts`: Standard Vite React config

### Deployment
- Vercel free tier (sufficient for this project)
- No database required
- No authentication required
- Rollback: Vercel instant rollback to previous deployment

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OEM file URL changes or becomes unavailable | Medium | High | Cache last-known-good OEM data; fall back to JPL Horizons |
| DSN feed doesn't list Artemis II target | Low | Medium | DSN status is supplementary; degrade gracefully to "No DSN contact" |
| CORS proxy rate-limited by NASA | Low | Medium | Cache responses in Vercel edge (5-min TTL for OEM, 30s for DSN) |
| Incorrect data displayed (HN lesson) | Medium | High | Cross-validate OEM interpolation vs DSN range; show "last updated" timestamps; compare against AROW on first deploy |
| WebGL not supported on user's device | Low | Medium | Detect WebGL support; show 2D fallback message |
| Large textures slow initial load | Medium | Low | Compress textures; use progressive loading; show loading screen |
| Mission ends before tracker is ready | Medium | High | Prioritize MVP (3D scene + telemetry cards) in first sprint; add polish features after |

### MVP Scope (Ship in ~1-2 days)

To maximize relevance given the mission timeline, the MVP should include:

1. 3D scene: Earth + Moon + Orion marker + trajectory line
2. OEM parser + Lagrange interpolation (accurate positions)
3. HUD: Speed, Earth distance, Moon distance, mission elapsed time
4. Camera controls (OrbitControls, free navigation)
5. Vercel deployment with OEM proxy

**Post-MVP enhancements** (days 3-7):
- DSN antenna status
- Crew activity timeline
- Camera presets (follow Orion, Earth view, Moon view)
- Bloom/glow postprocessing
- Space weather alerts
- Earth atmosphere shader + day/night
- Mobile responsive layout
- Loading screen with mission branding

---

## Sources

- [Atlas26 — Real-time 3D Solar System Simulation (Three.js Forum)](https://discourse.threejs.org/t/atlas26-real-time-3d-solar-system-simulation-with-three-js/90706)
- [Vite vs Next.js: Complete Comparison for React Developers (2026)](https://designrevision.com/blog/vite-vs-nextjs)
- [Next.js vs Vite: Choosing the Right Tool in 2026 (DEV Community)](https://dev.to/shadcndeck_dev/nextjs-vs-vite-choosing-the-right-tool-in-2026-38hp)
- [Tracking Artemis II in KeepTrack](https://keeptrack.space/deep-dive/tracking-artemis-ii)
- [CCSDS OEM Ephemeris File Format](https://ai-solutions.com/_help_Files/ccsds_oem.htm)
- [NASA DSN Now](https://eyes.nasa.gov/apps/dsn-now/)
- [DSN XML Parser — pydsn (GitHub)](https://github.com/russss/pydsn)
- [api.spaceprob.es — DSN data aggregator (GitHub)](https://github.com/spacehackers/api.spaceprob.es)
- [Building a Serverless CORS Proxy with Vercel](https://hyperpolarizability.com/posts/cors-proxy.html)
- [Vercel CORS library for serverless functions (GitHub)](https://github.com/diegoulloao/vercel-cors)
- [HN Discussion: Artemis II Tracker — data accuracy lessons](https://news.ycombinator.com/item?id=47621438)
- [React Three Fiber Interactive Solar System](https://cwaitt.dev/projects/solar-system)
- [NASA Track Artemis II in Real Time](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/)
- [NASA Open APIs](https://api.nasa.gov/)
- [JPL Horizons API Documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [Vercel Serverless Functions: Complete Developer Guide 2026](https://reintech.io/blog/vercel-serverless-functions-complete-developer-guide-2026)

---

**Analysis Complete**: 2026-04-03 11:00 UTC

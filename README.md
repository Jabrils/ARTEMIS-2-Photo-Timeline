# ARTEMIS -- Artemis II Interactive Mission Tracker

A real-time, interactive 3D visualization of NASA's Artemis II lunar flyby mission, featuring live telemetry, an AI-powered mission chatbot, and Deep Space Network status -- all running in your browser.

**Live site**: [artemis.vercel.app](https://artemis.vercel.app) (Vercel deployment)

---

![ARTEMIS Screenshot](docs/screenshots/Screenshot%202026-04-03%20at%2012.58.32.png)

*Reference screenshot showing mission telemetry overlay. The live application features a fully interactive 3D scene with free camera controls.*

---

## Features

- **Interactive 3D Scene** -- Explore a real-time Earth-Moon-Orion scene built with React Three Fiber. Rotate, zoom, and pan freely, or use camera presets (Follow Orion, Earth View, Moon View).
- **Live Trajectory Data** -- Spacecraft position and velocity interpolated from NASA OEM ephemeris files using degree-8 Lagrange interpolation, updating in real time.
- **Telemetry HUD** -- Animated readouts for speed (km/h), distance from Earth, distance to Moon, mission elapsed time, and mission progress percentage.
- **AI Mission Chatbot** -- Ask questions about the Artemis II mission. Powered by Google Gemini 2.5 Flash with a curated knowledge base of mission facts. Common questions resolve instantly via quick-answer buttons.
- **Deep Space Network Status** -- Live indicators showing which DSN ground stations (Goldstone, Canberra, Madrid) are communicating with Orion.
- **Space Weather Alerts** -- DONKI integration surfaces active solar flares, CMEs, and radiation storms relevant to the mission.
- **Cross-Validated Data** -- OEM-interpolated positions are cross-checked against DSN range measurements to ensure accuracy within 5% of NASA AROW official values.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Build | Vite 6.x | Dev server and bundler |
| UI Framework | React 19 | Component model |
| Language | TypeScript 5.x | Type safety |
| 3D Engine | Three.js r170+ | WebGL rendering |
| 3D React Bindings | @react-three/fiber 9.x | React-Three.js bridge |
| 3D Helpers | @react-three/drei 9.x | Controls, effects, HTML overlays |
| Post-Processing | @react-three/postprocessing 3.x | Bloom and glow effects |
| Animation | Framer Motion 12.x | HUD animations, smooth counters |
| State Management | Zustand 5.x | Lightweight global state |
| Styling | Tailwind CSS 4.x | Utility-first HUD styling |
| AI Chatbot | Google Gemini 2.5 Flash | Mission Q&A (free tier) |
| Hosting | Vercel | Static SPA + serverless API proxies |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A NASA API key (free, from [api.nasa.gov](https://api.nasa.gov/))
- A Google Gemini API key (free tier, from [Google AI Studio](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone the repository
git clone https://github.com/fluxforgeai/ARTEMIS.git
cd ARTEMIS

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` and add your API keys:

```
NASA_API_KEY=your_nasa_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a WebGL2-capable browser.

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel
```

Set `NASA_API_KEY` and `GEMINI_API_KEY` in your Vercel project's environment variables.

## Data Sources

ARTEMIS consumes four NASA data feeds, proxied through Vercel serverless functions to handle CORS:

| Source | Endpoint | Data Provided | Update Interval |
|---|---|---|---|
| [CCSDS OEM Ephemeris](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/) | `/api/oem` | Spacecraft position and velocity vectors (J2000 frame, 4-min intervals) | 5 minutes |
| [DSN Now](https://eyes.nasa.gov/apps/dsn-now/) | `/api/dsn` | Real-time Deep Space Network antenna status, signal strength, range | 30 seconds |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | `/api/horizons` | Moon ephemeris for accurate 3D positioning; Artemis II cross-validation | 30 minutes |
| [DONKI](https://api.nasa.gov/) | `/api/donki` | Space weather events (solar flares, CMEs, radiation storms) | 15 minutes |

## Architecture Overview

The application is a Vite-built React SPA deployed on Vercel with serverless API proxies.

```
Vercel
+---------------------------------------------+
|  Serverless API Layer (/api/)               |
|  OEM | DSN | Horizons | DONKI | Chat        |
+---------------------------------------------+
|  Client SPA (React + TypeScript)            |
|                                             |
|  +--- 3D Scene (React Three Fiber) ------+  |
|  |  Earth, Moon, Orion, Trajectory, Stars |  |
|  +---------------------------------------+  |
|                                             |
|  +--- HUD Overlay (React + Framer) ------+  |
|  |  Telemetry, Clock, DSN, Progress      |  |
|  +---------------------------------------+  |
|                                             |
|  +--- AI Chatbot (Gemini Flash) ---------+  |
|  |  System prompt + quick answers        |  |
|  +---------------------------------------+  |
|                                             |
|  +--- Data Layer (Zustand + Hooks) ------+  |
|  |  useOEM, useDSN, useSpacecraft, ...   |  |
|  +---------------------------------------+  |
+---------------------------------------------+
```

**Key data flow**: OEM ephemeris files are fetched, parsed, and Lagrange-interpolated (degree 8) on each frame to produce smooth, accurate spacecraft positions. These positions drive both the 3D Orion marker and the HUD telemetry readouts. DSN range measurements independently cross-validate the interpolated data.

For full architectural details, see `ARCHITECTURE.md`.

## Testing

```bash
# Run unit tests (OEM parser, Lagrange interpolator)
npm run test

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

Accuracy is verified against [NASA AROW](https://www.nasa.gov/trackartemis) -- displayed speed, Earth distance, and Moon distance must be within 5% of official values.

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes with clear, descriptive messages.
4. Open a pull request against `develop`.

Please ensure `npm run build` and `npm run test` pass before submitting.

## License

This project is licensed under the [MIT License](LICENSE).

## Credits

**Data and imagery provided by**:
- [NASA](https://www.nasa.gov/) -- OEM ephemeris files, Blue Marble Earth textures, DONKI space weather data, and the Artemis II mission itself
- [NASA Jet Propulsion Laboratory (JPL)](https://www.jpl.nasa.gov/) -- Horizons ephemeris system and Deep Space Network Now
- [European Space Agency (ESA)](https://www.esa.int/) -- European Space Astronomy Centre DSN ground station support

**Built with**:
- [Three.js](https://threejs.org/) and the [React Three Fiber](https://r3f.docs.pmnd.rs/) ecosystem
- [React](https://react.dev/), [Vite](https://vite.dev/), and [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/) for hosting and serverless functions
- [Google Gemini](https://ai.google.dev/) for the AI mission chatbot

---

*ARTEMIS is an independent community project and is not affiliated with or endorsed by NASA, JPL, or ESA. All NASA data and imagery used are in the public domain.*

# Finding: Interactive Artemis II Mission Visualization with Live NASA Data

**Date**: 2026-04-03
**Discovered by**: User requirement / research analysis
**Type**: Gap
**Severity**: High
**Status**: Open

---

## What Was Found

The ARTEMIS project has no interactive web visualization for the Artemis II lunar mission. The mission launched on April 1, 2026 and is currently on Day 3 of its ~10-day lunar flyby. NASA does not provide a unified real-time telemetry API, but three confirmed machine-readable data sources exist that can be combined to build an accurate live tracker:

1. **DSN Now XML feed** (`https://eyes.nasa.gov/apps/dsn-now/dsn.xml`) — real-time at 5-second intervals, provides antenna-to-spacecraft range measurements, signal data, and communication status
2. **JPL Horizons API** (`https://ssd.jpl.nasa.gov/api/horizons.api`) — on-demand ephemeris computations for spacecraft positions and velocities; no authentication required
3. **AROW OEM files** (downloadable from `https://www.nasa.gov/trackartemis`) — CCSDS-standard state vectors at 4-minute intervals (2-second during maneuvers) with position (X/Y/Z km) and velocity (X/Y/Z km/s) in J2000 frame

Required display metrics:
- Speed/Velocity (km/h)
- Distance from Earth (km)
- Distance to Moon (km)
- Mission elapsed time
- Interactive 3D or animated trajectory visualization

Supplementary data available via `api.nasa.gov/DONKI/` for space weather context (solar flares, CMEs, radiation).

---

## Affected Components

- No existing components — this is a greenfield capability
- Will require: frontend visualization (WebGL/Canvas/Three.js), data ingestion layer, numerical propagation engine (multi-body gravity model), and backend proxy for CORS-restricted NASA endpoints

---

## Evidence

**Data source availability confirmed by research**:

- DSN Now XML: Live feed, no authentication, 5-second refresh, provides `uplegRange`/`downlegRange` in km and `rtlt` (round-trip light time) in seconds
- JPL Horizons: REST API at `https://ssd.jpl.nasa.gov/api/horizons.api`, JSON/text output, Artemis I spacecraft ID `-1023` (Artemis II ID to be confirmed)
- OEM files: Plain text CCSDS standard, most recent observed file `Artemis_II_OEM_2026_04_02_to_EI_v3.asc`
- Community trackers (KeepTrack.Space, ArtemisLive.org, artemis-tracker.netlify.app) demonstrate the viable approach using these same sources

**Technical constraint**: Standard TLE/SGP4 satellite trackers cannot track Artemis II beyond Earth orbit. Only OEM-based numerical propagation with multi-body gravity models (Earth + Moon + Sun minimum) remains accurate for cislunar trajectories.

---

## Preliminary Assessment

**Likely cause**: No capability exists yet — ARTEMIS project is in its first session with empty scaffolding.

**Likely scope**: Full-stack greenfield build — frontend visualization, data pipeline, and potentially a lightweight backend/proxy.

**Likely impact**: Without this visualization, the project has no deliverable for tracking the active Artemis II mission during its remaining ~7-day flight window. Time-sensitive due to mission duration.

---

## Classification Rationale

**Type: Gap** — This is a missing capability that needs to be built from scratch. No existing code, components, or infrastructure exists in the project.

**Severity: High** — The Artemis II mission is actively in flight with approximately 7 days remaining. The visualization must be built and deployed within this window to be relevant for live tracking. The data sources are confirmed available and the approach is proven by community trackers, but the time constraint elevates severity.

---

**Finding Logged**: 2026-04-03 10:54 UTC

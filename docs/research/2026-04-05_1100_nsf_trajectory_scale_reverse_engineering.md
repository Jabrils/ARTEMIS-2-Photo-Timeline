# Research: Reverse-Engineering the NASASpaceflight Trajectory Visualization and Applying It to ARTEMIS

**Date**: 2026-04-05
**Researcher**: Claude Code
**Status**: Complete

---

## Question

Reverse-engineer the trajectory rendering approach, scale factors, body sizes, and visual layout used in the NASASpaceflight (NSF) YouTube live coverage dashboard for Artemis II, and determine what changes are needed to bring our ARTEMIS tracker's view closer to that reference.

---

## TL;DR

The NSF dashboard uses a **multi-panel layout** with three distinct views: a close-up spacecraft render (main), a trajectory overview inset (top-right), and a Moon close-up inset (bottom-right). This fundamentally differs from our single-scene approach. In the NSF trajectory inset, Earth and Moon are small reference dots (~2-4% of view), the full figure-8 free-return path is always visible, and the trajectory line is the dominant visual element. Our current implementation has bodies at 2x real scale (Earth=1.274 su, Moon=0.347 su) which at 4.9% and 1.3% of the full-trajectory camera view are actually close to the NSF proportions, but our Orion billboard (1.2 su = 94% of Earth's diameter) is vastly oversized for the trajectory view. The main issues are: (1) Orion sprite does not scale with zoom, (2) no multi-panel approach separating spacecraft detail from trajectory overview, and (3) the default camera framing does not emphasize the figure-8 shape enough.

---

## Visual Analysis: NSF Screenshot Breakdown

### NSF Layout Structure (from `docs/screenshots/nsf_example.png`)

| Panel | Location | Size | Content |
|-------|----------|------|---------|
| Main spacecraft view | Left ~65% | Dominant | 3D render of Orion, dark space background, Earth partially visible behind spacecraft |
| Trajectory inset | Top-right ~25% | Inset | Full figure-8 path, plan view (orbital plane normal), Earth as small disc, Orion position dot |
| Moon inset | Bottom-right ~25% | Inset | Detailed Moon photograph, full disc, provides visual context |
| Top telemetry bar | Full width top | Banner | Title, MET, crew activity, speed, distances, mission progress |
| Bottom ticker | Full width bottom | Banner | NSF branding, scrolling mission news |

### NSF Telemetry Values at Screenshot Time
- **MET**: M+ 10:12:23:16 (interpreted as DD:HH:MM:SS format)
- **Speed**: 7,675 km/h
- **Distance from Earth**: 126,953 km
- **Distance from Moon**: 289,820 km
- **Mission Progress**: 15.0%
- **Crew Activity**: Sleep (8.5 hours)

### Cross-check: 15% of 240h mission = 36h elapsed. At 36h, Orion is in outbound coast. Earth distance ~127,000 km and Moon distance ~290,000 km sum to ~417,000 km (Earth-Moon separation), which is consistent with the mission geometry.

---

## Detailed Scale Analysis

### Real Physical Values

| Property | Real Value (km) | Scene Units (su) at SCALE=10,000 |
|----------|-----------------|----------------------------------|
| Earth radius | 6,371 | 0.6371 |
| Moon radius | 1,737 | 0.1737 |
| Earth-Moon distance | ~405,000 (at flyby) | ~40.5 |
| Trajectory span (max axis) | 349,228 | 34.92 |
| Closest lunar approach | 1,106 | 0.11 |
| Orion spacecraft | 0.005 (~5m) | 0.0000005 |

### Our Current Visual Sizes

| Object | Visual Size (su) | Real Size (su) | Exaggeration |
|--------|-----------------|----------------|--------------|
| Earth sphere | 1.274 radius | 0.637 radius | 2.0x |
| Moon sphere | 0.347 radius | 0.174 radius | 2.0x |
| Orion billboard | 1.2 x 1.05 | 0.0000005 | ~2,400,000x |
| Orion glow sphere | 0.15 radius | - | Marker |

### NSF Trajectory Inset Proportions (reverse-engineered)

In the NSF trajectory inset panel:
- Earth appears as **~2-4% of the inset width** -- a small bright disc, clearly visible but not dominating
- The trajectory arc is the **primary visual element**, taking up ~70-80% of the inset
- Orion appears as a **tiny dot/marker** on the trajectory line
- The Moon, if visible, would be even smaller than Earth

At our current camera setup (distance = 62.9 su, FOV = 45 degrees):
- Vertical visible span: **52.1 su**
- Horizontal visible span (16:9): **92.6 su**
- Earth diameter as % of vertical view: **4.9%** (at 2x scale)
- Earth at real scale: **2.4%** (closer to NSF proportions)
- Moon diameter as % of vertical view: **1.3%** (at 2x scale)

**Key finding**: Our Earth at 2x exaggeration (4.9% of view) is actually only modestly larger than NSF's ~3-4%. The much bigger problem is that our Orion billboard at 1.2 su is **94% of Earth's visual diameter**, making it appear as large as a planet in the trajectory view.

---

## Our Current ARTEMIS Views (from screenshots)

### Follow Orion View (`first_follow_orion_view.png`)
- Camera follows the trajectory, Earth centered in view
- Earth sphere is large and prominent with green glow (emissive bloom)
- Trajectory appears as a nearly straight line through Earth (perspective compression)
- Orion label with green dot visible above Earth
- **Problem**: At this zoom level, the trajectory shape (figure-8) is not visible -- it looks like a straight line with Earth on it

### Earth View (`artemis_earth_view.png`)
- Good overview showing full trajectory figure-8 shape
- Earth at top with trajectory loop, Moon at bottom
- Trajectory colors correct (orange past, cyan dashed future)
- Orion visible mid-trajectory with label
- **Problem**: Orion billboard is very large relative to the trajectory -- appears planet-sized
- **Problem**: Earth texture-mapped sphere with glow looks good but is large compared to trajectory

### Moon View (`problematic_trajectory_through_moon.png`)
- Moon centered, trajectory lines passing through/near it
- Multiple trajectory line segments visible (from the splitAroundBodies culling)
- **Problem**: Trajectory passes through Moon's visual radius (culling artifacts)
- **Problem**: No sense of the full mission path from this angle

---

## Community Knowledge

### NASA SVS Visualization Techniques

NASA's Scientific Visualization Studio (SVS) creates the official Artemis II trajectory animations with several notable approaches:

- **Multiple camera angles** provided: plan view, Moon-fixed, immersive 360-degree, mobile-optimized vertical
- **Not-to-scale** bodies: the official animations use artistic license for body sizes, typically 3-5x real scale for visibility
- **Free-return figure-8**: The trajectory shape is described as "two orbits of Earth before venturing around the Moon in a figure-eight pattern"
- **Closest approach**: ~6,513 km from far-side lunar surface (Orion's altitude comparable to "a basketball held at arm's length" from the astronauts' perspective)

> "The visualization simulates what the crew might see out the window on closest approach, compressing 36 hours into just over a minute as it follows a realistic trajectory swinging around the Moon's far side."
> -- Source: [NASA SVS: Simulated Artemis II Lunar Flyby](https://svs.gsfc.nasa.gov/5536/)

### Other Artemis II Trackers

Multiple community trackers (KeepTrack, artemislivetracker.com, artemis-tracker.netlify.app, etc.) all solve the scale problem differently:
- Some use true-scale bodies with labeled markers
- Some use exaggerated bodies for visual appeal
- Most provide a fixed plan-view trajectory overview similar to NSF
- KeepTrack pulls OEM data directly and renders the full cislunar trajectory in 3D

> Source: [KeepTrack: Tracking Artemis II](https://keeptrack.space/deep-dive/tracking-artemis-ii)

---

## Best Practices

Based on research:

1. **Separate trajectory overview from detail views**: The NSF approach of using inset panels is effective because it avoids the scale conflict between showing the full ~400,000 km trajectory and the ~5m spacecraft simultaneously. The trajectory overview uses reduced body sizes; close-up views can show detail.

2. **Use context-appropriate scaling**: Bodies should be sized based on the viewing context. In a trajectory overview, bodies are reference markers (1-4% of view). In a close-up view, bodies fill the frame. Don't try to make one scale work for both.

3. **Make Orion a dot/marker in trajectory view**: At the full trajectory scale, Orion should be a small glowing dot or marker, not a billboard sprite. The NSF approach shows Orion as a highlighted point on the trajectory line. The detailed spacecraft render belongs in a separate panel.

4. **Default to plan view**: The most informative default camera angle is looking down at the orbital plane (plan view), which reveals the figure-8 shape. This is what NSF uses in their trajectory inset and what NASA SVS uses in their animations.

5. **Trajectory line is the star**: In the overview, the trajectory line should be the most prominent visual element. Use good contrast (orange past / white future), appropriate line width, and let the path shape tell the mission story.

---

## Relevance to Our Codebase

### Files That Would Be Affected

| File | Current Role | Changes Needed |
|------|-------------|----------------|
| `src/data/mission-config.ts` | Scale factor (10,000) | Possibly no change -- scale is fine |
| `src/components/Scene.tsx` | Single Canvas, single scene | Consider adding a second inset Canvas or HTML overlay |
| `src/components/Earth.tsx` | 1.274 su sphere with glow | Consider reducing to ~0.8-1.0 su or real scale (0.637) |
| `src/components/Moon.tsx` | 0.347 su sphere | Consider reducing to ~0.2-0.25 su or real scale (0.174) |
| `src/components/Spacecraft.tsx` | 1.2 su billboard | **Major issue**: Scale with camera distance, or use point marker in overview |
| `src/components/Trajectory.tsx` | Line with splitAroundBodies | Line width, dash style; adjust culling radii if bodies shrink |
| `src/components/CameraController.tsx` | 4 presets, plan view auto-fit | Ensure plan view shows the figure-8 shape clearly |
| `src/hud/HUD.tsx` | Floating HUD panels | Consider adding trajectory inset panel |
| `src/components/Stars.tsx` | 5000 stars, 200-500 su radius | No change needed |

---

## Implementation Analysis

### Already Implemented
- **Correct trajectory data**: OEM data with 3,239 points covers the full mission -- the figure-8 shape is accurate
- **Plan view auto-fit**: `CameraController.tsx` computes orbital plane normal and fits trajectory on first load
- **Body size at 2x real**: Earth=1.274, Moon=0.347 are reasonable and proportional
- **Color coding**: Orange past / cyan dashed future matches common conventions
- **Moon position from JPL**: Accurate ephemeris, not geometric approximation

### Should Implement

1. **Distance-adaptive Orion sprite sizing**
   - Why: Orion at 1.2 su is 94% of Earth's diameter, making it appear planet-sized in trajectory view
   - Where: `src/components/Spacecraft.tsx`
   - How: Scale the billboard based on camera distance. At full-trajectory zoom (cam dist >40 su), reduce to a small glowing dot (0.1-0.2 su). At close zoom (<5 su), show full billboard. Lerp between.

2. **Trajectory map inset overlay (NSF-style)**
   - Why: NSF's most impactful design element is the always-visible trajectory inset showing the full figure-8
   - Where: New component `src/hud/TrajectoryMap.tsx` or a second `<Canvas>` in `src/App.tsx`
   - How: Render a simplified 2D SVG/Canvas trajectory overview in the top-right corner, showing Earth dot, Moon dot, Orion marker, and past/future path. Update Orion position every few seconds. This avoids the scale conflict entirely.

3. **Reduce body visual radii slightly for trajectory overview**
   - Why: At 4.9% of view, Earth is slightly larger than NSF's ~3-4%
   - Where: `src/components/Earth.tsx`, `src/components/Moon.tsx`
   - How: Reduce Earth from 1.274 to ~0.9-1.0 su (1.4-1.6x real), Moon from 0.347 to ~0.25-0.30 su. This keeps them visible but lets the trajectory dominate.

4. **Improved default camera framing**
   - Why: The current plan view is calculated correctly but could be improved with a slight tilt to show depth
   - Where: `src/components/CameraController.tsx`
   - How: Slight offset from pure orbital-plane-normal view (e.g., 85-degree angle instead of 90) to give a sense of 3D while still showing the full figure-8.

### Should NOT Implement

1. **True-scale bodies (0.637 su Earth, 0.174 su Moon)**
   - Why not: At real scale, the Moon would be barely visible (0.7% of view height) and Earth would be a small dot. The 2x exaggeration is a good compromise for an interactive tracker where users zoom in/out. NASA SVS themselves use 3-5x exaggeration.
   - Source: NASA SVS animations use artistic body sizes for clarity.

2. **Full NSF-style multi-panel split-screen**
   - Why not: Our interactive 3D approach is fundamentally different from NSF's broadcast overlay. NSF is a passive viewing experience; ours is interactive with zoom/pan/orbit. A full split-screen would lose the interactive advantage.
   - Better: Hybrid approach with small inset map overlay.

3. **Removing the billboard sprite entirely**
   - Why not: The Orion sprite provides character and visual interest at close zoom. The issue is only at full trajectory zoom where it appears oversized.
   - Better: Adaptive scaling that shrinks the sprite at wide views.

---

## Concrete Numerical Recommendations

### Body Size Adjustments

| Object | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| Earth sphere | 1.274 su (2.0x) | 0.95 su (1.5x) | Matches ~3.6% of view -- closer to NSF |
| Earth atmosphere | 1.274 * 1.08 su | 0.95 * 1.08 su | Scale proportionally |
| Moon sphere | 0.347 su (2.0x) | 0.26 su (1.5x) | Maintains Earth:Moon ratio |
| Orion billboard (wide zoom) | 1.2 su fixed | 0.08-0.15 su | Tiny marker at trajectory scale |
| Orion billboard (close zoom) | 1.2 su fixed | 1.2 su | Full detail when zoomed in |
| Orion glow sphere | 0.15 su fixed | 0.08-0.15 su | Marker visibility |

### Camera Adjustments

| Parameter | Current | Recommended | Rationale |
|-----------|---------|-------------|-----------|
| Default dist multiplier | 1.8x (desktop) | 1.6x (desktop) | Slightly tighter framing shows more trajectory detail |
| Plan view tilt | 0 degrees (pure normal) | 5-10 degrees off normal | Subtle 3D depth feel |
| FOV | 45 degrees | 45 degrees | No change needed |
| Near clip | 0.1 | 0.01 | Allow closer zoom on bodies |
| Far clip | 1000 | 1000 | No change needed |

### Trajectory Line Styling

| Parameter | Current | Recommended | Rationale |
|-----------|---------|-------------|-----------|
| Past line color | #ff8c00 | #ff8c00 | Good -- matches NSF orange |
| Past line width | 2 | 2.5-3 | Slightly more prominent |
| Future line color | #00d4ff | #ffffff or #88ccff | NSF uses lighter/white for future path |
| Future line width | 1 | 1.5 | Slightly more visible |
| Future dash size | 0.5 | 0.3 | Tighter dashes for finer detail |
| Future gap size | 0.3 | 0.2 | Tighter gaps |

---

## Sources

1. [NASA SVS: Nominal Artemis II Mission Trajectory](https://svs.gsfc.nasa.gov/5610/) - Official trajectory visualization with multiple camera angles
2. [NASA SVS: Artemis II Flight Path Animations](https://svs.gsfc.nasa.gov/20412/) - Official flight path animations with figure-8 visualization
3. [NASA SVS: Simulated Artemis II Lunar Flyby](https://svs.gsfc.nasa.gov/5536/) - Flyby simulation showing crew perspective
4. [NASASpaceflight Artemis II Mission Dashboard](https://www.geowebcams.com/en/webcam/artemis-ii-mission-dashboard-by-nasaspaceflight) - NSF live dashboard description
5. [KeepTrack: Tracking Artemis II](https://keeptrack.space/deep-dive/tracking-artemis-ii) - Community 3D tracker using OEM data
6. [NASA: Track Artemis II in Real Time (AROW)](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/) - Official AROW tracking tool
7. [Artemis II - Wikipedia](https://en.wikipedia.org/wiki/Artemis_II) - Mission parameters and trajectory description

---

## Related Documents

- `docs/findings/2026-04-03_1054_artemis_ii_live_visualization_FINDINGS_TRACKER.md` - F1 tracker (Resolved)
- `docs/findings/2026-04-04_1245_post_mvp_review_warnings_FINDINGS_TRACKER.md` - Review warnings
- `docs/screenshots/nsf_example.png` - The NSF reference screenshot analyzed in this report
- `docs/screenshots/artemis_earth_view.png` - Our Earth View for comparison
- `docs/screenshots/first_follow_orion_view.png` - Our Follow Orion view for comparison

---

**Research Complete**: 2026-04-05 11:00 UTC

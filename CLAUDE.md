# ARTEMIS — Project Context

**Project**: ARTEMIS

---

## Key Documents

- README.md -- Project overview with screenshots
- ARCHITECTURE.md -- System diagram, tech stack, design decisions
- PRD.md -- Requirements, user stories, risks
- IMPLEMENTATION_PLAN.md -- 8-phase build guide
- docs/findings/ -- 9 Findings Trackers (see All Trackers below)

## CI/CD — GitHub Actions

- `.github/workflows/claude-pr-review.yml` -- Automated Wrought code review on every PR (open/sync). Reviews for bugs, security, render loop performance, data pipeline correctness. Posts inline comments + summary (LGTM or BLOCKED).
- `.github/workflows/claude-interactive.yml` -- Responds to `@claude` mentions in issues, PR comments, and reviews.
- **Branch protection** on `master`: PRs required, `review` status check must pass, strict mode (branch must be up-to-date).
- **Secret**: `ANTHROPIC_API_KEY` set as repo secret for CI authentication.

## The Wrought Way of Work

Wrought enforces structured engineering pipelines:

- **Reactive**: `/incident` -> `/investigate` -> `/rca-bugfix` -> implement -> verify
- **Proactive**: `/research` -> `/design` -> `/blueprint` -> implement -> verify
- **Audit**: `/finding` -> `/investigate` or `/design` -> implement -> verify
- **Standalone**: `/safeguard`, `/watchdog`, `/research`, `/analyze`

Start with `/finding` for proactive work or `/incident` for reactive work.
Every significant task gets a Findings Tracker for cross-session memory.

<!-- WROUGHT_ENFORCEMENT_START -->

### Enforcement Rules

1. **Start with `/finding`** — create a Findings Tracker for every significant task
2. **Follow the appropriate pipeline** (see above) — never skip straight to implementation
3. **Every implementation task gets a Findings Tracker** — this is cross-session memory and audit trail
4. **Skip steps only when genuinely unnecessary** (e.g. skip `/investigate` if root cause is already known), never to save time
5. **NEVER offer to skip a pipeline step.** After each skill completes, suggest ONLY the next skill in the pipeline sequence. Do not offer to implement directly, do not offer to combine steps, do not offer shortcuts. Do not add commentary suggesting a step might be unnecessary or could be skipped.
6. **ALL implementation MUST go through `/wrought-implement` (proactive) or `/wrought-rca-fix` (reactive). NEVER edit files directly to implement changes — no matter how the request is phrased.** This includes when the user says "implement this plan", pastes a detailed plan with code snippets, or gives explicit file-by-file instructions. The correct response is ALWAYS to invoke the loop command. After the loop completes and tests pass, run `/forge-review --scope=diff` to verify code quality. **If you find yourself about to use the Edit/Write tool to implement a planned change without having invoked `/wrought-implement` or `/wrought-rca-fix` first, STOP — you are violating this rule.**
7. **Do NOT use `EnterPlanMode` directly.** Use the appropriate pipeline skill (`/investigate`, `/rca-bugfix`, `/design`, `/blueprint`, etc.). `EnterPlanMode` is only used within the `/plan` step when consuming an implementation prompt — never as the first action for a new task.

## Compact Instructions

When compacting this conversation, always preserve:
- The active Findings Tracker path and finding number (e.g., F2 in docs/findings/...TRACKER.md)
- The current pipeline stage (research -> design -> blueprint -> plan -> /wrought-implement -> /forge-review)
- Any file paths being actively modified or created
- The current session number
- Design decisions and their rationale
- Any acceptance criteria or verification checks in progress
- NEVER implement changes by editing files directly — ALL implementation MUST go through `/wrought-implement` or `/wrought-rca-fix`
- After implementation completes, run `/forge-review --scope=diff` for code quality verification
- For Defect/Bug findings, follow the reactive pipeline. For Gap/Debt/Drift, follow the proactive pipeline. Do NOT use EnterPlanMode directly.
- If `.claude/bridge/precompact-recovery.md` exists, read it for in-flight state
<!-- WROUGHT_ENFORCEMENT_END -->

---

<!-- SESSION_CONFIG_START -->
user_name: FluxForge AI
project_name: ARTEMIS
timezone: SAST
session_docs: []
<!-- SESSION_CONFIG_END -->

<!-- SESSION_HANDOFF_START -->
@NEXT_SESSION_PROMPT_2026-04-06_1226.md
<!-- SESSION_HANDOFF_END -->

---

**Last Updated**: 2026-04-06
**Last Session**: Session 6 -- Tracker reconciliation (32 stale statuses corrected across 6 trackers), milestone position accuracy fix (10/19 wrong, NASA-verified timings, TLI Burn 1.75h→25.23h, 19→18 milestones), mobile responsiveness verified (all 15 already implemented), project docs overhauled. 1 commit, 18 files, ~1,050 lines.

## All Trackers (as of Session 6 start)

| Tracker | Findings | Status |
|---------|----------|--------|
| Artemis II Live Visualization | F1-F3 | All Verified |
| Camera & UX Refinement | F1-F2 | All Verified |
| Multimodal Chatbot | F1 | Verified |
| Chatbot Security & Quality | F1-F10 | All Verified |
| Post-MVP Visual & Data Features | F1-F3 | All Resolved |
| Post-MVP Review Warnings | F1-F6 | All Resolved (Session 5) |
| Visual Scale & NSF Proportions | F1-F3 | F1 Resolved, F2 Removed, F3 Resolved |
| UI & Visual Regressions (Session 5) | F1-F5 | All Resolved |
| Frontend Display & Mobile | F1-F15 | All Resolved |

**Totals**: 51 findings across 9 trackers. **All 51 resolved/verified. Zero open findings.**

## Known Limitations

- Earth/Moon rendered as 3D spheres with equirectangular textures (no atmosphere shader or day/night terminator)
- Orion rendered as billboard sprite with distance-adaptive scaling (not a 3D model)
- Gemini image generation returns errors — chatbot falls back to NASA Image search for visual requests
- Moon position uses bundled JPL ephemeris (static for April 2-11 2026 window — not live)
- Mobile responsiveness implemented (progressive disclosure, responsive sizing, touch targets, z-index system) but not visually verified on real devices
- No safe-area-inset support for notched devices
- No dynamic viewport height (100vh not 100dvh)

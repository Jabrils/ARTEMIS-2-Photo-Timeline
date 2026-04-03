---
name: safeguard
description: "Environment profile classification. Classifies a project's deployment environment (Zero/A/B/C) and deployment paradigm (Docker/Non-Docker/Hybrid). Produces a persistent profile consumed by all downstream skills."
disable-model-invocation: false
argument-hint: "[project-path]"
wrought:
  version: "1.0"
  tools:
    capabilities:
      - read_file
      - search_content
      - find_files
      - write_file
  platforms:
    claude-code:
      disable-model-invocation: false
  agent:
    role: "Environment Profiler"
    expertise:
      - "environment classification"
      - "deployment paradigm detection"
      - "infrastructure assessment"
    non_goals:
      - "implementing infrastructure changes"
      - "modifying deployment configurations"
  execution:
    default_mode: react
    max_iterations: 10
    stop_conditions:
      - "Environment profile written to docs/analysis/"
      - ".wrought directory updated"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/analysis/{YYYY-MM-DD_HHMM}_{project}_environment_profile.md"
    required_sections:
      - "Environment Profile"
      - "Deployment Paradigm"
      - "Evidence"
      - "Recommendations"
  pipeline:
    track: standalone
    standalone: true
    prerequisites: []
    produces:
      - "docs/analysis/*_environment_profile.md"
      - ".wrought/profile.json"
    suggested_next: []
---

# /safeguard — Environment Profile Classification

**Trigger**: `/safeguard {mode}` where mode is `detect`, `check`, or `recommend`.

**Purpose**: Classify a target project's deployment environment profile (Zero/A/B/C) and deployment paradigm (Docker/Non-Docker/Hybrid). Produces a persistent profile document consumed by all downstream skills across all three pipelines (reactive, proactive, audit).

**Examples**:
- `/safeguard detect` — Full environment profiling from scratch
- `/safeguard check` — Re-validate an existing profile against current state
- `/safeguard recommend` — Generate actionable improvement guidance based on profile

---

## Pre-flight Check

This skill is **standalone** — it can be invoked at any time without prerequisites.

If this invocation is part of an active workflow, check `docs/findings/*_FINDINGS_TRACKER.md`
for a relevant tracker and note it for context, but do not enforce stage requirements.

---

## Modes

| Mode | What It Does | Requires Existing Profile |
|------|-------------|:---:|
| `detect` | Full environment profiling: scan codebase, classify profile, write artifacts | No |
| `check` | Re-validate existing profile against current codebase state | Yes |
| `recommend` | Generate prioritized improvement recommendations | Yes |

---

## Design Principles

1. **Evidence-based**: Classification is driven by file scanning + user confirmation, not assumptions. Every indicator is verified against the codebase with ambiguities resolved via interactive checkpoints.

2. **Non-blocking**: The safeguard profile is optional. All Wrought skills work without it. When a profile exists, downstream skills can optionally read it for enrichment — but never require it.

3. **Cumulative taxonomy**: Profiles are cumulative — Profile Zero is a subset of A, A is a subset of B, B is a subset of C. A project classified as Profile B meets all Profile A requirements plus its own.

4. **AI-driven classification**: Profile determination requires judgment (e.g., "Is this Docker for the app or just dependencies?", "Is this CI limited or comprehensive?"). Classification logic is in this SKILL.md, not in CLI code.

---

## Language Scope

The detection matrix is currently scoped to **Python projects**:
- SIGTERM handling: `signal.signal(signal.SIGTERM`, `loop.add_signal_handler(signal.SIGTERM`
- Long-lived work: Celery, APScheduler, Huey, arq
- Process managers: systemd, supervisord (Python-common)

Language-agnostic indicators (Docker, CI/CD, compose files, pre-commit hooks, health endpoints) work for any language.

**Future extension**: Detection matrix entries for Node.js (`process.on('SIGTERM')`), Go (`signal.Notify`), Java (`Runtime.addShutdownHook`), Rust (`ctrlc` crate) can be added as Wrought expands language support. Each language addition is additive — existing Python detection is preserved.

---

## Related Skills

### `/safeguard detect` and `/analyze discover`

Both produce shared artifacts consumed by downstream skills:
- `/analyze discover` produces `system-map.md` (system components, dependencies, code metrics)
- `/safeguard detect` produces `docs/analysis/*_environment_profile.md` (deployment environment, SDLC maturity)

**Relationship**:
- `/safeguard detect` DOES NOT require the System Map (runs independently at onboarding)
- `/analyze discover` DOES NOT require the environment profile (runs independently)
- If both exist, each can optionally read the other for enrichment (not enforced)
- Recommended order: `/safeguard detect` first (broader context), then `/analyze discover` (detailed mapping) — but not enforced

They are **independent skills with optional enrichment**, not a dependency chain.

---

## Mode: Detect

Full environment profiling. Scans the codebase, classifies the deployment environment, and writes profile artifacts.

### Step 1: Check for Existing Profile

Glob for `docs/analysis/*_environment_profile.md`.

**IF exists**: Read profile. **CP1 — Existing Profile**: "An existing profile classifies this project as Profile {X} ({paradigm}). What would you like to do?"
→ Re-classify from scratch | Adjust existing classification | Run check mode instead | Cancel

If "Cancel" or "Run check mode": exit detect or switch to check mode respectively.

**ELSE**: Proceed to Step 2.

### Step 2: Detection Matrix Scan

Scan the codebase for all 12 indicators from the Detection Matrix (see below). For each indicator:
1. Run the specified detection method (Glob or Grep)
2. Record what was found (files, patterns, locations)
3. Record what was NOT found (absence is evidence too)

Compile results into a summary table.

### Step 3: CP2 — Clarify Ambiguities

Present scan results. Ask context-specific questions for ambiguities (Docker for app vs dependencies, CI scope, inactive configs, environment count).

### Step 4: Classification Logic

Apply the Classification Logic (see below) to determine:
- **Profile level**: Zero, A, B, or C
- **Deployment paradigm**: Docker, Non-Docker, or Hybrid

Use the evidence from Step 2 and clarifications from Step 3.

### Step 5: CP3 — Confirm Classification

**CP3**: "Based on the evidence, I'd classify this as Profile {X} ({paradigm}). Justification: {brief}. Is this correct?"
→ Yes, accurate | Profile should be higher | Profile should be lower | Paradigm is wrong

If the user disagrees, adjust and note the override reason.

### Step 6: Write Profile Document

Write the profile document to `docs/analysis/{YYYY-MM-DD_HHMM}_environment_profile.md` using the Profile Document Template (see below).

Include:
- Classification Summary table (all 12 indicators with evidence)
- Profile Justification (why this profile, what was ambiguous)
- Gap Analysis (requirements vs current state)
- Manual Override section (M3)
- Recommended Deployment Safety Pattern
- Next Steps

### Step 7: Write `.wrought` Safeguard Fields

Update the `.wrought` marker file with safeguard fields:

```
safeguard_version=1
safeguard_profile={Zero|A|B|C}
safeguard_paradigm={docker|non-docker|hybrid}
safeguard_last_run={ISO-8601 timestamp}
safeguard_created={ISO-8601 timestamp}
safeguard_override=none
```

Read the existing `.wrought` file, preserve all non-safeguard fields, and write back with updated safeguard fields.

### Step 8: CP4 — Route Gaps (Optional)

If gaps were identified in Step 6:

**CP4**: "I found {N} gaps against Profile {X} requirements. Most significant: {top gap}. Route to /finding?"
→ Yes, log as findings | Note in profile only | No — I'm aware

**If "Yes"**: Directly invoke `/finding` with gap descriptions from Step 6. This is a user-approved in-skill action. After `/finding` completes, return to Step 9.

### Step 9: Handoff Summary + STOP

Print the classification summary:

```
Profile classified: Profile {X} ({paradigm})
Profile document: docs/analysis/{YYYY-MM-DD_HHMM}_environment_profile.md
.wrought marker: updated with safeguard fields

Summary:
- {Key finding 1}
- {Key finding 2}
- {Key finding 3}

{If gaps were routed to /finding: "Gaps logged as findings in tracker: {path}"}
{If gaps noted but not logged: "{N} gaps noted in profile document. To formally track them: /finding {brief gap summary}"}
{If no gaps: "No gaps detected against Profile {X} requirements"}
```

**STOP.** Do NOT proceed beyond this skill. Await further instructions from the user.

---

## Mode: Check

Re-validate an existing profile against the current codebase state. Detects drift since the last classification.

### Step 1: Read Existing Profile

Glob for `docs/analysis/*_environment_profile.md`.

**IF not found**: Print error message and STOP.

> "No existing environment profile found. Run `/safeguard detect` first to create one."

**ELSE**: Read the profile document and the `.wrought` marker.

### Step 2: Re-scan Detection Matrix

Run the same 12-indicator scan from the Detection Matrix. Record current state for each indicator.

### Step 3: Compare Current vs Recorded State

Compare each indicator's current state against the recorded state in the profile document's Classification Summary table. Flag any changes:
- New indicators detected (e.g., CI/CD added since last classification)
- Indicators removed (e.g., Docker removed)
- Indicators changed (e.g., new environments added)

### Step 4: Report Changes or Confirm

**IF no changes detected**:

> "Profile still valid. Profile {X} ({paradigm}) confirmed. No drift detected."

**IF changes detected**:

**CP5**: "Changes detected: {changes}. Impact: {assessment}."
→ Update profile to {Y} | Keep current profile | Run full detect

### Step 5: Update `.wrought` Timestamp

Update `safeguard_last_run` in the `.wrought` marker to the current ISO-8601 timestamp. All other fields remain unchanged unless the profile was updated.

**STOP.** Await further instructions.

---

## Mode: Recommend

Generate actionable improvement recommendations based on the existing profile.

### Step 1: Read Existing Profile

Glob for `docs/analysis/*_environment_profile.md`.

**IF not found**: Print error message and STOP.

> "No existing environment profile found. Run `/safeguard detect` first to create one."

**ELSE**: Read the profile document.

### Step 2: Generate Recommendations by Profile Level

Based on the detected profile and its gap analysis, generate prioritized recommendations:

- **Profile Zero**: Focus on adding basic deployment safety (SIGTERM handling, pre-commit hooks, environment separation)
- **Profile A**: Focus on adding test environment, CI/CD basics, deployment scripts with safety gates
- **Profile B**: Focus on strengthening CI/CD, adding rollback mechanisms, monitoring
- **Profile C**: Focus on audit trails, compliance automation, advanced deployment patterns

### Step 3: Write Recommendations Artifact

Write recommendations to `docs/analysis/{YYYY-MM-DD_HHMM}_safeguard_recommendations.md` using the Recommendations Template (see below).

### Step 4: Handoff Summary + STOP

```
Recommendations generated: docs/analysis/{YYYY-MM-DD_HHMM}_safeguard_recommendations.md
Based on: Profile {X} ({paradigm})

Top priorities:
1. {Immediate recommendation}
2. {Short-term recommendation}
3. {Strategic recommendation}
```

**STOP.** Await further instructions.

---

## Detection Matrix

12 indicators, Python-scoped per Language Scope section.

| # | Indicator | Detection Method | What It Tells Us |
|---|-----------|-----------------|------------------|
| 1 | Docker presence | Glob: `Dockerfile`, `docker-compose*.yml`, `.dockerignore` | Docker vs non-Docker paradigm |
| 2 | Environment count | Glob: multiple compose files (`.dev.yml`, `.prod.yml`, `.rc.yml`), deployment scripts with env flags, separate config dirs | Profile Zero (1) vs A (2) vs B (3+) |
| 3 | CI/CD presence | Glob: `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `.circleci/`, `bitbucket-pipelines.yml` | Profile C indicator |
| 4 | Pre-commit hooks | Glob: `.pre-commit-config.yaml` | Profile Zero safety gate |
| 5 | SIGTERM handling | Grep (Python): `signal.signal(signal.SIGTERM`, `loop.add_signal_handler(signal.SIGTERM` | Universal prerequisite (all profiles) |
| 6 | Grace period config | Grep: `stop_grace_period` (compose), `TimeoutStopSec` (systemd), `stopwaitsecs` (supervisord) | Profile A+ requirement |
| 7 | Process manager | Glob: systemd unit files (`*.service`), supervisord conf, `Procfile` | Non-Docker deployment mechanism |
| 8 | Deployment scripts | Glob/Grep: shell scripts with `docker compose`, `deploy`, `promote` in name or content | Existing deployment infrastructure |
| 9 | Long-lived work (Python) | Grep: Celery, APScheduler, Huey, arq imports; infinite loop patterns | Determines if graceful shutdown matters |
| 10 | Health endpoints | Grep: `/health`, `/healthz`, `/api/health`, readiness probes | Existing monitoring infrastructure |
| 11 | Rollback mechanisms | Glob: git tag patterns, image versioning, `.last-deploy` files, blue/green configs | Profile B+ indicator |
| 12 | Approval workflows | Glob/Read: branch protection rules, required reviewers, deployment gates in CI config | Profile C indicator |

### Edge Cases

- A `docker-compose.yml` running only PostgreSQL/Redis is Docker for **dependencies**, not Docker for the **app** — use AskUserQuestion to clarify the distinction
- A `.github/workflows/ci.yml` running only linting is **limited CI**, not full CI/CD — note the distinction in the classification
- A `Procfile` or deployment script that hasn't been used in months — ask if it's **actively used** before counting it as evidence

---

## Classification Logic

### Profile Zero — DEV-Only

- No Docker for the application (may use Docker for dependencies)
- Single environment (no promotion pipeline)
- No deployment scripts targeting remote environments
- Development-stage project

### Profile A — Minimal SDLC (DEV + PROD)

- Two environments (local + deployed, or DEV + PROD)
- Docker or process manager for deployment
- No dedicated TEST/UAT environment
- Limited or no CI/CD

### Profile B — Typical SDLC (DEV + TEST + PROD)

- Three or more environments
- CI/CD pipeline exists (may not be comprehensive)
- Deployment scripts with some safety gates
- Test environment for validation before production

### Profile C — Strong SDLC

- Full CI/CD with required checks
- Branch protection and approval workflows
- Multiple environments with promotion gates
- Audit trails, signed releases, or automated rollback

**Cumulative rule**: Each profile includes all requirements of the profile below it. A Profile B project meets all Profile A requirements plus its own.

### Paradigm Determination

- **Docker**: Application itself runs in containers (not just dependencies)
- **Non-Docker**: Application runs via process manager, systemd, or direct execution
- **Hybrid**: Application uses containers for some components and direct execution for others

---

## Output: Profile Document Template

**Path**: `docs/analysis/{YYYY-MM-DD_HHMM}_environment_profile.md`

Sections (in order):
1. **Header**: Title, date, classified by, profile, paradigm, Wrought version
2. **Classification Summary**: Table with all 12 indicators (Dimension | Detected | Evidence)
3. **Profile Justification**: Why this profile, what was ambiguous, how resolved
4. **Gap Analysis**: Table (Requirement | Required By | Current State | Gap? | Recommendation) covering SIGTERM, grace period, pre-commit, in-flight work, health endpoints, graceful shutdown, CI/CD, audit trail, rollback, approval workflows
5. **Manual Override**: Override field (`safeguard_override=none|Zero|A|B|C` in `.wrought`), reason, date. Instructions for overriding.
6. **Recommended Deployment Safety Pattern**: Profile + paradigm specific pattern references
7. **Next Steps**: If gaps exist, suggest `/finding` to formally track them. If healthy, confirm status. If near next profile threshold, suggest upgrade path.

---

## Output: Recommendations Template

**Path**: `docs/analysis/{YYYY-MM-DD_HHMM}_safeguard_recommendations.md`

Sections (in order):
1. **Header**: Title, date, generated by, based on profile, profile document path
2. **Priority Recommendations**: Immediate (this week), Short-term (this sprint), Strategic (this quarter)
3. **Profile-Specific Guidance**: Detailed recommendations based on profile level
4. **Gap Closure Plan**: For each gap — what to implement, where, how, and verification

---

## Flags

No flags defined. Future: `--force` (skip interactive checkpoints).

---

## After Classification

**STOP.** Do NOT proceed beyond this skill's scope. After any mode completes, print the handoff summary and wait for user instructions. Do NOT automatically run other skills or start implementations — EXCEPT when the user explicitly approves gap routing to `/finding` in Step 8 (detect mode), which is a user-gated in-skill action.

Suggest next steps based on context:
- If gaps were found and routed to `/finding`: "Run `/investigate F{N}` to begin resolving the highest-severity gap"
- If gaps were found but NOT routed: "Run `/finding {gap summary}` to formally track and resolve the gaps"
- If no gaps were found: "Run `/analyze discover` for detailed system mapping, or `/safeguard recommend` for improvement guidance"

---

## Integration: Profile-Aware Enhancement Pattern

Downstream skills that want to leverage the environment profile:

1. Glob for `docs/analysis/*_environment_profile.md`
2. If found: read Classification Summary, extract Profile level and Paradigm
3. Append a "Profile-Aware Recommendations" section at the END of output
4. If not found: skip entirely — all skills work without it

Profile awareness is always **additive and optional**.

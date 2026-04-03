---
name: genesis
description: "Greenfield project onboarding wizard. Guides through 3-phase structured bootstrapping: Discovery Interview, Business Analysis, Systems Analysis. Produces discovery notes, PRD, and ARCHITECTURE.md. Supports greenfield (interview) and brownfield (codebase analysis) modes with cross-session resumption."
disable-model-invocation: false
argument-hint: "[--brownfield|--demo] <project description>"
wrought:
  version: "1.0"
  tools:
    capabilities:
      - read_file
      - search_content
      - find_files
      - write_file
      - run_command
  platforms:
    claude-code:
      disable-model-invocation: false
  agent:
    role: "Project Inception Architect"
    expertise:
      - "requirements elicitation"
      - "business analysis"
      - "systems architecture"
      - "project bootstrapping"
    non_goals:
      - "writing application code"
      - "setting up CI/CD pipelines"
      - "configuring deployment infrastructure"
  execution:
    default_mode: react
    max_iterations: 15
    stop_conditions:
      - "All 3 phases complete and artifacts written"
      - "User instructed to stop"
      - "User chose to skip remaining phases"
  output:
    format: markdown
    template: "docs/genesis/{project}_discovery.md"
    required_sections:
      - "Discovery Notes"
      - "PRD"
      - "Architecture"
  pipeline:
    track: standalone
    standalone: true
    prerequisites: []
    produces:
      - "docs/genesis/*_discovery.md"
      - "docs/genesis/*_progress.json"
      - "PRD.md"
      - "ARCHITECTURE.md"
    suggested_next:
      - safeguard
---

# /genesis — Greenfield Project Onboarding Wizard

**Trigger**: `/genesis [--brownfield] <project description>`

**Purpose**: Guide structured project bootstrapping through 3 phases — Discovery Interview, Business Analysis, and Systems Analysis. Produces concrete artifacts that downstream Wrought skills consume: a discovery document, PRD, and architecture document.

**Modes**:
- **Greenfield** (default): Interactive 5-question discovery interview
- **Brownfield** (`--brownfield`): Analyze existing codebase instead of interviewing
- **Demo** (`--demo`): Scaffold a guided demo project showcasing a Wrought pipeline

**Examples**:
- `/genesis Kuda Data Connector — REST API for banking data aggregation`
- `/genesis --brownfield existing-saas-app`
- `/genesis --demo`

---

## Pre-flight: Resumption Check

**Step 1**: Parse the argument.

- If argument contains `--demo`, set mode to `demo`; skip to Demo Mode section below
- If argument contains `--brownfield`, set mode to `brownfield`; otherwise `greenfield`
- Extract project description (everything after `--brownfield` if present, or the full argument)
- Derive project slug: lowercase, replace spaces/hyphens with underscores, strip special characters
  - Example: "Kuda Data Connector" -> `kuda_data_connector`

**Step 2**: Check for existing state file.

Use Glob to search for `docs/genesis/*_progress.json`.

**IF a state file exists** with incomplete phases:
1. Read the state file
2. Print: "Found existing genesis state for **{project}**. Resuming from phase: **{next_incomplete_phase}**."
3. Skip to the first incomplete phase

**IF a state file exists** with all phases complete:
1. Print: "Genesis already complete for **{project}**. All artifacts exist."
2. Use AskUserQuestion: "What would you like to do?"
   - "Start fresh (new project)" — proceed as new project
   - "Re-run a specific phase" — ask which phase, then run just that phase
   - "Done — show artifact summary" — skip to Completion section

**IF no state file found**: Proceed to Phase 1 (fresh start).

**Step 3**: Create `docs/genesis/` directory if it doesn't exist.

**Step 4**: Initialize the state file at `docs/genesis/{project_slug}_progress.json`:

```json
{
  "project": "{project_slug}",
  "description": "{original project description}",
  "mode": "greenfield|brownfield",
  "started_at": "{ISO-8601 timestamp}",
  "phases": {
    "discovery": { "status": "pending", "artifact": null, "completed_at": null },
    "business_analysis": { "status": "pending", "artifact": null, "completed_at": null },
    "systems_analysis": { "status": "pending", "artifact": null, "completed_at": null }
  }
}
```

---

## Phase 1: Discovery Interview (Greenfield Mode)

> Skip this section if mode is `brownfield` — go to Phase 1B instead.

Conduct a structured 5-question interview to understand the project. Use AskUserQuestion for each checkpoint.

### CP1 — Problem Domain & Users

Use AskUserQuestion: "What problem does this project solve, and who are the target users?"
- "Consumer-facing product" — follow up on user personas
- "Internal/enterprise tool" — follow up on team roles
- "API/service for developers" — follow up on integration patterns
- "Infrastructure/platform" — follow up on operational context

Capture: problem statement, target user profiles, key pain points.

### CP2 — MVP Scope & Constraints

Use AskUserQuestion: "What's the minimum viable scope? Any hard constraints?"
- "I have a clear MVP in mind" — ask them to describe it
- "I need help scoping" — explore features and suggest MVP boundary
- "I have a deadline" — capture timeline constraint, work backwards
- "Budget/resource constrained" — capture resource limits

Capture: MVP feature list, explicit constraints, non-goals.

### CP3 — Technology Preferences

Use AskUserQuestion: "Any technology preferences or constraints?"
- "I have strong preferences" — capture specific stack choices
- "Open to suggestions" — note for Phase 3 to recommend
- "Must integrate with existing stack" — capture existing tech
- "Greenfield — no constraints" — note full flexibility

Capture: language, framework, database, hosting preferences or constraints.

### CP4 — Deployment & Integrations

Use AskUserQuestion: "Where will this be deployed? What external systems does it integrate with?"
- "Cloud (AWS/GCP/Azure)" — capture provider and services
- "Self-hosted/on-prem" — capture infrastructure details
- "Don't know yet" — note for Phase 3 to recommend
- "Serverless/edge" — capture platform preferences

Capture: deployment target, external APIs/services, data sources.

### CP5 — Timeline & Team

Use AskUserQuestion: "What's the timeline and team context?"
- "Solo developer" — note capacity constraints
- "Small team (2-5)" — ask about roles and experience
- "Larger team" — ask about org structure and processes
- "No fixed timeline" — note for flexible planning

Capture: team size, experience level, timeline, development process preferences.

### Synthesize Discovery Document

After all 5 checkpoints, write `docs/genesis/{project_slug}_discovery.md`:

```markdown
# Discovery: {Project Name}

**Date**: {YYYY-MM-DD}
**Mode**: Greenfield
**Project**: {description}

## Problem Domain
{Synthesized from CP1}

## Target Users
{User profiles from CP1}

## MVP Scope
{Features and boundaries from CP2}

## Constraints
{Hard constraints from CP2}

## Technology Preferences
{Stack preferences from CP3}

## Deployment & Integrations
{Deployment target and integrations from CP4}

## Team & Timeline
{Team context from CP5}

## Open Questions
{Any unresolved items for Phase 2/3 to address}
```

Update state file: `discovery.status` -> `"complete"`, `discovery.artifact` -> path, `discovery.completed_at` -> timestamp.

---

## Phase 1B: Discovery Analysis (Brownfield Mode)

> Only execute this section if mode is `brownfield`. Skip if greenfield.

Analyze the existing codebase to generate a discovery document.

### Automated Analysis

Scan the codebase using these tools:

1. **Language & Framework**: Glob for `*.py`, `*.js`, `*.ts`, `*.go`, `*.rs`, `*.java`. Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle` to identify framework.
2. **Project Structure**: Glob for `src/**`, `app/**`, `lib/**`. Note directory organization.
3. **Dependencies**: Read package manifest. Identify key libraries.
4. **Tests**: Glob for `tests/`, `test/`, `*_test.*`, `*.test.*`, `*.spec.*`. Identify test framework.
5. **CI/CD**: Glob for `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`.
6. **Documentation**: Read `README.md`, any `docs/` content, architecture docs.
7. **API/Endpoints**: Grep for route definitions, API endpoints, GraphQL schemas.

### CP-B1 — Validate Findings

Present analysis summary to user via AskUserQuestion: "Here's what I found about your codebase. Is this accurate?"
- "Yes, that's correct" — proceed with findings as-is
- "Mostly correct, minor adjustments" — ask for corrections
- "Missing important context" — ask what's missing
- "Significantly wrong" — ask for correct description

Incorporate feedback into discovery document.

### Write Discovery Document

Write `docs/genesis/{project_slug}_discovery.md` with the same structure as greenfield, but populated from codebase analysis:

```markdown
# Discovery: {Project Name}

**Date**: {YYYY-MM-DD}
**Mode**: Brownfield (codebase analysis)
**Project**: {description}

## Codebase Overview
{Language, framework, structure from analysis}

## Current Architecture
{Component organization, key modules}

## Dependencies & Integrations
{Key libraries, external services}

## Test Coverage
{Test framework, test organization}

## CI/CD & Deployment
{Pipeline configuration, deployment setup}

## Documentation State
{Existing docs found}

## Identified Gaps
{Missing docs, unclear areas, potential issues}
```

Update state file: `discovery.status` -> `"complete"`, set artifact and timestamp.

---

## Phase 2: Business Analysis

Read the Phase 1 artifact: `docs/genesis/{project_slug}_discovery.md`.

Generate a PRD with these sections: personas, user stories with acceptance criteria, MoSCoW prioritization, and non-functional requirements.

### CP6 — User Stories & Acceptance Criteria

Present the draft user stories and acceptance criteria. Use AskUserQuestion: "Here are the proposed user stories and acceptance criteria. How do they look?"
- "Looks good, proceed" — continue as-is
- "Need to add stories" — capture additions
- "Need to modify stories" — capture changes
- "Too many — reduce scope" — trim to essentials

### CP7 — Feature Prioritization

Present MoSCoW prioritization of features. Use AskUserQuestion: "Here's the proposed feature prioritization. Does this match your vision?"
- "Priorities are correct" — proceed
- "Reprioritize some items" — capture changes
- "Add must-haves" — promote items
- "Simplify further" — reduce scope

### Write PRD

**Before writing**: Check if `PRD.md` exists in project root.

**IF exists**: Use AskUserQuestion: "A PRD.md already exists. What would you like to do?"
- "Overwrite with new PRD" — proceed with write
- "Skip PRD generation" — skip to Phase 3
- "Merge — keep existing and add new sections" — read existing, merge content

Write `PRD.md` to the project root:

```markdown
# Product Requirements Document: {Project Name}

**Version**: 1.0
**Date**: {YYYY-MM-DD}
**Generated by**: Wrought /genesis

## Product Overview
{From discovery: problem domain, target users}

## User Personas
{Synthesized from discovery}

## User Stories

### Must Have (M)
{User stories with acceptance criteria}

### Should Have (S)
{User stories with acceptance criteria}

### Could Have (C)
{User stories with acceptance criteria}

### Won't Have (W) — This Release
{Explicitly out of scope}

## Non-Functional Requirements
{Performance, security, scalability, accessibility requirements}

## Success Metrics
{How to measure if the project is successful}
```

Update state file: `business_analysis.status` -> `"complete"`, set artifact and timestamp.

---

## Phase 3: Systems Analysis

Read Phase 1 artifact (`docs/genesis/{project_slug}_discovery.md`) and Phase 2 artifact (`PRD.md`).

Generate an architecture document covering: tech stack, component architecture, data model, deployment strategy, and security considerations.

### CP8 — Tech Stack

Present the proposed tech stack with rationale. Use AskUserQuestion: "Here's the proposed technology stack. Does this align with your preferences?"
- "Stack looks good" — proceed
- "Change some technologies" — capture preferences
- "I have strong opinions on {X}" — capture and adjust
- "Recommend what's best" — use your judgment based on requirements

### CP9 — Architecture & Data Model

Present the component architecture and data model. Use AskUserQuestion: "Here's the proposed system architecture and data model. How does it look?"
- "Architecture is solid" — proceed
- "Needs changes" — capture modifications
- "Too complex — simplify" — reduce components
- "Too simple — needs more" — add components

### Write ARCHITECTURE.md

**Before writing**: Check if `ARCHITECTURE.md` exists in project root.

**IF exists**: Use AskUserQuestion: "An ARCHITECTURE.md already exists. What would you like to do?"
- "Overwrite with new architecture" — proceed with write
- "Skip architecture generation" — skip to Completion
- "Merge — extend existing" — read existing, merge content

Write `ARCHITECTURE.md` to the project root:

```markdown
# Architecture Document: {Project Name}

**Version**: 1.0
**Date**: {YYYY-MM-DD}
**Generated by**: Wrought /genesis

## System Overview
{High-level description and diagram}

## Technology Stack
{Language, framework, database, hosting — with rationale for each choice}

## Component Architecture
{Major components, their responsibilities, and how they interact}

## Data Model
{Core entities, relationships, storage strategy}

## API Design
{Endpoints, protocols, authentication — if applicable}

## Deployment Architecture
{Infrastructure, environments, CI/CD approach}

## Security Considerations
{Authentication, authorization, data protection, common vulnerabilities}

## Scalability & Performance
{Caching strategy, expected load, scaling approach}

## Development Setup
{How to get the project running locally}
```

Update state file: `systems_analysis.status` -> `"complete"`, set artifact and timestamp.

---

## Completion & Pipeline Handoff

All 3 phases are complete. Update the state file with all phases marked complete.

Print the artifact summary:

```
Genesis complete for {Project Name}!

Artifacts produced:
  1. docs/genesis/{project_slug}_discovery.md  — Discovery notes
  2. PRD.md                                     — Product requirements
  3. ARCHITECTURE.md                            — System architecture
  4. docs/genesis/{project_slug}_progress.json  — Genesis state (all phases complete)

Next steps:
  1. Run /safeguard detect — profile your deployment environment
  2. Start building with the Wrought pipeline:
     - /finding to track work items
     - /research, /design, /blueprint for proactive development
     - /wrought-implement for autonomous implementation

Note: Phases 4-7 (Implementation Planning, Conventions, GitHub Population,
Environment Profiling) will be available in Wrought V1.1.
```

**STOP.** Do NOT proceed beyond this skill. Await further instructions from the user.

---

## Flags

| Flag | Effect |
|------|--------|
| `--brownfield` | Analyze existing codebase instead of running the discovery interview. Phase 1 uses Glob/Grep/Read instead of AskUserQuestion checkpoints. |
| `--demo` | Present demo project picker. Scaffolds a pre-built project with a guided walkthrough instead of running the discovery interview. |

---

## Demo Mode

> Only execute this section if mode is `demo`. Skip all genesis phases (1-3) and Completion.

### Step D1: Present Demo Picker

Use AskUserQuestion: "Which demo would you like to try?"
- "Build a REST API (Proactive pipeline, ~30min) — Build a task management API from scratch using /finding → /design → /blueprint → /implement → /review"
- "Fix a Production Bug (Reactive pipeline, ~20min) — Find and fix a race condition using /incident → /investigate → /rca-bugfix → /rca-fix → /review"
- "Audit a Legacy Codebase (Audit pipeline, ~40min) — Audit an Express.js app for security and quality issues using /analyze → /finding → /investigate → /fix → /review"

Map selection to demo file:
- REST API → `skills/genesis/demos/rest_api.md`
- Bug Fix → `skills/genesis/demos/bug_fix.md`
- Audit → `skills/genesis/demos/audit.md`

### Step D2: Scaffold Demo Project

1. Read the selected demo file
2. Create project directory: `demo-rest-api/`, `demo-bug-fix/`, or `demo-audit/`
3. For each `<!-- file: {path} -->` marker in the demo file, extract the immediately following code block and write it to `{project_dir}/{path}`
4. Extract the content between `<!-- walkthrough -->` and `<!-- /walkthrough -->` markers and write it to `{project_dir}/DEMO_WALKTHROUGH.md`

### Step D3: Print Summary

Print the scaffolded file tree, then:

```
Demo scaffolded! Open DEMO_WALKTHROUGH.md to get started:

  Read {project_dir}/DEMO_WALKTHROUGH.md

The walkthrough will guide you through the {pipeline_type} pipeline step by step.
```

**STOP.** Do NOT proceed beyond this point. Do NOT run pipeline commands. Let the user follow the walkthrough at their own pace.

---

## After Genesis

**STOP.** Do NOT proceed beyond this skill's scope. After all phases complete (or user stops early), print the artifact summary and wait for user instructions. Do NOT automatically run other skills or start implementations.

Suggest next steps:
- If all phases complete: "Run `/safeguard detect` to profile your environment, then start building"
- If stopped early: "Run `/genesis` again to resume from where you left off"

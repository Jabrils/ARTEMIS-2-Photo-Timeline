---
name: blueprint
description: "Transform a design into an implementation spec. Creates a blueprint document and an implementation prompt for /plan mode. Use after /design or /research."
disable-model-invocation: false
argument-hint: "[design-ref or topic]"
allowed-tools: Read, Grep, Glob, Write
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
      allowed-tools: "Read, Grep, Glob, Write"
      disable-model-invocation: false
  agent:
    role: "Implementation Architect"
    expertise:
      - "implementation planning"
      - "dependency analysis"
      - "risk assessment"
    non_goals:
      - "writing production code"
      - "running tests"
  execution:
    default_mode: self-refine
    max_iterations: 8
    max_refine: 1
    stop_conditions:
      - "Blueprint written to docs/blueprints/"
      - "Implementation prompt written to docs/prompts/"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/blueprints/{YYYY-MM-DD_HHMM}_{feature_name}.md"
    required_sections:
      - "Objective"
      - "Requirements"
      - "Architecture Decisions"
      - "Scope"
      - "Files Affected"
      - "Implementation Sequence"
      - "Acceptance Criteria"
    prohibited_content:
      - "credentials"
      - "secrets"
  pipeline:
    track: proactive
    standalone: false
    prerequisites:
      - "docs/design/*.md"
      - "docs/research/*.md"
    produces:
      - "docs/blueprints/*.md"
      - "docs/prompts/*.md"
    suggested_next:
      - plan
---

# Blueprint Procedure

**Trigger**: Use `/blueprint {feature description}` when transforming design and research output into an implementation specification and prompt for `/plan` mode.

**Examples**:
- `/blueprint CSV migration with schema drift detection`
- `/blueprint add real-time WebSocket notifications to the monitoring dashboard`
- `/blueprint migrate authentication from session-based to JWT`

## Prerequisites

Before executing this skill, verify ALL of the following:
1. **Use Glob** to check for: `docs/design/*.md`
   - If NO match -> **STOP**: "Run /design first to create a design document."
   - If user says `--force`, proceed without validation.
2. **Read** the most recent Findings Tracker matching `*_FINDINGS_TRACKER.md`
   - Identify the relevant finding (ask user if ambiguous)

## Pre-flight Check

1. Verify artifact prerequisites (above)
2. Identify which finding/workflow this is for
3. Load finding report and related artifacts for context
4. Proceed to main skill instructions

---

## Instructions

The user has described a feature or change to implement. Reason thoroughly about how to turn existing design and research artifacts into a concrete implementation specification.

**Feature to blueprint**: The argument passed after `/blueprint`

---

## CRITICAL: File Naming Convention

**ALL files MUST use this exact format**: `{YYYY-MM-DD_HHMM}_{feature_name}.md`

✅ `2026-01-27_1200_csv_migration_schema_drift.md`
❌ `BLUEPRINT_CSV_MIGRATION_2026-01-27.md` — no prefix, date comes FIRST

---

### Context Check

See [context_check.md](../_shared/context_check.md)
- Task type: "Blueprint" / Output: `docs/blueprints/`

---

## Findings Tracker Update Protocol

See [tracker_update_checklist.md](../_shared/tracker_update_checklist.md)
- Stage: "Blueprint Ready"
- Task: FN.2 (Blueprint + implementation prompt)
- GitHub field: `cf9ba762`

---

## Blueprint Analysis Process

When creating the blueprint, follow this process:

1. **Read upstream artifacts**: Check `docs/design/` and `docs/research/` for existing analysis related to the feature
2. **Extract requirements**: Identify what must be built from the design/research outputs (NOT diagnosing a bug — this is greenfield/proactive work)
3. **Define scope**: Clearly separate what's in-scope vs. out-of-scope
4. **Identify affected files**: List all files that will need changes
5. **Determine implementation sequence**: Order the work by dependencies
6. **Surface architecture decisions**: Document decisions already made and any that remain open
7. **Define acceptance criteria**: What does "done" look like?
8. **Identify dependencies and risks**: What could block or complicate implementation?

---

## Blueprint Template

When writing blueprints, use this structure:

```markdown
# Blueprint: {Feature Title}

**Date**: {YYYY-MM-DD}
**Design Reference**: {path to docs/design/*.md, if any}
**Research Reference**: {path to docs/research/*.md, if any}

## Objective
{Clear statement of what will be built and why}

## Requirements
1. {Requirement 1}
2. {Requirement 2}
3. {Requirement 3}

## Architecture Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| {Decision 1} | {Choice} | {Why} |
| {Decision 2} | {Choice} | {Why} |

## Scope

### In Scope
- {Item 1}
- {Item 2}

### Out of Scope
- {Item 1}
- {Item 2}

## Files Likely Affected
- {file1.py} — {what changes}
- {file2.tsx} — {what changes}

## Implementation Sequence
1. {Step 1} — {why this order}
2. {Step 2} — {depends on step 1 because...}
3. {Step 3}

## Dependencies & Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| {Risk 1} | {H/M/L} | {H/M/L} | {How to handle} |

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Constraints
- {Constraint 1}
- {Constraint 2}

## Debug Strategy (optional — include when implementation involves testable code)
- **Self-debug**: enabled | disabled
- **Verifier**: {command} (e.g., `uv run pytest tests/ -q`)
- **Max iterations**: {N}
- **Completion criteria**: {what "done" means}
- **Escape hatch**: After {N} iterations, document blockers and request human review
- **Invoke with**: `/wrought-implement` (activates Stop hook verifier loop)
```

---

## Prompt Template

When writing prompts for `/plan` mode, use this structure:

```markdown
# Implementation Prompt: {Feature Title}

**Blueprint Reference**: docs/blueprints/{YYYY-MM-DD_HHMM}_{feature_name}.md
**Design Reference**: {path to docs/design/*.md, if any}

## Context
{Brief summary of the feature and why it's being built, drawn from the blueprint}

## Goal
{What needs to be implemented}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Files Likely Affected
- {file1.py}
- {file2.tsx}

## Implementation Sequence
1. {Step 1}
2. {Step 2}

## Constraints
- {Any constraints or considerations}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

---

## Plan Output Instructions

**IMPORTANT**: Before creating the implementation plan, you MUST enter plan mode:

1. Call `EnterPlanMode` to enter plan mode (compresses context and enables read-only exploration)
2. Explore the codebase and design your implementation approach using read-only tools (Read, Grep, Glob)
3. Write the plan to `docs/plans/{YYYY-MM-DD_HHMM}_{feature_name}.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-implement` to start the autonomous implementation loop with test verification.

---

## Completion

After writing the blueprint and implementation prompt:

1. Update the Findings Tracker (per protocol above)
2. Tell the user what was produced:
   - Blueprint saved to `docs/blueprints/{name}.md`
   - Implementation prompt saved to `docs/prompts/{name}.md`
3. If context is high (>85%), note: "Context is high. Consider `/session-end`, then `/plan` in the next session."

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer to implement. Do NOT offer to skip `/plan`. Do NOT offer alternatives to the pipeline sequence.

Next step: Run `/plan` with the prompt at `docs/prompts/{name}.md` to create the implementation plan.

4. **STOP** — do NOT proceed to implementation, do NOT offer to implement. Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Await user instructions.

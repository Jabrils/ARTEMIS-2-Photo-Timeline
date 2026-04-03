---
name: rca-bugfix
description: "Root cause analysis and bug fix procedure. Investigates bugs, documents the RCA, and creates an implementation prompt for the fix. Use after /investigate or /finding."
disable-model-invocation: false
argument-hint: "[finding-ref or description]"
wrought:
  version: "1.0"
  tools:
    capabilities:
      - read_file
      - search_content
      - find_files
      - write_file
      - edit_file
      - run_command
  platforms:
    claude-code:
      disable-model-invocation: false
  agent:
    role: "RCA Engineer"
    expertise:
      - "root cause analysis"
      - "bug fixing"
      - "implementation planning"
    non_goals:
      - "architectural redesign"
      - "feature development"
  execution:
    default_mode: hypothesis-rca
    optional_modes:
      - self-refine
    max_iterations: 12
    max_refine: 1
    stop_conditions:
      - "RCA document written to docs/RCAs/"
      - "Implementation prompt written to docs/prompts/"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/RCAs/{YYYY-MM-DD_HHMM}_{name}.md"
    required_sections:
      - "Summary"
      - "Root Cause"
      - "Evidence"
      - "Fix"
      - "Verification"
    prohibited_content:
      - "credentials"
      - "secrets"
  pipeline:
    track: reactive
    standalone: false
    prerequisites:
      - "docs/investigations/*.md"
      - "docs/findings/*.md"
    produces:
      - "docs/RCAs/*.md"
      - "docs/prompts/*.md"
    suggested_next:
      - plan
---

# RCA Bug Fix Procedure

**Trigger**: Use `/rca-bugfix {issue description}` when investigating and fixing bugs that require root cause analysis.

**Examples**:
- `/rca-bugfix health check timeout causing gray indicators on monitor page`
- `/rca-bugfix rate limiting still happening despite batch processing implementation`
- `/rca-bugfix extractions stuck at 0 records during streaming`

## Prerequisites

Before executing this skill, verify ALL of the following:
1. **Use Glob** to check for: `docs/investigations/*.md`
   - If NO match -> **STOP**: "Run /investigate first to create an investigation report."
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

The user has provided an issue to investigate. Reason thoroughly about this issue — trace the root cause through evidence before proposing a fix.

**Issue to investigate**: The argument passed after `/rca-bugfix`

---

## Input Sources

Before starting, check for upstream artifacts: `docs/investigations/*.md` (from `/investigate`), `docs/findings/*.md` (from `/finding`), or work from the user-provided description. When a finding report provides a known cause, focus on confirming it, defining the fix, and writing the implementation prompt.

---

## CRITICAL: File Naming Convention

**ALL files MUST use this exact format**: `{YYYY-MM-DD_HHMM}_{issue_name}.md`

✅ `2026-01-22_1700_stream_download_timeout.md`
❌ `RCA_STREAM_DOWNLOAD_TIMEOUT_2026-01-22.md` — no prefix, date comes FIRST

---

### Context Check

See [context_check.md](../_shared/context_check.md)
- Task type: "RCA" / Output: `docs/RCAs/`

---

## Findings Tracker Update Protocol

See [tracker_update_checklist.md](../_shared/tracker_update_checklist.md)
- Stage: "RCA Complete"
- Task: FN.2 (RCA + fix design)
- GitHub field: `3e226861`

---

## RCA Template

When writing RCAs, use this structure:

```markdown
# Root Cause Analysis: {Issue Title}

**Date**: {YYYY-MM-DD}
**Severity**: {Critical/High/Medium/Low}
**Status**: {Investigating/Identified/Resolved}

## Problem Statement
{Clear description of the issue}

## Symptoms
- {Observable symptom 1}
- {Observable symptom 2}

## Root Cause
{The actual underlying cause}

## Evidence
{Code snippets, logs, or data supporting the root cause}

## Impact
{What was affected and how}

## Resolution
{How to fix it}

## Prevention
{How to prevent this in the future}

## Debug Strategy (optional — include when fix involves testable code)
- **Self-debug**: enabled | disabled
- **Verifier**: {command} (e.g., `uv run pytest tests/ -q`)
- **Max iterations**: {N}
- **Completion criteria**: {what "done" means — e.g., "bug no longer reproducible, all tests pass"}
- **Escape hatch**: After {N} iterations, document blockers and request human review
- **Invoke with**: `/wrought-rca-fix` (activates Stop hook verifier loop)
```

---

## Prompt Template

When writing prompts for `/plan` mode, use this structure:

```markdown
# Implementation Prompt: {Issue Title}

**RCA Reference**: docs/RCAs/{YYYY-MM-DD_HHMM}_{issue_name}.md

## Context
{Brief summary of the root cause}

## Goal
{What needs to be implemented/fixed}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Files Likely Affected
- {file1.py}
- {file2.tsx}

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
3. Write the plan to `docs/plans/{YYYY-MM-DD_HHMM}_{issue_name}.md` including:
   - Summary of the approach
   - Step-by-step implementation tasks
   - Files to modify with specific changes
   - Testing strategy
   - Rollback plan (if applicable)
4. Call `ExitPlanMode` to present the plan for user approval
5. **Wait for user approval** before proceeding to implementation
6. After plan approval, invoke `/wrought-rca-fix` to start the autonomous bugfix loop with test verification.

---

## Completion

After writing the RCA and implementation prompt:

1. Update the Findings Tracker (per protocol above)
2. Tell the user what was produced:
   - RCA saved to `docs/RCAs/{name}.md`
   - Implementation prompt saved to `docs/prompts/{name}.md`
3. If context is high (>85%), note: "Context is high. Consider `/session-end`, then `/plan` in the next session."

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer to implement. Do NOT offer to skip `/plan`. Do NOT offer alternatives to the pipeline sequence.

Next step: Run `/plan` with the prompt at `docs/prompts/{name}.md` to create the implementation plan.

4. **STOP** — do NOT proceed to implementation, do NOT offer to implement. Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Await user instructions.

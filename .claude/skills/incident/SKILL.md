---
name: incident
description: "Document what happened during an incident. Creates a factual record of WHAT happened, not WHY. Use when an incident occurs and needs documentation."
disable-model-invocation: false
argument-hint: "[description]"
allowed-tools: Read, Grep, Glob, Write, Bash
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
      allowed-tools: "Read, Grep, Glob, Write, Bash"
      disable-model-invocation: false
  agent:
    role: "Incident Documenter"
    expertise:
      - "factual incident recording"
      - "chronological event documentation"
    non_goals:
      - "root cause analysis"
      - "investigation"
      - "bug fixing"
  execution:
    default_mode: react
    stop_conditions:
      - "Incident report written to docs/incidents/"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/incidents/{YYYY-MM-DD_HHMM}_{name}.md"
    required_sections:
      - "Incident title"
      - "Timeline"
      - "Impact"
      - "Current Status"
    prohibited_content:
      - "speculation"
      - "blame"
      - "root cause claims"
  pipeline:
    track: reactive
    standalone: true
    prerequisites: []
    produces:
      - "docs/incidents/*.md"
    suggested_next:
      - investigate
---

# Incident Report Skill

**Trigger**: Use `/incident {brief description}` to document what happened during an incident.

**Purpose**: Create a factual record of WHAT happened. Not WHY — that's for `/investigate` and `/rca-bugfix`.

---

## Pre-flight Check

This skill is **standalone** — it can be invoked at any time without prerequisites.
It is a pipeline entry point: it creates the incident report that downstream skills require.

If this invocation is part of an active workflow, check `docs/findings/*_FINDINGS_TRACKER.md`
for a relevant tracker and note it for context, but do not enforce stage requirements.

---

## Instructions

1. Gather facts from logs, user input, and system state
2. Write a short, factual incident report to `docs/incidents/{YYYY-MM-DD_HHMM}_{name}.md`
3. Output the incident summary for use with `/investigate`
4. **STOP** and await further instructions

**Do NOT** proceed with investigation or root cause analysis — that is the job of `/investigate` and `/rca-bugfix`.

---

## Incident Report Rules

- **Factual only** — describe what you observed, not what you assume
- **Neutral language** — no blame, no speculation, no opinions
- **Chronological** — events in order they occurred
- **Specific** — exact times (UTC), exact error messages, exact numbers

**DO**: "Backend returned 429 at 14:02:15 UTC"
**DON'T**: "Backend was overwhelmed" or "Rate limiting was misconfigured"

---

## Report Template

Write to: `docs/incidents/{YYYY-MM-DD_HHMM}_{name}.md`

Example: `docs/incidents/2026-01-22_1630_extraction_hung.md`

```markdown
# Incident: {Brief Title}

**Date**: {YYYY-MM-DD}
**Time**: {HH:MM} - {HH:MM} UTC
**Reported by**: {User / System / Monitoring}
**Status**: Open

---

## What Happened

{Chronological, factual description of events}

- {HH:MM:SS UTC}: {Event 1}
- {HH:MM:SS UTC}: {Event 2}
- {HH:MM:SS UTC}: {Event 3}

---

## Observed Symptoms

- {Symptom 1}
- {Symptom 2}

---

## Systems Affected

- {System/component 1}
- {System/component 2}

---

## Data Points

| Metric | Value |
|--------|-------|
| Records processed | X |
| Error count | X |
| Duration | X min |

---

## Raw Evidence

```
{Relevant log snippets or error messages}
```

---

**Incident Logged**: {YYYY-MM-DD HH:MM} UTC
```

---

## After Writing

**STOP** and output this for the user:

```
Incident logged: docs/incidents/{YYYY-MM-DD_HHMM}_{name}.md

Summary: {One-line factual summary}

Next steps (your choice):
- /investigate {one-line summary}
- /rca-bugfix {one-line summary}

Awaiting your instructions.
```

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer to implement. Do NOT offer to skip `/investigate`. Do NOT offer alternatives to the pipeline sequence.

Next step: Run `/investigate` with the incident at `docs/incidents/{filename}.md` to determine root cause.

**Do NOT continue.** Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Wait for the user to decide how to proceed.

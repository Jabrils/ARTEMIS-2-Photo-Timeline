---
name: investigate
description: "Deep investigation of an incident or finding. Performs thorough root cause analysis with hypothesis testing and evidence gathering. Use after /incident or /finding."
context: fork
agent: general-purpose
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
      - run_command
  platforms:
    claude-code:
      disable-model-invocation: false
  agent:
    role: "Investigation Analyst"
    expertise:
      - "root cause analysis"
      - "hypothesis testing"
      - "evidence gathering"
    non_goals:
      - "implementing fixes"
      - "writing code"
  execution:
    default_mode: hypothesis-rca
    max_iterations: 15
    stop_conditions:
      - "Investigation report written to docs/investigations/"
      - "Root cause identified with evidence"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/investigations/{YYYY-MM-DD_HHMM}_{name}.md"
    required_sections:
      - "Summary"
      - "Hypotheses"
      - "Evidence"
      - "Root Cause"
      - "Recommended Fix"
  pipeline:
    track: reactive
    standalone: false
    prerequisites:
      - "docs/incidents/*.md"
      - "docs/findings/*.md"
    produces:
      - "docs/investigations/*.md"
    suggested_next:
      - rca-bugfix
      - design
---

# Deep Investigation Skill

**Trigger**: Use `/investigate {incident or finding report}` when you need a thorough investigation of an incident, bug, unexpected behavior, or proactive finding.

**Input**: An incident report (from `/incident`) or a finding report (from `/finding`) describing what happened or what was found.

**Examples**:
- `/investigate Extraction hung at 12% - no error in logs, last event was url_refresh_triggered at 07:38 UTC`
- `/investigate Rate limiting errors despite batch processing - 429 responses every 2 seconds starting 14:00 UTC`
- `/investigate Health check showing red but API responding - monitor page shows Backend=red since 09:15 UTC`
- `/investigate Finding: Missing companyId filter in invoice WHERE clauses -- authorization gap`

---

## Prerequisites

Before executing this skill, verify ALL of the following:
1. **Use Glob** to check for: `docs/findings/*_FINDINGS_TRACKER.md` or `docs/incidents/*.md`
   - If NO match -> **STOP**: "Run /finding or /incident first to create an upstream artifact."
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

Reason thoroughly about this incident or finding. Consider all evidence, form multiple hypotheses, and test each systematically before concluding.

### Input Type Detection

Determine the input type and route accordingly:

```
IF input references a finding report (docs/findings/*.md) OR starts with "Finding:":
    → Confirmation Mode (abbreviated investigation)
ELSE:
    → Full Investigation Mode (standard investigation)
```

### Full Investigation Mode (incidents)

1. **Research online** for relevant documentation and known issues (search as of {current_month_year})
2. **Consult relevant API/library documentation** based on what the incident involves (search as of {current_month_year})
3. **Deeply investigate** the incident provided after `/investigate`
4. **Review past RCAs and Investigations** in `docs/RCAs/` and `docs/investigations/` to avoid repeating errors and recognize patterns
5. **Write detailed Investigation Report** to `docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md`
6. **THEN STOP** and await further instructions

### Confirmation Mode (findings)

When a proactive finding is provided, the cause is often already known. The investigation confirms scope and validates the finding:

1. **Read the finding report** in `docs/findings/` to understand what was found
2. **Confirm the finding is real** -- reproduce or verify the evidence
3. **Determine scope** -- is it isolated or systemic?
4. **Document additional evidence** beyond what the finding captured
5. **Assess impact** -- what is the blast radius if unaddressed?
6. **Write abbreviated Investigation Report** to `docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md`
7. **THEN STOP** and await further instructions

---

## Investigation Process

### Step 1: External Research

**Search online** (use current date context: {current_month_year}):
- Search for known issues, bugs, or limitations related to the problem
- Search for relevant API documentation updates
- Look for community discussions or Stack Overflow answers

**Consult Relevant Documentation**:

First, identify what technology/API/library the incident involves. Then search for documentation specific to that technology.

**EXAMPLES** (use these as a pattern, NOT as default searches):
- If the incident involves **Iterable**: Search "Iterable API {relevant_topic} {current_month_year}"
- If the incident involves **Intercom**: Search "Intercom API {relevant_topic} {current_month_year}"
- If the incident involves **GCS/Google Cloud Storage**: Search "Google Cloud Storage {relevant_topic} {current_month_year}"
- If the incident involves **httpx/requests**: Search "Python httpx {relevant_topic} {current_month_year}"
- If the incident involves **FastAPI**: Search "FastAPI {relevant_topic} {current_month_year}"
- If the incident involves **PostgreSQL**: Search "PostgreSQL {relevant_topic} {current_month_year}"

**IMPORTANT**: Only search documentation relevant to the actual incident. Do NOT default to searching Iterable or Intercom docs unless the incident specifically involves those APIs.

From the documentation, extract:
- Rate limits, timeouts, expected behavior
- Recent API changes or deprecations
- Known limitations or gotchas

### Step 2: Gather Internal Evidence

- Search logs for relevant events
- Read related source code files
- Check recent changes that might be related
- Look for patterns in timing, data, or behavior

### Step 3: Build Timeline

Construct a precise timeline of events:
- When did the incident first appear?
- What happened immediately before?
- What was the system state?

### Step 4: Identify Root Cause

- Distinguish between symptoms and causes
- Identify primary, secondary, and contributing factors
- Trace the code path that led to the incident
- Compare our implementation against official API documentation

### Step 5: Analyze Impact

- What was affected?
- How much data/time was lost?
- What is the blast radius?

### Step 6: Review Past RCAs and Investigations (MANDATORY)

**Before recommending any fixes**, read all files in: `docs/RCAs/`, `docs/research/`, `docs/plans/`, `docs/investigations/`, `docs/findings/`. Look for similar issues, prior fixes, recurring patterns, and applicable solutions.

**Document patterns found**: Has this exact or similar issue occurred before? Did a previous fix cause this? Is this a regression?

---

## Findings Tracker Update Protocol

See [tracker_update_checklist.md](../_shared/tracker_update_checklist.md)
- Stage: "Investigating"
- Task: FN.1 (Investigate — confirm root cause and scope)
- GitHub field: `7ec022fd`

---

## Investigation Report Template

See [report_template.md](report_template.md) for the full investigation report template.

Write to: `docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md`

---

## After Writing the Report

### Full Investigation Mode Output

**STOP** and tell the user:

```
Investigation complete.

Report saved to: docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md

Summary: {1-2 sentence summary}

Sources consulted:
- {List of documentation/URLs researched}

Past RCAs/Investigations/Research reviewed:
- {List of related past documents consulted}

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer `/plan` directly — that comes after `/rca-bugfix`.

Next step: Run `/rca-bugfix` with the investigation at `docs/investigations/{filename}.md` to create RCA and implementation prompt.

Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Awaiting your instructions.
```

### Confirmation Mode Output

**STOP** and tell the user:

```
Finding confirmed.

Report saved to: docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md

Finding: {reference to original finding report}
Scope: {isolated | systemic | broader than expected}
Confirmed: {Yes -- real issue | Partially -- narrower than reported | No -- false positive}

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer `/plan` directly — that comes after `/rca-bugfix`.

Next step: Run `/rca-bugfix` with the investigation at `docs/investigations/{filename}.md` to create RCA and fix prompt.

Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Awaiting your instructions.
```

Do NOT proceed with fixes or additional work until the user responds.

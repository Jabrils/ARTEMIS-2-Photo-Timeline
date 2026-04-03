---
name: session-start
description: "Start new session with full context and greeting"
disable-model-invocation: false
wrought:
  version: "1.0"
  platforms:
    claude-code:
      disable-model-invocation: false
---

# Session Start Protocol

## Step 1: Get Current Time

```bash
date -u '+%A, %B %d, %Y at %H:%M UTC'
```

## Step 2: Read Session Config

Look for configuration in CLAUDE.md between markers:
- `<!-- SESSION_CONFIG_START -->` and `<!-- SESSION_CONFIG_END -->`

Extract:
- `user_name`: Who to greet
- `project_name`: Project name
- `timezone`: User's timezone for display
- `session_docs`: Additional docs to read

If no config exists, use defaults and infer from context.

## Step 3: Read Handoff Document

Find the imported handoff in CLAUDE.md between:
```
<!-- SESSION_HANDOFF_START -->
@NEXT_SESSION_PROMPT_xxxx.md
<!-- SESSION_HANDOFF_END -->
```

Read that file for full session context.

## Step 3.5: First-Session Setup

After reading the handoff (or determining this is the first session), check for
first-session indicators. Each check is independent — if one fails or is declined,
continue to the next.

### Environment Profiling

IF `.wrought` exists AND no file matching `docs/analysis/*_environment_profile.md`:
  1. Announce: "This is a new Wrought project. Let me profile your environment."
  2. Auto-invoke `/safeguard detect` (full interactive flow with checkpoints)
  3. After completion, continue to next check

### Architecture Discovery

IF no `docs/analysis/system-map.md` exists:
  1. Announce: "Building initial architecture inventory..."
  2. Auto-invoke `/analyze discover`
  3. After completion, continue to next check

### GitHub Projects Integration

Read `.wrought` marker and check `github_owner` and `github_project_number` fields.

IF `github_owner` is set (not "none") AND `github_project_number` is "none" or missing:
  1. Ask: "GitHub detected ({github_owner}/{github_repo}). Create a Wrought-integrated Projects board? [Y/n]"
  2. If yes: proceed to Step 3.6 (GitHub Projects Provisioning)
  3. If no: skip, note in greeting that GitHub Projects can be set up later

---

## Step 3.6: GitHub Projects Provisioning

This step creates a GitHub Projects board with Wrought-aligned custom fields.
Only execute if requested in Step 3.5.

### 1. Check Token Scope

```bash
gh auth status
```

- If missing `project` scope: suggest `gh auth refresh -s project`
- If auth fails: warn and skip (non-fatal)

### 2. Create Project

```bash
PROJECT_NUMBER=$(gh project create --owner {github_owner} \
  --title "{project_name} Wrought Evolution" \
  --format json --jq '.number')
```

### 3. Create Custom Fields (8 fields)

Create each field using `gh project field-create`:

| Field | Type | Options |
|-------|------|---------|
| Pipeline | Single Select | Reactive, Proactive, Audit, Self-Evolution, BAU |
| Lifecycle Stage | Single Select | Open, Investigating, Designing, RCA Complete, Blueprint Ready, Planned, Implementing, Resolved, Verified |
| Type | Single Select | Defect, Vulnerability, Gap, Debt, Drift |
| Severity | Single Select | Critical, High, Medium, Low |
| Finding ID | Text | — |
| Evidence | Text | — |
| Workstream | Single Select | BAU, Roadmap, TechDebt |
| Area | Single Select | CLI, Skills, Tracker, Lifecycle, Hooks, Docs, SDLC/Release |

### 4. Capture Field IDs

```bash
gh project field-list {PROJECT_NUMBER} --owner {github_owner} --format json
```

### 5. Get Project Node ID

```bash
PROJECT_ID=$(gh project view {PROJECT_NUMBER} --owner {github_owner} --format json --jq '.id')
```

### 6. Generate Sync Protocol

Generate `docs/reference/github_projects_sync_protocol.md` from captured IDs.
Use the same format as the existing Wrought sync protocol file if one exists.

### 7. Update Marker

Update `.wrought` marker with:
- `github_project_number={PROJECT_NUMBER}`
- `github_project_id={PROJECT_ID}`

### 8. Report

Print: "GitHub Projects board created: {project_name} Wrought Evolution (#{PROJECT_NUMBER})"

All steps in 3.6 are non-fatal — if any step fails, warn and continue.

---

## Step 3.7: Intelligence Inbox Review

Check `docs/intelligence/inbox.md` for items collected since last session.

1. **Use Read** to open `docs/intelligence/inbox.md`
2. If empty (no items below the `---` header), skip silently
3. If items exist, present them grouped by date:
   ```
   **Intelligence Inbox** ({N} new items):
   - {tag} {one-line summary} — {link}
   ```
4. For each item, ask the user to triage:
   - **Actionable** → "This needs a `/finding` — shall I create one?"
   - **Reference** → Move the item to `docs/intelligence/archive.md` (append under a date heading, preserve tags and notes)
   - **Ignore** → Delete the item from inbox
   - **Skip for now** → Leave in inbox for next session
5. After triage, **Edit** `inbox.md` to remove processed items (keep the header template)
6. Continue to next step

This step is non-fatal — if `docs/intelligence/inbox.md` does not exist, skip silently.

---

## Step 3.8: Workflow Awareness

Check for active Findings Trackers to surface "you are here" context:

1. **Use Glob** to find `docs/findings/*_FINDINGS_TRACKER.md`
2. If trackers exist, **Read** each and identify findings NOT `Resolved` or `Verified`
3. For each active finding, note: number, title, current stage, suggested next skill
4. Include in the **Current Status** section of the greeting:
   ```
   **Active Workflows**:
   - F1: {title} — Stage: {stage} — Next: /{next_skill}
   ```
5. If wrought CLI available, suggest: "Run `wrought workflow status` for full details"

This step is non-fatal — if `docs/findings/` does not exist, skip silently.

---

## Step 4: Provide Greeting

Format your response as:

```
Good [morning/afternoon/evening] {user_name}!

It's {current_datetime} UTC ({local_time} {timezone}).

I've read the session handoff and I'm oriented with the {project_name} project.

**Last Session**: {brief summary from handoff}

**Current Status**:
- {status item 1}
- {status item 2}

**Priorities**:
1. {priority 1}
2. {priority 2}
3. {priority 3}

What would you like to work on today?
```

## Step 5: Confirm Context

After greeting, confirm you have loaded:
- CLAUDE.md (auto-loaded)
- Session handoff document
- Any additional session_docs from config

---

## Time of Day Guidelines

Based on UTC time, determine greeting:
- 05:00-11:59 UTC: "Good morning"
- 12:00-16:59 UTC: "Good afternoon"
- 17:00-04:59 UTC: "Good evening"

Adjust if user's timezone is specified in config.

---

## Check for Active Plan Files

1. Check `docs/plans/` for recent plan files
2. If active plan exists, read it and note:
   - Current phase/status
   - What phases are complete
   - What's next
3. Include plan status in the summary if applicable

---

## If No Handoff Exists

If this is the first session (no handoff file):

```
Hello {user_name}!

It's {current_datetime}.

This appears to be the first session for this project. I've read CLAUDE.md and I'm ready to help.

**Project**: {project_name}

Would you like me to help you set up the session management system, or shall we dive into the work?
```

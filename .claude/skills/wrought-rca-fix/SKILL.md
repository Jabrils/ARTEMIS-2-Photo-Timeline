---
name: wrought-rca-fix
description: "Start an autonomous RCA bugfix loop with test verification"
disable-model-invocation: false
wrought:
  version: "1.0"
  platforms:
    claude-code:
      disable-model-invocation: false
---

# Wrought RCA Fix — Autonomous Bugfix Loop

You are starting a Ralph Wiggum inner loop for an RCA bugfix. A Stop hook will automatically verify your fix after each attempt to stop.

## Step 1: Check for Active Loop

Read `.claude/wrought-loop-state.json`. If it exists and `active` is `true`:
- **WARN**: "An active loop already exists. Run `/cancel-wrought-loop` first, or continue the existing loop."
- **STOP** — do not proceed.

## Step 2: Identify the RCA Report

The user should provide an RCA path. If not provided:
1. Use Glob to find the most recent file in `docs/RCAs/*.md`
2. Read it and confirm with the user: "Found RCA: {path}. Proceed?"

## Step 3: Read Verifier Config

Read the `.wrought` marker file and extract:
- `verifier_type` — if `none`, ask the user: "What verifier command should I use? (e.g., `uv run pytest tests/ -q`)"
- `verifier_test_path` — default test path
- `verifier_max_loops` — iteration budget
- `verifier_timeout` — per-run timeout in seconds

## Step 4: Initialize Loop State

Write `.claude/wrought-loop-state.json`:
```json
{
  "active": true,
  "preset": "wrought-rca-fix",
  "finding_id": "{from RCA or Findings Tracker}",
  "tracker_path": "{path to active FINDINGS_TRACKER.md}",
  "verifier_command": "{verifier command}",
  "max_iterations": {from marker},
  "current_iteration": 0,
  "started_at": "{ISO timestamp}",
  "history": []
}
```

## Step 5: Apply Fix

1. Read the RCA report thoroughly — understand the root cause and proposed fix
2. Apply the fix as described in the RCA report
3. After applying, the Stop hook will automatically run the verifier
4. If the verifier fails, you will be blocked — analyze the error output and iterate on the fix
5. Continue until the verifier passes (bug is resolved)

## Step 6: Completion

When the loop completes (verifier passes):
1. Read the final `.claude/wrought-loop-state.json` to summarize iterations
2. Report: "RCA fix applied and verified after {N} iterations. Capsule artifacts at `docs/capsules/{finding_id}/`"
3. Update the Findings Tracker with fix status
4. Suggest: "Fix verified. Next: run `/forge-review --scope=diff` to verify code quality."

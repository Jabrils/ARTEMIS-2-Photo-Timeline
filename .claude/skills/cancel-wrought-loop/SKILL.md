---
name: cancel-wrought-loop
description: "Cancel the active Wrought implementation/RCA loop"
disable-model-invocation: false
wrought:
  version: "1.0"
  platforms:
    claude-code:
      disable-model-invocation: false
---

# Cancel Wrought Loop

## Step 1: Read Loop State

Read `.claude/wrought-loop-state.json`.

- If the file does not exist: "No active loop found. Nothing to cancel."
- If `active` is `false`: "Loop is already inactive. Last run: {preset} with {current_iteration} iterations."

## Step 2: Deactivate

Set `active` to `false` in `.claude/wrought-loop-state.json`. Add a cancellation entry to `history`:
```json
{
  "iteration": {current_iteration},
  "result": "cancelled",
  "exit_code": null,
  "timestamp": "{ISO timestamp}"
}
```

## Step 3: Report

Report to the user:
- Preset: {preset}
- Iterations completed: {current_iteration} / {max_iterations}
- Last result: {last history entry result, or "none"}
- Capsule location: `docs/capsules/{finding_id}/`
- "Loop cancelled. You may resume work manually or start a new loop."

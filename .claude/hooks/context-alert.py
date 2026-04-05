#!/usr/bin/env python3
"""Hook: context alert — warns and blocks when context usage is critically high.

Reads effective context percentage from .claude/bridge/context-bridge.json
(written by statusline.py on every assistant message). Supports both Stop and
UserPromptSubmit hooks with different behavior:

Stop hook:
- < 50%: Silent, no action.
- 50-64%: Stderr warning visible to user (does not block Claude).
- >= 65%: BLOCKS Claude from stopping, injects warning into conversation.

UserPromptSubmit hook:
- < 50%: Silent, no action.
- 50-64%: Stderr warning visible to user.
- >= 65%: Injects additionalContext warning (never blocks — user must always
  be able to type, including /session-end).
"""

import json
import os
import sys

WARN_THRESHOLD = 50
BLOCK_THRESHOLD = 65


def main():
    data = json.load(sys.stdin)
    hook_event = data.get("hook_event_name", "Stop")

    # For Stop hooks: if Claude is already continuing from a block, don't re-block.
    if hook_event == "Stop" and data.get("stop_hook_active", False):
        return

    cwd = data.get("cwd", ".")
    bridge_path = os.path.join(cwd, ".claude", "bridge", "context-bridge.json")

    if not os.path.exists(bridge_path):
        return

    try:
        with open(bridge_path) as f:
            bridge = json.load(f)
        # Prefer effective_pct, fallback to used_percentage
        pct = bridge.get("effective_pct", bridge.get("used_percentage", 0))
        # Skip stale bridge data from a different session
        current_session = data.get("session_id", "")
        bridge_session = bridge.get("session_id", "")
        if current_session and bridge_session and current_session != bridge_session:
            return
    except (json.JSONDecodeError, OSError):
        return  # Corrupt or unreadable bridge file — fail safe

    alert_msg = (
        f"CONTEXT ALERT: Effective context usage at {pct}%. "
        "Auto-compaction is imminent. You MUST immediately: "
        "1) Commit any uncommitted work, "
        "2) Update the active Findings Tracker with current progress, "
        "3) Suggest the user run /session-end to preserve session state. "
        "Do NOT start any new tasks or pipeline steps."
    )

    if hook_event == "Stop":
        # Stop hook: warn at 50%, block at 65%
        if pct >= BLOCK_THRESHOLD:
            json.dump(
                {"decision": "block", "reason": alert_msg},
                sys.stdout,
            )
        elif pct >= WARN_THRESHOLD:
            print(
                f"Context at {pct}% (effective) — consider wrapping up soon.",
                file=sys.stderr,
            )
    else:
        # UserPromptSubmit hook: warn at 50%, inject context at 65%, never block
        if pct >= BLOCK_THRESHOLD:
            json.dump(
                {"additionalContext": alert_msg},
                sys.stdout,
            )
        elif pct >= WARN_THRESHOLD:
            print(
                f"Context at {pct}% (effective) — consider wrapping up soon.",
                file=sys.stderr,
            )


if __name__ == "__main__":
    main()

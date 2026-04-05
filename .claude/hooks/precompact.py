#!/usr/bin/env python3
"""PreCompact hook: writes a structured recovery brief before auto-compaction."""

import json
import os
import re
import subprocess
import sys
import time

_TERMINAL_STATUSES = frozenset({"Verified", "Resolved", "Out of Scope"})


def main():
    data = json.load(sys.stdin)
    cwd = data.get("cwd", ".")
    trigger = data.get("trigger", "unknown")
    session_id = data.get("session_id", "unknown")

    # 1. Read context bridge for effective_pct
    effective_pct = "?"
    try:
        bridge_path = os.path.join(cwd, ".claude", "bridge", "context-bridge.json")
        with open(bridge_path) as f:
            bridge = json.load(f)
        effective_pct = bridge.get("effective_pct", bridge.get("used_percentage", "?"))
        session_id = bridge.get("session_id", session_id)
    except (OSError, json.JSONDecodeError):
        pass

    # 2. Read CLAUDE.md — extract active tracker paths
    active_trackers = []
    try:
        claude_md = os.path.join(cwd, "CLAUDE.md")
        with open(claude_md) as f:
            content = f.read()
        # Each tracker line: - `docs/findings/...FINDINGS_TRACKER.md` — F1: Status ...
        for line in content.splitlines():
            match = re.search(r"`(docs/findings/\S+_FINDINGS_TRACKER\.md)`\s*—\s*(.*)", line)
            if match:
                path, desc = match.group(1), match.group(2)
                # Filter: skip if ALL findings are Verified/Resolved/Out of Scope
                statuses = re.findall(r"F\d+:\s*(\w[\w\s]*?)(?:\s*\(|,|$)", desc)
                if not statuses or not all(s.strip() in _TERMINAL_STATUSES for s in statuses):
                    active_trackers.append((path, desc.strip()))
    except OSError:
        pass

    # 3. Read most recent active tracker for finding/stage/status
    current_work = []
    if active_trackers:
        try:
            tracker_path = os.path.join(cwd, active_trackers[-1][0])
            with open(tracker_path) as f:
                tracker_content = f.read()
            # Extract from overview table: | F# | description | type | severity | status | stage |
            for line in tracker_content.splitlines():
                m = re.match(
                    r"\|\s*(F\d+)\s*\|([^|]+)\|[^|]+\|[^|]+\|\s*(\S[^|]*)\|\s*(\S[^|]*)\|",
                    line,
                )
                if m:
                    fid, title = m.group(1), m.group(2).strip()
                    status, stage = m.group(3).strip(), m.group(4).strip()
                    if status.strip("* ") not in _TERMINAL_STATUSES:
                        current_work.append(f"- **{fid}**: {title} — Stage: {stage}, Status: {status}")
        except OSError:
            pass

    # 4. Run git status --porcelain
    git_output = ""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=cwd,
        )
        git_output = result.stdout.strip()
    except (subprocess.TimeoutExpired, OSError):
        git_output = "(git status unavailable)"

    # 5. Write recovery brief
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    lines = [
        "# PreCompact Recovery Brief\n",
        f"**Timestamp**: {timestamp}",
        f"**Trigger**: {trigger}",
        f"**Session ID**: {session_id}",
        f"**Effective Context**: {effective_pct}%\n",
        "## Active Trackers",
    ]
    if active_trackers:
        for path, desc in active_trackers:
            lines.append(f"- `{path}` — {desc}")
    else:
        lines.append("- (none detected)")

    lines.append("\n## Current Work")
    if current_work:
        lines.extend(current_work)
    else:
        lines.append("- (no active findings detected)")

    lines.append("\n## Modified Files (git status)")
    lines.append(git_output if git_output else "(no changes)")

    lines.append("\n## Recovery Instructions")
    lines.append("After compaction, read this file and the active Findings Tracker to reconstruct session state.")
    lines.append("The Findings Tracker contains the full pipeline context and task checklist.")

    recovery_path = os.path.join(cwd, ".claude", "bridge", "precompact-recovery.md")
    os.makedirs(os.path.dirname(recovery_path), exist_ok=True)
    with open(recovery_path, "w") as f:
        f.write("\n".join(lines) + "\n")

    print(
        "PreCompact: Recovery brief written to .claude/bridge/precompact-recovery.md",
        file=sys.stderr,
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # Fail-safe: never crash, never return non-zero

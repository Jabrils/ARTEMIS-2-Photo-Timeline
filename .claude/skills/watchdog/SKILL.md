---
name: watchdog
description: "Passive monitoring with incident tagging. Creates autonomous bash monitoring scripts that watch logs after fixes, create incident files, and send Telegram alerts on errors."
disable-model-invocation: false
argument-hint: "[target or log-path]"
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
      disable-model-invocation: false
  agent:
    role: "Monitoring Script Generator"
    expertise:
      - "log monitoring"
      - "bash scripting"
      - "alerting configuration"
    non_goals:
      - "fixing issues"
      - "root cause analysis"
      - "modifying application code"
  execution:
    default_mode: react
    max_iterations: 8
    stop_conditions:
      - "Monitoring script generated and started"
      - "Monitoring report written to docs/monitoring/"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/monitoring/{YYYY-MM-DD_HHMM}_{subject}.md"
    required_sections:
      - "What is being monitored"
      - "Alert conditions"
      - "Script location"
  pipeline:
    track: standalone
    standalone: true
    prerequisites: []
    produces:
      - "docs/monitoring/*.md"
      - "/tmp/watchdog_*.sh"
    suggested_next:
      - incident
---

# Watchdog - Passive Monitoring Skill

## Pre-flight Check

This skill is **standalone** — it can be invoked at any time without prerequisites.

If this invocation is part of an active workflow, check `docs/findings/*_FINDINGS_TRACKER.md`
for a relevant tracker and note it for context, but do not enforce stage requirements.

---

## Trigger

```
/watchdog {what to monitor - description of fix or process}
```

## Examples

```
/watchdog Monitor extraction after retry logic fix - watch for timeout errors
/watchdog Watch backend after GCS upload fix - look for upload failures
/watchdog Monitor batch job API after endpoint fix
```

---

## Description

A **fully autonomous bash script** that monitors logs after a fix is implemented. Runs independently without Claude - creates incident files and sends Telegram alerts when errors occur.

### Key Behaviors

| Setting | Value |
|---------|-------|
| Monitoring style | **Passive** - watch logs/messages |
| Check interval | **60 seconds** |
| On error detected | **Create incident file + Telegram alert** |
| Error de-duplication | **Don't repeat same/similar errors** |
| After incident | **Continue monitoring** (don't stop) |
| Manual stop | **Run until user stops it** |
| Alerts | **Log + Telegram** (different alerts for system vs fix-related) |
| Incident tagging | **"system" vs "fix-related"** based on pattern matched |
| Status surfacing | **Every 60 seconds** to status file |
| **Autonomy** | **Runs independently** - no Claude session required |

### Autonomous Operation

**IMPORTANT**: Once started, the watchdog runs as a standalone bash script:

1. **Does NOT require Claude** to be running
2. **Does NOT require user to be awake**
3. **Sends Telegram alerts** directly to your phone
4. **Creates incident JSON files** for later review

**Workflow when you're asleep:**
```
1. You start watchdog and go to sleep
2. Watchdog detects error at 3am
3. Creates incident file: /tmp/watchdog_{id}_incidents/fix-related_20260122_030000.json
4. Sends Telegram: "🎯🔴 WATCHDOG: Fix-Related Error! Run /incident in Claude"
5. You wake up, see Telegram notification
6. Start Claude, run: /incident {error summary}
   OR read incident files: cat /tmp/watchdog_{id}_incidents/*.json
```

**What the script can do autonomously:**
- Check docker logs every 60 seconds
- Detect errors using pattern matching
- Tag incidents as "system" or "fix-related"
- Create JSON incident files with full stack traces
- Send Telegram alerts with error details
- Update status file for later review
- De-duplicate repeated errors

**What requires Claude (when you're back):**
- Running `/incident` to create formal incident report
- Investigating the root cause
- Implementing fixes

---

## Instructions

### Step 1: Parse Input and Understand Context

1. **Parse the user's input** to understand:
   - What was fixed
   - What process to monitor
   - What errors to watch for

2. **Read recent context documents** (if relevant):
   - Recent `docs/RCAs/*.md` files
   - Recent `docs/plans/*.md` files
   - Recent `docs/investigations/*.md` files

3. **Identify FIX-SPECIFIC error patterns** based on the fix context. These are CRITICAL for tagging incidents correctly.

   Examples:
   - If fix was for "retry logic for timeouts" → fix patterns: `ReadTimeout|ConnectTimeout|timed out`
   - If fix was for "GCS upload" → fix patterns: `GCS|upload.*fail|storage`
   - If fix was for "URL refresh" → fix patterns: `refresh|_fetch_all_export_files|URLExpired`

4. **Store patterns in two categories**:
   - `SYSTEM_PATTERNS`: General errors (always the same)
   - `FIX_PATTERNS`: Specific to what was fixed (varies per session)

### Step 2: Create Monitoring Session

1. **Generate a unique session ID**:
   ```bash
   SESSION_ID=$(date -u '+%Y%m%d_%H%M%S')_$(head -c 4 /dev/urandom | xxd -p)
   ```

2. **Identify log sources** to monitor:
   - Backend container: `docker logs {container_name} --since 1m`
   - Other relevant containers or log files
   - Ask the user which container(s) or log files to monitor

3. **Create the monitoring report** at `docs/monitoring/{YYYY-MM-DD_HHMM}_{name}.md`

4. **Define the fix-specific patterns** based on Step 1 analysis

### Step 3: Write Monitoring Report

Create a report at: `docs/monitoring/{YYYY-MM-DD_HHMM}_{name}.md`

Read the template from `watchdog_report_template.md` (in this skill's directory). Copy it, replace all `{placeholders}` with actual values from the session context, and write it to the report path.

### Step 4: Start Background Monitoring Script

Use the Bash tool with `run_in_background: true` to start the monitoring script.

**IMPORTANT**: The script must:
1. Run in an infinite loop
2. Check logs every 60 seconds
3. De-duplicate errors using MD5 hashes
4. **Tag incidents as "system" or "fix-related"**
5. Create incident files with category tag
6. **Send DIFFERENT Telegram alerts** for each category
7. **Write status file every 60 seconds** for Claude to read
8. Continue monitoring after incidents (don't exit)

Read the script template from `watchdog_template.sh` (in this skill's directory). Replace all `{placeholders}` with actual values:
- `{session_id}` — the generated session ID
- `{fix_patterns_pipe_separated}` — pipe-separated regex patterns for the fix (e.g., `ReadTimeout|ConnectTimeout|timed out`)
- `{fix_description}` — human-readable description of what was fixed
- `${CONTAINER_NAME}` — the Docker container name to monitor

### Step 5: Execute Background Script

**CRITICAL**: Before executing, you MUST replace these placeholders:
- `{session_id}` - The generated session ID
- `{fix_patterns_pipe_separated}` - Pipe-separated regex patterns for the fix (e.g., `ReadTimeout|ConnectTimeout|timed out`)
- `{fix_description}` - Human-readable description of what was fixed

Use the Bash tool with these parameters:

```
command: <the script above with placeholders replaced>
run_in_background: true
description: "Watchdog monitoring - passive log watcher with incident tagging"
```

### Step 6: Confirm to User (Keep It Simple!)

After starting the background process, respond with a **simple, clean confirmation**:

```
Watchdog started. Session: {session_id}

Watching for: {brief description of fix patterns}
Alerts: Telegram + incident files
Interval: 60 seconds

Safe to sleep - I'll alert you via Telegram if errors occur.

To check status: "check watchdog"
To stop: "stop watchdog"
```

**DO NOT include:**
- Complex tables
- Long file paths
- Redundant information
- Technical details about patterns

Keep it short and actionable.

### Step 7: STOP and Await

**IMPORTANT**: After confirming to the user, **STOP** your response. The monitoring is running in the background.

- Do NOT continuously check the logs
- Do NOT poll the background process
- The status file is updated every 60 seconds
- Telegram alerts provide immediate push notifications

The user can:
- Ask you to check watchdog status (you'll read the status file)
- Ask you to read incident files
- Ask you to stop the watchdog
- Continue with other work while watchdog runs

---

## When User Asks to Check Watchdog

If the user asks "check watchdog" or similar:

1. **Read the status file and incident files**:
   ```bash
   cat /tmp/watchdog_{session_id}_status.json
   cat /tmp/watchdog_{session_id}_incidents/*.json 2>/dev/null
   ```

2. **Present a SIMPLE status report showing ACTUAL ERRORS**:

   ```
   **Watchdog Status**

   Running: Yes | Checks: {count} | Since: {start_time}

   **Incidents: {total_count}** ({fix_count} fix-related, {system_count} system)

   {IF incidents exist, show them directly:}

   ---
   🎯 **Fix-Related Error** (high priority)
   Time: {timestamp}
   Error: {actual error message from JSON}
   Stack: {first 3 lines of stack trace}
   ---

   ⚠️ **System Error**
   Time: {timestamp}
   Error: {actual error message}
   ---

   {IF no incidents:}
   No errors detected so far.
   ```

3. **SHOW THE ACTUAL ERRORS** - do not just list file paths!
   - Extract `summary` and `stack_trace` from each incident JSON
   - Display the error message directly
   - Show first few lines of stack trace
   - User should NOT need to run any commands to see errors

---

## When User Asks to Stop Watchdog

If the user asks "stop watchdog" or similar:

1. **Stop the process**:
   ```bash
   kill $(cat /tmp/watchdog_{session_id}.pid) 2>/dev/null && echo "Stopped" || echo "Not running"
   ```

2. **Read final status and any incidents**:
   ```bash
   cat /tmp/watchdog_{session_id}_status.json
   cat /tmp/watchdog_{session_id}_incidents/*.json 2>/dev/null
   ```

3. **Present final summary WITH any errors shown directly**:

   ```
   **Watchdog Stopped**

   Session: {session_id}
   Runtime: {duration}
   Total checks: {count}

   **Final Incident Summary:**
   - Fix-related: {count}
   - System: {count}

   {IF incidents exist, list each error summary directly}

   {IF no incidents:}
   No errors detected during monitoring.
   ```

---

## Error Patterns Reference

### System-Wide Patterns (Category: "system")

These patterns use **smart matching** to avoid false positives from field names:

| Pattern | Regex | Indicates |
|---------|-------|-----------|
| Error-level logs | `"level":\s*"error"` | Actual error log entries |
| Warning-level logs | `"level":\s*"warning"` | Warning log entries |
| Python tracebacks | `Traceback` | Stack traces |
| Error events | `_error"\|_failed"` | Event names like `download_error` |
| Exception text | `Exception:\|Error:` | Exception messages |
| Critical logs | `CRITICAL\|FATAL` | Severe errors |

**Note**: Does NOT match field names like `"parse_errors": 0`

### Fix-Specific Patterns (Category: "fix-related")

These are determined per-session based on what was fixed. Examples:

| Fix Context | Patterns |
|-------------|----------|
| Retry logic for timeouts | `ReadTimeout\|ConnectTimeout\|timed out` |
| GCS upload fix | `GCS\|upload.*fail\|storage\|bucket` |
| URL refresh fix | `refresh\|_fetch_all_export_files\|URLExpired` |
| Batch job fix | `batch.*fail\|job.*fail\|initiate_export` |
| Stream download fix | `stream.*download\|StreamingChunk\|iter_bytes` |

---

## Notes

### Autonomous Operation
- **Runs as standalone bash script** - does NOT need Claude running
- **Safe to start and go to sleep** - will alert you via Telegram
- **Survives Claude session end** - keeps running until manually stopped
- **Creates incident files** - review them when you wake up

### Monitoring Behavior
- Status file updated every 60 seconds
- Fix-related incidents get red Telegram alerts (🎯🔴) - high priority!
- System incidents get yellow Telegram alerts (⚠️) - lower priority
- De-duplication prevents spam for repeated errors

### Cleanup
- Always stop watchdog when no longer needed: `kill $(cat /tmp/watchdog_{id}.pid)`
- Incident files persist in `/tmp/` until system reboot or manual cleanup
- Incident JSON files can be used with `/incident` skill for formal reports

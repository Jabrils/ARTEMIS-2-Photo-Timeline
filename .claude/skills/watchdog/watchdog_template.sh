#!/bin/bash
# Watchdog - Passive monitoring with incident tagging and status surfacing
# Tags incidents as "system" vs "fix-related"
# Different Telegram alerts per category
# Writes status file every 60 seconds for Claude to read

SESSION_ID="{session_id}"
LOG_FILE="/tmp/watchdog_${SESSION_ID}.log"
PID_FILE="/tmp/watchdog_${SESSION_ID}.pid"
REPORTED_FILE="/tmp/watchdog_${SESSION_ID}_reported.txt"
INCIDENT_DIR="/tmp/watchdog_${SESSION_ID}_incidents"
STATUS_FILE="/tmp/watchdog_${SESSION_ID}_status.json"
INTERVAL=60

# ========================================
# PATTERN DEFINITIONS - CUSTOMIZE FIX_PATTERNS
# ========================================

# System-wide patterns (SMART matching for structured JSON logs)
# - Matches "level": "error" or "level": "warning" in JSON logs
# - Matches Python tracebacks
# - Matches event names ending in _error or _failed
# - Does NOT match field names like "parse_errors": 0
SYSTEM_PATTERNS='"level":\s*"error"|"level":\s*"warning"|Traceback|_error"|_failed"|Exception:|Error:|CRITICAL|FATAL'

# Fix-related patterns (CUSTOMIZE THIS based on what was fixed)
# Replace these with actual patterns from the fix context
FIX_PATTERNS="{fix_patterns_pipe_separated}"
FIX_DESCRIPTION="{fix_description}"

# ========================================
# SETUP
# ========================================

mkdir -p "$INCIDENT_DIR"

# Counters for status
SYSTEM_COUNT=0
FIX_COUNT=0
CHECK_COUNT=0
START_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Get Telegram credentials from backend container (customize container name)
TELEGRAM_BOT_TOKEN=$(docker exec ${CONTAINER_NAME} printenv TELEGRAM_BOT_TOKEN 2>/dev/null || echo "")
TELEGRAM_CHAT_ID=$(docker exec ${CONTAINER_NAME} printenv TELEGRAM_CHAT_ID 2>/dev/null || echo "")

# ========================================
# FUNCTIONS
# ========================================

send_telegram() {
    local msg="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${msg}" \
            -d "parse_mode=HTML" > /dev/null 2>&1
    fi
}

# JSON-escape stdin (prefer jq for speed; fall back to python3)
if command -v jq >/dev/null 2>&1; then
    json_escape_stdin() { jq -Rs .; }
else
    json_escape_stdin() { python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'; }
fi

is_duplicate() {
    local error_sig="$1"
    local hash=$(echo "$error_sig" | md5 2>/dev/null || echo "$error_sig" | md5sum | cut -d' ' -f1)
    if grep -q "$hash" "$REPORTED_FILE" 2>/dev/null; then
        return 0  # Is duplicate
    else
        echo "$hash" >> "$REPORTED_FILE"
        return 1  # Is new
    fi
}

# Determine if error matches fix-related patterns
is_fix_related() {
    local error_line="$1"
    if [ -n "$FIX_PATTERNS" ] && echo "$error_line" | grep -qiE "$FIX_PATTERNS"; then
        return 0  # Is fix-related
    else
        return 1  # Is system
    fi
}

create_incident() {
    local category="$1"      # "system" or "fix-related"
    local error_type="$2"
    local summary="$3"
    local stack_trace="$4"
    local timestamp=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    local incident_file="$INCIDENT_DIR/${category}_$(date -u '+%Y%m%d_%H%M%S').json"

    # Escape stack trace for JSON
    local escaped_trace=$(echo "$stack_trace" | json_escape_stdin)

    cat > "$incident_file" << INCIDENTEOF
{
  "timestamp": "$timestamp",
  "category": "$category",
  "error_type": "$error_type",
  "summary": "$summary",
  "stack_trace": $escaped_trace,
  "session_id": "$SESSION_ID",
  "log_file": "$LOG_FILE",
  "fix_context": "$FIX_DESCRIPTION"
}
INCIDENTEOF

    echo "[$category] INCIDENT: $summary" >> "$LOG_FILE"
    echo "   File: $incident_file" >> "$LOG_FILE"

    # Different Telegram alerts based on category
    if [ "$category" = "fix-related" ]; then
        # Fix-related: Red alert with target emoji
        send_telegram "🎯🔴 <b>WATCHDOG: Fix-Related Error!</b>

<b>Category:</b> FIX-RELATED
<b>Type:</b> $error_type
<b>Summary:</b> $(echo "$summary" | head -c 200)
<b>Time:</b> $timestamp

⚠️ <i>This error is related to the fix being monitored!</i>
<b>Fix context:</b> $FIX_DESCRIPTION

Run in Claude: <code>/incident $summary</code>"
        ((FIX_COUNT++))
    else
        # System: Yellow warning
        send_telegram "⚠️ <b>WATCHDOG: System Error</b>

<b>Category:</b> SYSTEM
<b>Type:</b> $error_type
<b>Summary:</b> $(echo "$summary" | head -c 200)
<b>Time:</b> $timestamp

<i>General system error (not related to current fix)</i>

Run in Claude: <code>/incident $summary</code>"
        ((SYSTEM_COUNT++))
    fi
}

# Write status file for Claude to read
write_status() {
    local timestamp=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    local uptime_seconds=$(($(date +%s) - $(date -d "$START_TIME" +%s 2>/dev/null || echo "0")))

    cat > "$STATUS_FILE" << STATUSEOF
{
  "session_id": "$SESSION_ID",
  "status": "active",
  "started": "$START_TIME",
  "last_check": "$timestamp",
  "checks_completed": $CHECK_COUNT,
  "incidents": {
    "system": $SYSTEM_COUNT,
    "fix_related": $FIX_COUNT,
    "total": $((SYSTEM_COUNT + FIX_COUNT))
  },
  "fix_context": "$FIX_DESCRIPTION",
  "fix_patterns": "$FIX_PATTERNS",
  "last_log_lines": $(tail -5 "$LOG_FILE" 2>/dev/null | json_escape_stdin),
  "message": "Watchdog active. $CHECK_COUNT checks completed. $((SYSTEM_COUNT + FIX_COUNT)) incidents found ($FIX_COUNT fix-related, $SYSTEM_COUNT system)."
}
STATUSEOF
}

# ========================================
# MAIN LOOP
# ========================================

# Save PID
echo $$ > "$PID_FILE"

echo "========================================" >> "$LOG_FILE"
echo "Watchdog Started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> "$LOG_FILE"
echo "Mode: Passive monitoring with incident tagging" >> "$LOG_FILE"
echo "De-duplication: Enabled" >> "$LOG_FILE"
echo "Interval: ${INTERVAL}s" >> "$LOG_FILE"
echo "Fix patterns: $FIX_PATTERNS" >> "$LOG_FILE"
echo "Fix context: $FIX_DESCRIPTION" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Write initial status
write_status

send_telegram "🐕 <b>Watchdog Started</b>

<b>Session:</b> ${SESSION_ID}
<b>Mode:</b> Passive monitoring
<b>Interval:</b> 60 seconds
<b>Tagging:</b> system | fix-related

<b>Watching for:</b>
$FIX_DESCRIPTION

Status file: <code>/tmp/watchdog_${SESSION_ID}_status.json</code>"

while true; do
    TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    ((CHECK_COUNT++))

    echo "" >> "$LOG_FILE"
    echo "--- Check #$CHECK_COUNT: $TIMESTAMP ---" >> "$LOG_FILE"

    # Fetch recent logs from backend container (customize container name)
    LOGS=$(docker logs ${CONTAINER_NAME} --since "${INTERVAL}s" 2>&1)

    # Check for errors (case insensitive, all patterns)
    ALL_PATTERNS="$SYSTEM_PATTERNS"
    if [ -n "$FIX_PATTERNS" ]; then
        ALL_PATTERNS="$ALL_PATTERNS|$FIX_PATTERNS"
    fi

    ERRORS=$(echo "$LOGS" | grep -iE "$ALL_PATTERNS" | grep -v "No errors" | head -20)

    if [ -n "$ERRORS" ]; then
        echo "Found potential errors:" >> "$LOG_FILE"
        echo "$ERRORS" >> "$LOG_FILE"

        # Process each unique error line
        echo "$ERRORS" | while IFS= read -r ERROR_LINE; do
            [ -z "$ERROR_LINE" ] && continue

            # Determine category
            if is_fix_related "$ERROR_LINE"; then
                CATEGORY="fix-related"
            else
                CATEGORY="system"
            fi

            # Extract error type
            ERROR_TYPE=$(echo "$ERROR_LINE" | grep -oE "(Error|Exception|Timeout|Failed)" | head -1)
            ERROR_TYPE=${ERROR_TYPE:-"Error"}

            # Check if duplicate (include category in signature)
            if ! is_duplicate "$CATEGORY:$ERROR_TYPE:$ERROR_LINE"; then
                # Get more context
                STACK_TRACE=$(echo "$LOGS" | grep -A 10 -B 2 "$(echo "$ERROR_LINE" | head -c 50)" | head -30)
                create_incident "$CATEGORY" "$ERROR_TYPE" "$ERROR_LINE" "$STACK_TRACE"
            else
                echo "  [$CATEGORY] (duplicate - skipped)" >> "$LOG_FILE"
            fi
        done
    else
        echo "✓ No errors detected" >> "$LOG_FILE"
    fi

    # Write status file every check (for Claude to read)
    write_status

    sleep $INTERVAL
done

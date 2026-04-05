#!/usr/bin/env bash
# Stop hook: Ralph Wiggum verifier loop — blocks Claude's exit when tests fail.
#
# Reads loop state from .claude/wrought-loop-state.json. If an active loop
# exists, runs the configured verifier command. On failure, blocks exit and
# feeds back the error. On success (or budget exhaustion), allows exit.
#
# Safety: respects stop_hook_active to prevent infinite re-blocking.
# Ordering: runs AFTER context-alert.py (which blocks at 80% context).

set -euo pipefail

# --- Read hook input from stdin ---
INPUT=$(cat)

# Parse stop_hook_active from input (jq with python3 fallback)
if command -v jq &>/dev/null; then
    STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
    CWD=$(echo "$INPUT" | jq -r '.cwd // "."')
else
    STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('stop_hook_active', False)).lower())")
    CWD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('cwd', '.'))")
fi

# If Claude is already continuing from a Stop hook block, don't re-block.
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
    exit 0
fi

# --- Read loop state ---
STATE_FILE="$CWD/.claude/wrought-loop-state.json"

if [ ! -f "$STATE_FILE" ]; then
    exit 0
fi

# Parse state file
if command -v jq &>/dev/null; then
    ACTIVE=$(jq -r '.active // false' "$STATE_FILE")
    VERIFIER_CMD=$(jq -r '.verifier_command // ""' "$STATE_FILE")
    MAX_ITER=$(jq -r '.max_iterations // 5' "$STATE_FILE")
    CUR_ITER=$(jq -r '.current_iteration // 0' "$STATE_FILE")
    FINDING_ID=$(jq -r '.finding_id // "unknown"' "$STATE_FILE")
else
    read_state() {
        python3 -c "
import sys, json
with open('$STATE_FILE') as f:
    d = json.load(f)
print(str(d.get('active', False)).lower())
print(d.get('verifier_command', ''))
print(d.get('max_iterations', 5))
print(d.get('current_iteration', 0))
print(d.get('finding_id', 'unknown'))
"
    }
    STATE_OUTPUT=$(read_state)
    ACTIVE=$(echo "$STATE_OUTPUT" | sed -n '1p')
    VERIFIER_CMD=$(echo "$STATE_OUTPUT" | sed -n '2p')
    MAX_ITER=$(echo "$STATE_OUTPUT" | sed -n '3p')
    CUR_ITER=$(echo "$STATE_OUTPUT" | sed -n '4p')
    FINDING_ID=$(echo "$STATE_OUTPUT" | sed -n '5p')
fi

# If no active loop, check for pending review
if [ "$ACTIVE" != "true" ]; then
    # Check if review is pending (verifier passed but /forge-review not yet run)
    if command -v jq &>/dev/null; then
        REVIEW_PENDING=$(jq -r '.review_pending // false' "$STATE_FILE")
    else
        REVIEW_PENDING=$(python3 -c "
import json
with open('$STATE_FILE') as f:
    d = json.load(f)
print(str(d.get('review_pending', False)).lower())
")
    fi
    if [ "$REVIEW_PENDING" = "true" ]; then
        if command -v jq &>/dev/null; then
            jq -n \
                --arg reason "Verifier passed. Run \`/forge-review --scope=diff\` to complete the review cycle." \
                '{"decision": "block", "reason": $reason}'
        else
            python3 -c "
import json, sys
json.dump({'decision': 'block', 'reason': 'Verifier passed. Run \`/forge-review --scope=diff\` to complete the review cycle.'}, sys.stdout)
"
        fi
        exit 0
    fi
    exit 0
fi

# If max iterations reached, deactivate and allow exit
if [ "$CUR_ITER" -ge "$MAX_ITER" ]; then
    if command -v jq &>/dev/null; then
        jq '.active = false' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    else
        python3 -c "
import json
with open('$STATE_FILE') as f:
    d = json.load(f)
d['active'] = False
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
"
    fi
    exit 0
fi

# --- Run verifier ---
VERIFIER_EXIT=0
VERIFIER_OUTPUT=$(eval "$VERIFIER_CMD" 2>&1) || VERIFIER_EXIT=$?
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# --- Write capsule artifact ---
CAPSULE_DIR="$CWD/docs/capsules/${FINDING_ID}/iter_${CUR_ITER}"
mkdir -p "$CAPSULE_DIR" 2>/dev/null || true
echo "$VERIFIER_OUTPUT" > "$CAPSULE_DIR/run.log" 2>/dev/null || true

# --- Update state ---
NEXT_ITER=$((CUR_ITER + 1))
RESULT="fail"
if [ "$VERIFIER_EXIT" -eq 0 ]; then
    RESULT="pass"
fi

if command -v jq &>/dev/null; then
    jq --arg result "$RESULT" \
       --arg ts "$TIMESTAMP" \
       --argjson exit_code "$VERIFIER_EXIT" \
       --argjson next "$NEXT_ITER" \
       --argjson pass_flag "$([ "$VERIFIER_EXIT" -eq 0 ] && echo true || echo false)" \
       '.current_iteration = $next |
        .history += [{"iteration": .current_iteration, "result": $result, "exit_code": $exit_code, "timestamp": $ts}] |
        if $pass_flag then .active = false | .review_pending = true else . end' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
else
    python3 -c "
import json
with open('$STATE_FILE') as f:
    d = json.load(f)
d['current_iteration'] = $NEXT_ITER
d.setdefault('history', []).append({
    'iteration': $CUR_ITER,
    'result': '$RESULT',
    'exit_code': $VERIFIER_EXIT,
    'timestamp': '$TIMESTAMP'
})
if $VERIFIER_EXIT == 0:
    d['active'] = False
    d['review_pending'] = True
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
"
fi

# --- Decision ---
if [ "$VERIFIER_EXIT" -eq 0 ]; then
    # Block exit — require /forge-review before completing the cycle
    if command -v jq &>/dev/null; then
        jq -n \
            --arg reason "Verifier passed. Run \`/forge-review --scope=diff\` to complete the review cycle." \
            '{"decision": "block", "reason": $reason}'
    else
        python3 -c "
import json, sys
json.dump({'decision': 'block', 'reason': 'Verifier passed. Run \`/forge-review --scope=diff\` to complete the review cycle.'}, sys.stdout)
"
    fi
    exit 0
fi

# Verifier failed — block exit with error feedback
ERROR_TAIL=$(echo "$VERIFIER_OUTPUT" | tail -20)

if command -v jq &>/dev/null; then
    jq -n \
        --arg reason "Verifier failed (iteration ${NEXT_ITER}/${MAX_ITER}). Fix the failing tests and try again. Capsule: docs/capsules/${FINDING_ID}/iter_${CUR_ITER}/run.log

Last 20 lines:
${ERROR_TAIL}" \
        '{"decision": "block", "reason": $reason}'
else
    python3 -c "
import json, sys
reason = '''Verifier failed (iteration ${NEXT_ITER}/${MAX_ITER}). Fix the failing tests and try again. Capsule: docs/capsules/${FINDING_ID}/iter_${CUR_ITER}/run.log

Last 20 lines:
${ERROR_TAIL}'''
json.dump({'decision': 'block', 'reason': reason}, sys.stdout)
"
fi

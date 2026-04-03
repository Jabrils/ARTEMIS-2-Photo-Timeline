# Watchdog Session: {Description}

**Started**: {YYYY-MM-DD HH:MM} UTC
**Status**: Active (monitoring in background)
**Session ID**: {session_id}
**Mode**: Passive log watching (60s interval)
**De-duplication**: Enabled
**Incident Tagging**: system | fix-related

---

## Context

**What Was Fixed**: {from user input and recent RCAs/plans}
**What We're Watching For**: {error patterns relevant to the fix}

---

## Log Sources

| Source | Command |
|--------|---------|
| Backend container | `docker logs {container_name} --since 1m` |

---

## Error Patterns

### System-Wide Patterns (Smart Matching for JSON Logs)

| Pattern | Indicates | Notes |
|---------|-----------|-------|
| `"level":\s*"error"` | Error-level log entries | Matches actual errors, not field names |
| `"level":\s*"warning"` | Warning-level log entries | Catches warnings too |
| `Traceback` | Python tracebacks | Stack trace start |
| `_error"\|_failed"` | Event names ending in error/failed | e.g., `download_error`, `upload_failed` |
| `Exception:\|Error:` | Exception messages | Actual exception text |
| `CRITICAL\|FATAL` | Critical/fatal logs | Severe errors |

**Why Smart Matching?**
- Old pattern `error` matched `"parse_errors": 0` (false positive)
- New pattern `"level":\s*"error"` only matches actual error-level logs
- Prevents false positives from field names containing "error"

### Fix-Related Patterns (Specific to This Session)

| Pattern | Indicates |
|---------|-----------|
| {fix_pattern_1} | {description} |
| {fix_pattern_2} | {description} |
| {fix_pattern_3} | {description} |

---

## Control Commands

**Check watchdog status (reads latest status file)**:
```bash
cat /tmp/watchdog_{session_id}_status.json
```

**Check full watchdog log**:
```bash
tail -50 /tmp/watchdog_{session_id}.log
```

**Check reported incidents**:
```bash
cat /tmp/watchdog_{session_id}_reported.txt
```

**Check for incident files**:
```bash
ls -la /tmp/watchdog_{session_id}_incidents/
```

**Stop watchdog**:
```bash
kill $(cat /tmp/watchdog_{session_id}.pid) 2>/dev/null && echo "Stopped"
```

---

## System Incidents

| Time | Error | Incident File |
|------|-------|---------------|
| (none yet) | | |

---

## Fix-Related Incidents

| Time | Error | Incident File |
|------|-------|---------------|
| (none yet) | | |

---

## Latest Status

(Auto-updated every 60 seconds - read from `/tmp/watchdog_{session_id}_status.json`)

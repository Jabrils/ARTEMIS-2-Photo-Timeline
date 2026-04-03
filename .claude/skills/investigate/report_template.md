# Investigation Report Template

Write the report to: `docs/investigations/{YYYY-MM-DD_HHMM}_{issue_name}.md`

Example: `docs/investigations/2026-01-22_1645_url_refresh_timeout.md`

Use this structure:

```markdown
# Investigation: {Issue Title}

**Date**: {YYYY-MM-DD}
**Investigator**: Claude Code (Session {number})
**Severity**: {Critical/High/Medium/Low}
**Status**: Investigation Complete

---

## Executive Summary

{2-3 sentences describing what happened and the impact}

---

## External Research Findings

### Official Documentation Consulted
- {Technology/API name}: {Link to relevant docs}
- {Key findings from docs}

### Known Issues / Community Reports
- {Any relevant issues found online}
- {Stack Overflow, GitHub issues, forum posts}

### API/Library Behavior Notes
- {Documented rate limits, timeouts, etc.}
- {Any undocumented behavior discovered}

---

## Learnings from Previous RCAs/Investigations/Research

### Related Past Incidents
- {List any related RCAs, investigations, or research found}
- {What was learned from them}

### Patterns Identified
- {Is this a recurring issue?}
- {Has a similar fix been attempted before?}

### Applicable Previous Solutions
- {Solutions from past incidents that might apply here}

---

## Timeline of Events

| Time (UTC) | Event | Details |
|------------|-------|---------|
| HH:MM:SS | Event name | Description |

---

## Root Cause Analysis

### Primary Cause
{The main reason this happened}

### Secondary Cause
{Contributing factor}

### Tertiary Cause (if applicable)
{Additional contributing factor}

---

## Contributing Factors

### 1. {Factor Name}
{Description with code evidence}

### 2. {Factor Name}
{Description with code evidence}

---

## Evidence

### Log Evidence
```json
{Relevant log entries}
```

### Code Evidence
```python
# file.py:line_number
{Relevant code snippet}
```

---

## Impact Assessment

| Metric | Value |
|--------|-------|
| Records affected | X |
| Data loss | X% |
| Downtime | X minutes |

---

## Recommended Fixes

### Fix 1: {Title} (HIGH/MEDIUM/LOW PRIORITY)
{Description with code example}

**Informed by**: {Reference to past RCA/investigation if applicable, or "New approach"}

### Fix 2: {Title} (HIGH/MEDIUM/LOW PRIORITY)
{Description with code example}

**Informed by**: {Reference to past RCA/investigation if applicable, or "New approach"}

---

## Upstream/Downstream Impact Analysis

### Upstream (Callers)
{What calls the affected code}

### Downstream (Called Methods)
{What the affected code calls}

---

## Verification Plan

1. {How to verify fix 1 works}
2. {How to verify fix 2 works}

---

**Investigation Complete**: {YYYY-MM-DD HH:MM} UTC
**Ready for**: {RCA Document / Implementation Plan / Fix}
```

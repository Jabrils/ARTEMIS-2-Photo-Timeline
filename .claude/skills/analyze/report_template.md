# Analysis Report Template (All Modes)

```markdown
# Systems Analysis: {Mode} - {Scope}

**Date**: {YYYY-MM-DD HH:MM} UTC
**Analyst**: Claude Code (Session {N})
**Mode**: {Health | Patterns | Component | Risk | Architecture}
**Interactive Checkpoints**: {N} decisions made by user

---

## Executive Summary
{2-3 sentences: What was analyzed, key finding, main recommendation}

---

## User Context
{Captured from checkpoints: focus areas, known issues, risk tolerance, etc.}

---

## Scope & Methodology
- **Analyzed**: {What was examined}
- **Period**: {Time range if applicable}
- **Data Sources**: {RCAs, incidents, logs, code}

---

## Key Findings

### Finding 1: {Title}
**Severity**: {Critical | High | Medium | Low}
**Category**: {Reliability | Performance | Security | Architecture}
**User Validation**: {New finding | Known-fixing | Known-accepted | N/A}
{Description with evidence}

---

## {Mode-Specific Section}
{Health: Scores | Patterns: Pattern list | Risk: Risk matrix | Architecture: Discrepancies}

---

## Design Considerations
{Any findings that triggered design escalation, with user's decision}

---

## Fix Escalations
{Any findings that triggered fix escalation, with user's decision}

---

## Recommendations

### Immediate (This Week)
1. {High-priority action}

### Short-term (This Month)
1. {Medium-priority action}

### Strategic (This Quarter)
1. {Long-term improvement}

---

## Related Documents
- {Links to relevant RCAs, incidents}

---

**Analysis Complete**: {YYYY-MM-DD HH:MM} UTC
```

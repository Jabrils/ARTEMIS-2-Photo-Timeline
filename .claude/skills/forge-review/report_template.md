# Review Report Template

Write to: `docs/reviews/{YYYY-MM-DD_HHMM}_{scope}.md`

Example: `docs/reviews/2026-03-03_1400_diff.md`

```markdown
# Code Review: {scope_description}

**Date**: {YYYY-MM-DD}
**Scope**: {diff|full} — {N} files reviewed
**Reviewer**: /forge-review (4 subagents)

---

## Executive Summary

{1-3 sentences summarizing the review. Include counts: N critical, N warnings, N suggestions across N files. Highlight the most important finding if any Critical issues exist.}

---

## Critical Findings

{Findings that must be fixed — algorithmic issues in hot paths, paradigm violations causing bugs, severe performance anti-patterns, dangerous data structure mismatches.}

{If no Critical findings: "No critical findings."}

### C{N}: {title}

- **File**: {path}:{line}
- **Agent**: {which subagent found this — Complexity Analyst, DS&A Reviewer, Paradigm Enforcer, or Efficiency Sentinel}
- **Issue**: {description of the problem}
- **Impact**: {why this matters — performance, correctness, maintainability}
- **Suggested approach**: {guidance on how to address — NOT auto-fix, just direction}

---

## Warnings

{Findings that should be fixed — suboptimal data structures, minor paradigm drift, performance concerns with measurable impact.}

{If no Warnings: "No warnings."}

### W{N}: {title}

- **File**: {path}:{line}
- **Agent**: {which subagent}
- **Issue**: {description}
- **Suggested approach**: {guidance}

---

## Suggestions

{Nice-to-haves — alternative approaches, micro-optimizations, style consistency improvements.}

{If no Suggestions: "No suggestions."}

### S{N}: {title}

- **File**: {path}:{line}
- **Agent**: {which subagent}
- **Issue**: {description}

---

## Subagent Reports

{Raw structured output from each subagent for full detail. Include even if a subagent found no issues — state "No findings" for that agent.}

### Complexity Analyst

{Full structured output from complexity-analyst subagent}

### DS&A Reviewer

{Full structured output from ds-reviewer subagent}

### Paradigm Enforcer

{Full structured output from paradigm-enforcer subagent}

### Efficiency Sentinel

{Full structured output from efficiency-sentinel subagent}
```

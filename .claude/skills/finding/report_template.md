# Finding Report Template

Write to: `docs/findings/{YYYY-MM-DD_HHMM}_{name}.md`

Example: `docs/findings/2026-02-02_0800_taxonomy_gap_proactive_findings.md`

```markdown
# Finding: {Brief Title}

**Date**: {YYYY-MM-DD}
**Discovered by**: {Skill or method that found this, e.g., `/analyze architecture`}
**Type**: {Defect | Vulnerability | Debt | Gap | Drift}
**Severity**: {Critical | High | Medium | Low}
**Status**: Open

---

## What Was Found

{Factual description of the finding. What exists or is missing, where, and what it affects.}

---

## Affected Components

- {File, module, or system 1}
- {File, module, or system 2}

---

## Evidence

{Code snippets, configuration excerpts, test results, or analysis output that demonstrates the finding.}

---

## Preliminary Assessment

**Likely cause**: {Brief factual assessment of why this exists}

**Likely scope**: {How widespread is this -- isolated or systemic?}

**Likely impact**: {What happens if this is not addressed?}

---

## Classification Rationale

**Type: {Type}** -- {Why this type was chosen over alternatives}

**Severity: {Severity}** -- {What criteria drove the severity rating}

---

**Finding Logged**: {YYYY-MM-DD HH:MM} UTC
```

# Design Analysis Report Template

All modes generate reports with this structure:

```markdown
# Design Analysis: {Topic}

**Date**: {YYYY-MM-DD HH:MM} UTC
**Analyst**: Claude Code (Session {N})
**Mode**: {Tradeoff | Pattern | Migrate | Validate | Impact}
**Interactive Checkpoints**: {N} decisions made by user

---

## Executive Summary
{2-3 sentences}

---

## User Context
- **Goal**: {from checkpoint}
- **Constraints**: {from checkpoint}
- **Priorities**: {weighted list from checkpoint}

---

## Current State Analysis
{Codebase findings}

---

## External Research (2026 Sources)
{Research findings with source links}

---

## {Mode-Specific Analysis}
{Options / Pattern / Migration Plan / Validation / Impact}

---

## Trade-Off Matrix (if applicable)
| Criterion | Weight | Option 1 | Option 2 | Current |
|-----------|--------|----------|----------|---------|

---

## Recommendation
{With rationale and key trade-off}

---

## Impact Assessment
{Full 7-section framework}

---

## Risks & Mitigations
| Risk | L | I | Mitigation |

---

## Next Steps
- [ ] {Action items}

---

## Sources
- {URLs and file references}

---

**Analysis Complete**: {timestamp}
```

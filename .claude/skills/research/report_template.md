# Research Report Template

Write to: `docs/research/{YYYY-MM-DD_HHMM}_{topic}.md`

Example: `docs/research/2026-01-22_1730_iterable_batch_export_expiration.md`

```markdown
# Research: {Topic/Question}

**Date**: {YYYY-MM-DD}
**Researcher**: Claude Code
**Status**: Complete

---

## Question

{The original question or topic being researched}

---

## TL;DR

{2-3 sentence summary of the key findings}

---

## Official Documentation

### {Technology Name} Documentation

{Findings from official docs}

> "{Direct quote from documentation}"
> — Source: [{Doc title}]({URL})

### Key Points from Docs
- {Point 1}
- {Point 2}
- {Point 3}

---

## Community Knowledge

### Stack Overflow / GitHub Issues

{Findings from community sources}

> "{Relevant quote or summary}"
> — Source: [{Title}]({URL})

### Common Pitfalls Mentioned
- {Pitfall 1}
- {Pitfall 2}

---

## Best Practices

Based on research:

1. **{Practice 1}**: {Explanation}
2. **{Practice 2}**: {Explanation}
3. **{Practice 3}**: {Explanation}

---

## Relevance to Our Codebase

{How this applies to our specific implementation}

### Files That May Be Affected
- {file1.py}
- {file2.py}

---

## Implementation Analysis

### Already Implemented
{What we already have in place that addresses this topic}

- {Feature/pattern we already use}: `{file.py:line}` - {how it relates}

### Should Implement
{What we should add based on this research}

1. **{Recommendation}**
   - Why: {Justification based on research}
   - Where: `{file.py}`
   - How: {Brief approach}

### Should NOT Implement
{What we should avoid and why}

1. **{Anti-pattern or approach to avoid}**
   - Why not: {Reason based on research}
   - Source: {Reference}

---

## Sources

1. [{Title 1}]({URL1}) - {brief description}
2. [{Title 2}]({URL2}) - {brief description}
3. [{Title 3}]({URL3}) - {brief description}

---

## Related Documents

- {Link to related RCA if any}
- {Link to related investigation if any}
- {Link to related research if any}

---

**Research Complete**: {YYYY-MM-DD HH:MM} UTC
```

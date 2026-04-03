# Design Escalation Architecture

**Document**: Design Escalation Specification for Systems Analyst Skill
**Date**: 2026-01-23
**Status**: Documented (pending implementation)

---

## Overview

When `/analyze` detects that a finding suggests **architectural redesign** rather than just a fix, it should offer the user the option to explore design alternatives. This document specifies how that escalation works.

---

## The Problem

Analysis often reveals issues where the fix isn't "change line X" but rather "reconsider approach Y":

| Analysis Finding | Point Fix | Redesign Opportunity |
|------------------|-----------|----------------------|
| "Retry logic is scattered across 5 files" | Add retry to 6th file | Centralize retry in middleware |
| "NDJSON parsing fails on malformed records" | Add try/catch | Consider CSV format instead |
| "Download times out after 30 min" | Increase timeout | Stream directly to GCS |
| "Rate limiting causes cascading failures" | Add backoff | Implement circuit breaker pattern |

The Systems Analyst should recognize these patterns and offer design exploration.

---

## Escalation Triggers

The skill detects redesign opportunities when findings match these patterns:

### Pattern 1: Scattered Implementation
```
Detection: Same logic duplicated in 3+ files
Signal: "retry", "error handling", "validation", "logging" patterns repeated
Escalation: "This pattern is duplicated. Consider centralizing?"
```

### Pattern 2: Fundamental Mismatch
```
Detection: Technology choice conflicts with requirements
Signal: Format limitations, protocol constraints, API mismatches
Escalation: "Current approach has inherent limitations. Explore alternatives?"
```

### Pattern 3: Scale Ceiling
```
Detection: Approach won't scale to next order of magnitude
Signal: Memory growth, timeout sensitivity, single-threaded bottlenecks
Escalation: "This will hit limits at 10x scale. Consider architectural change?"
```

### Pattern 4: Recurring Failures
```
Detection: Same component appears in 3+ incidents
Signal: Pattern analysis shows repeated failures in same area
Escalation: "This component fails frequently. Redesign may be more effective than fixes?"
```

### Pattern 5: Coupling Hotspot
```
Detection: Component has high fan-in (many dependents)
Signal: Changes to this component break many others
Escalation: "High coupling detected. Consider interface redesign?"
```

---

## Escalation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS IN PROGRESS                         │
│                    (any mode: risk, patterns, component, etc.)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Finding detected │
                    │ that matches     │
                    │ escalation       │
                    │ trigger pattern  │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT: DESIGN ESCALATION                                    │
│                                                                 │
│ "Finding: {description}                                         │
│                                                                 │
│ This suggests a design consideration rather than a point fix.   │
│ Would you like to explore design alternatives?"                 │
│                                                                 │
│ Options:                                                        │
│ ○ Yes, explore inline (quick trade-off analysis)               │
│ ○ Yes, deep dive (/design skill for thorough analysis)         │
│ ○ No, just note it in the report                               │
│ ○ No, this is a known accepted limitation                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              │               │               │               │
              ▼               ▼               ▼               ▼
        "Inline"        "Deep dive"      "Note it"      "Accepted"
              │               │               │               │
              ▼               ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────┐ ┌─────────────┐
│ Provide quick   │ │ Output:         │ │ Add to  │ │ Mark as     │
│ trade-off table │ │ "Run /design    │ │ report  │ │ "Accepted   │
│ inline in       │ │ {topic} for     │ │ as      │ │ Limitation" │
│ analysis        │ │ detailed        │ │ finding │ │ in report   │
│                 │ │ analysis"       │ │         │ │             │
│ Continue with   │ │                 │ │         │ │             │
│ analysis        │ │ STOP analysis   │ │         │ │             │
└─────────────────┘ └─────────────────┘ └─────────┘ └─────────────┘
```

---

## Inline Trade-Off Analysis

When user selects "explore inline", provide a quick structured analysis:

```markdown
### Design Consideration: {Topic}

**Current Approach**: {What exists now}
**Limitation**: {Why it's problematic}

#### Alternatives Considered

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| {Option A} | {pros} | {cons} | {Low/Med/High} |
| {Option B} | {pros} | {cons} | {Low/Med/High} |
| {Option C - current} | {pros} | {cons} | N/A |

#### Quick Recommendation
{One paragraph with suggested direction and rationale}

#### For Deeper Analysis
Run `/design {topic}` for comprehensive trade-off analysis with:
- Detailed implementation considerations
- Risk assessment for each option
- Migration path if changing approach
```

---

## The `/design` Skill

A separate skill for deep architectural analysis when inline isn't sufficient.

### Trigger
```
/design {topic}
/design "CSV vs NDJSON for batch exports"
/design "retry strategy centralization"
/design "streaming architecture for large downloads"
```

### Purpose
Comprehensive design analysis for architectural decisions, including:
- Full trade-off matrix
- Implementation complexity assessment
- Risk analysis for each option
- Migration considerations
- Recommendation with rationale

### Skill Modes

```
/design tradeoff {topic}     # Compare approaches (default)
/design pattern {name}       # Explain a design pattern and applicability
/design migrate {from} {to}  # Plan migration between approaches
/design validate {proposal}  # Review a proposed design
```

### `/design tradeoff` Workflow

```
1. UNDERSTAND CONTEXT
   - Read relevant code
   - Understand current implementation
   - Identify constraints (API limits, data volumes, etc.)

2. CHECKPOINT 1: CLARIFY REQUIREMENTS
   Use AskUserQuestion:
   "What matters most for this decision?"
   Options:
   - Performance (speed, throughput)
   - Reliability (error handling, recovery)
   - Simplicity (maintenance, debugging)
   - Cost (API calls, compute, storage)
   - Let me specify priorities...

3. RESEARCH ALTERNATIVES
   - Identify 3-5 viable approaches
   - For each: how it works, pros, cons
   - Consider: what would {company} do at scale?

4. CHECKPOINT 2: VALIDATE OPTIONS
   "I've identified these alternatives: {list}
   Any I should add or remove?"

5. ANALYZE TRADE-OFFS
   For each option:
   - Implementation effort (hours/days)
   - Risk level (what could go wrong)
   - Performance characteristics
   - Operational complexity
   - Reversibility (can we change later?)

6. GENERATE REPORT
   Write to: docs/design/{YYYY-MM-DD_HHMM}_{topic}.md

7. CHECKPOINT 3: RECOMMENDATION
   "Based on your priorities ({X}), I recommend {Option}.
   Should I create an implementation plan?"
   Options:
   - Yes, create plan (uses EnterPlanMode)
   - No, just the analysis
   - Let me think about it
```

### Design Report Template

```markdown
# Design Analysis: {Topic}

**Date**: {YYYY-MM-DD HH:MM} UTC
**Analyst**: Claude Code
**Triggered by**: /analyze {mode} finding (or direct invocation)

---

## Context

### Current State
{Description of existing implementation}

### Problem Statement
{Why this design decision matters}

### Constraints
- {Constraint 1: e.g., "Must work with existing API"}
- {Constraint 2: e.g., "Data volumes up to 10GB"}
- {Constraint 3: e.g., "Cannot change upstream format"}

### User Priorities
{From Checkpoint 1: what matters most}

---

## Options Analyzed

### Option 1: {Name}

**Description**: {How it works}

**Implementation**:
```
{Pseudo-code or architectural sketch}
```

**Pros**:
- {Pro 1}
- {Pro 2}

**Cons**:
- {Con 1}
- {Con 2}

**Effort**: {X hours/days}
**Risk**: {Low/Medium/High} - {why}

---

### Option 2: {Name}
{Same structure}

---

### Option 3: {Name} (Current Approach)
{Same structure - always include current as baseline}

---

## Trade-Off Matrix

| Criterion | Weight | Option 1 | Option 2 | Option 3 |
|-----------|--------|----------|----------|----------|
| Performance | {1-5} | {score} | {score} | {score} |
| Reliability | {1-5} | {score} | {score} | {score} |
| Simplicity | {1-5} | {score} | {score} | {score} |
| Cost | {1-5} | {score} | {score} | {score} |
| **Weighted Total** | | **{X}** | **{X}** | **{X}** |

Scoring: 1 = Poor, 5 = Excellent

---

## Recommendation

**Recommended Option**: {Option N}

**Rationale**:
{2-3 paragraphs explaining why this option best fits the constraints and priorities}

**Key Trade-off**:
{What you're giving up by choosing this option}

---

## Migration Path (if changing from current)

### Phase 1: {Description}
- {Step 1}
- {Step 2}

### Phase 2: {Description}
- {Step 1}
- {Step 2}

### Rollback Plan
{How to revert if needed}

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk 1} | {L/M/H} | {L/M/H} | {How to address} |

---

## Next Steps

- [ ] {Action 1}
- [ ] {Action 2}
- [ ] {Action 3}

---

**Analysis Complete**: {YYYY-MM-DD HH:MM} UTC
```

---

## Integration Points

### From `/analyze` to `/design`

When analysis detects design opportunity and user selects "deep dive":

```
Analysis output:
"This finding suggests architectural consideration.

For comprehensive design analysis, run:
/design tradeoff "retry strategy centralization"

This will analyze:
- Alternative approaches
- Trade-offs for your priorities
- Implementation effort
- Migration path

Continuing with remaining analysis findings..."
```

### From `/design` to Implementation

When design analysis completes and user wants to proceed:

```
Design output:
"Recommendation: Centralized retry middleware

Ready to implement?
- Yes → I'll use EnterPlanMode to create implementation plan
- No → Analysis saved to docs/design/{file}.md

Awaiting your decision."
```

---

## File Structure

```
.claude/skills/
├── analyze/
│   ├── SKILL.md                 # Main systems analyst skill
│   └── DESIGN_ESCALATION.md     # This document
└── design/
    └── SKILL.md                 # Design analysis skill (to be created)
```

---

## Examples

### Example 1: Format Trade-off

```
User: /analyze risk

Analysis finds: "NDJSON parsing fails silently on malformed records"

Checkpoint:
"This suggests a design consideration. The current NDJSON approach
has inherent limitations with malformed data.

Would you like to explore format alternatives?"
○ Yes, explore inline
○ Yes, deep dive (/design)
○ No, just note it
○ No, accepted limitation

User selects: "Yes, explore inline"

Inline analysis:
### Design Consideration: Data Format for Batch Exports

**Current**: NDJSON (newline-delimited JSON)
**Limitation**: Malformed records break parsing; no schema enforcement

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| CSV | Schema enforced, partial read OK | Nested data awkward | Medium |
| Parquet | Schema + compression + columnar | Binary, harder to debug | High |
| NDJSON + validation | Keep format, add validation | Doesn't fix root cause | Low |

**Quick Recommendation**: Add validation layer as short-term fix.
Consider Parquet for next major version if data volumes grow.

For deeper analysis: /design tradeoff "batch export format"
```

### Example 2: Architecture Pattern

```
User: /analyze patterns last-30-days

Analysis finds: "ConnectTimeout appears in 8 incidents across 4 components"

Checkpoint:
"This recurring pattern suggests centralized retry handling
rather than fixing each component individually.

Would you like to explore design alternatives?"
○ Yes, explore inline
○ Yes, deep dive (/design)
○ No, just note it

User selects: "Yes, deep dive"

Output:
"For comprehensive retry architecture analysis, run:
/design tradeoff "centralized retry strategy"

This will analyze:
- Middleware vs decorator vs library approaches
- httpx transport retries vs application-level
- Circuit breaker integration
- Backoff strategies

Continuing with pattern analysis..."
```

---

## Implementation Checklist

When implementing this feature:

- [ ] Add escalation trigger detection to `/analyze` skill
- [ ] Add design escalation checkpoint to all modes
- [ ] Implement inline trade-off analysis template
- [ ] Create `/design` skill with tradeoff mode
- [ ] Add design report template
- [ ] Test escalation flow end-to-end
- [ ] Add to .gitignore (personal IP)

---

## Research Sources

This design is informed by 2026 best practices:

1. **Bounded Autonomy**: Clear escalation paths for high-stakes decisions
   - Source: [Agentic AI Trends 2026](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/)

2. **Human-in-the-Loop**: AI accelerates, humans decide
   - Source: [Salesforce - Architectural Decisions](https://www.salesforce.com/blog/architectural-decisions-human-led-ai-powered-approach/)

3. **Plan-and-Execute Pattern**: Strategy model plans, execution follows
   - Source: [Navigating Architectural Trade-offs at Scale](https://hackernoon.com/navigating-architectural-trade-offs-at-scale-to-meet-ai-goals-in-2026)

4. **Skills + Subagents**: Skills provide knowledge, agents execute
   - Source: [Claude Skills vs Sub-agents](https://medium.com/@SandeepTnvs/claude-skills-vs-sub-agents-architecture-use-cases-and-effective-patterns-3e535c9e0122)

---

**Document Complete**: 2026-01-23
**Status**: Ready for implementation after Point 1 (interactive modes)

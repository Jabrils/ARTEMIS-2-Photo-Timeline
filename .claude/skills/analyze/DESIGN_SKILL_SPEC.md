# Design Skill: Complete Specification

**Document**: Full specification for the `/design` skill
**Date**: 2026-01-23
**Status**: Documented (pending implementation)
**Related**: DESIGN_ESCALATION.md (how /analyze triggers /design)

---

## Executive Summary

The `/design` skill is a **research-driven, interactive design analysis tool** that helps make informed architectural decisions. Unlike simple trade-off lists, it:

1. **Researches comprehensively** - codebase, docs, AND online sources (as of 2026)
2. **Assesses impact** - what changes, what breaks, what's the blast radius
3. **Analyzes trade-offs** - structured comparison with weighted scoring
4. **Stays interactive** - user input at every critical decision point

---

## Design Principles

1. **Research-First**: Never recommend without understanding current state AND external best practices
2. **Current-Year Sources**: Always search for 2026 documentation, patterns, and practices
3. **Impact-Aware**: Every design decision includes concrete impact assessment
4. **Interactive**: User validates assumptions, priorities, and findings at checkpoints
5. **Evidence-Based**: Recommendations backed by code analysis AND external sources
6. **Actionable Output**: Ends with clear next steps, not just analysis

---

## Trigger & Modes

```
/design {mode} {topic}

Modes:
/design tradeoff {topic}     # Compare approaches (default, most common)
/design pattern {name}       # Explain pattern and assess applicability
/design migrate {from} {to}  # Plan migration between approaches
/design validate {proposal}  # Review a proposed design
/design impact {change}      # Assess impact of a specific change
```

---

## Research Framework

### Layer 1: Codebase Analysis

**What to examine:**
```
1. Target Component(s)
   - Read all source files
   - Count lines, functions, classes
   - Identify patterns in use
   - Map error handling approach
   - Find hardcoded values, magic numbers

2. Dependencies (Inward)
   - What does this component import?
   - External libraries used
   - Internal modules depended on
   - Configuration dependencies

3. Dependencies (Outward)
   - What imports this component?
   - How many callers?
   - What would break if interface changes?
   - Test coverage

4. Related Code
   - Similar patterns elsewhere in codebase
   - Previous attempts at solving this problem
   - Comments indicating tech debt or TODOs
```

**Tools to use:**
- `Read` - examine source files
- `Grep` - find patterns, imports, usages
- `Glob` - discover related files
- `Task` with Explore agent - understand broader context

### Layer 2: Documentation Analysis

**Internal docs to read:**
```
Priority order:
1. CLAUDE.md              # Project context, decisions, constraints
2. ARCHITECTURE.md        # System design, component relationships
3. README.md              # User manual
4. docs/RCAs/*.md         # Past failures related to this area
5. docs/incidents/*.md    # Incidents involving this component
6. docs/plans/*.md        # Previous design decisions
7. docs/research/*.md     # Prior research on related topics
8. CHANGELOG.md           # History of changes
9. API docs in docs/      # Internal API documentation
```

**What to extract:**
- Original design intent
- Known limitations
- Previous decisions and their rationale
- Constraints (technical, business, regulatory)
- Related incidents and their root causes

### Layer 3: External Research (2026 Sources)

**CRITICAL**: Always include current year in searches to get latest practices.

**What to research:**
```
1. API/Service Documentation
   - Official docs for external APIs (e.g., Iterable, Intercom)
   - Rate limits, quotas, best practices
   - Deprecation notices
   - New features that might help

2. Library Documentation
   - Current version best practices
   - Migration guides if upgrading
   - Known issues, workarounds
   - Performance characteristics

3. Pattern/Practice Research
   - "How does {company} handle {problem} 2026"
   - "{pattern name} best practices 2026"
   - "{technology} at scale 2026"
   - Common pitfalls and anti-patterns

4. Similar Implementations
   - Open source projects solving similar problems
   - Blog posts from engineering teams
   - Conference talks, case studies
```

**Tools to use:**
- `WebSearch` - find current sources (always include "2026" in query)
- `WebFetch` - read specific documentation pages

**Example searches:**
```
"httpx retry best practices 2026"
"Python async streaming large files 2026"
"circuit breaker pattern implementation 2026"
"Iterable API batch export documentation 2026"
"{library name} vs {alternative} comparison 2026"
```

### Layer 4: Impact Assessment

**For every design option, assess:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPACT ASSESSMENT FRAMEWORK                   │
└─────────────────────────────────────────────────────────────────┘

1. CODE CHANGES
   ├── Files to modify: {list with line count estimates}
   ├── Files to create: {new files needed}
   ├── Files to delete: {files that become obsolete}
   ├── Interfaces changing: {API contracts affected}
   └── Estimated lines changed: {rough count}

2. TEST CHANGES
   ├── Tests to update: {existing tests affected}
   ├── New tests needed: {coverage for new code}
   ├── Tests to delete: {obsolete tests}
   └── Test infrastructure: {new fixtures, mocks needed?}

3. CONFIGURATION CHANGES
   ├── Environment variables: {new, changed, removed}
   ├── Config files: {changes needed}
   ├── Feature flags: {if using}
   └── Secrets/credentials: {any new ones needed?}

4. DEPLOYMENT IMPACT
   ├── Database migrations: {schema changes?}
   ├── Breaking changes: {requires coordinated deploy?}
   ├── Rollback complexity: {easy, moderate, hard}
   └── Downtime required: {yes/no, duration}

5. OPERATIONAL IMPACT
   ├── Monitoring changes: {new metrics, alerts}
   ├── Logging changes: {new log patterns}
   ├── Runbook updates: {operational procedures}
   └── On-call impact: {new failure modes to handle}

6. DEPENDENCIES
   ├── New dependencies: {libraries to add}
   ├── Dependency updates: {version bumps needed}
   ├── Removed dependencies: {can remove any?}
   └── Transitive risks: {supply chain considerations}

7. RISK ASSESSMENT
   ├── What could go wrong: {failure scenarios}
   ├── Blast radius: {what's affected if it fails}
   ├── Detection: {how would we know it's broken?}
   └── Recovery: {how do we fix it if broken?}
```

---

## Interactive Workflow

### Mode: Tradeoff Analysis (`/design tradeoff {topic}`)

The most common mode - comparing approaches for a design decision.

```
┌─────────────────────────────────────────────────────────────────┐
│                 /design tradeoff {topic}                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 1: UNDERSTAND THE GOAL                               │
│                                                                 │
│ "What's the design goal for: {topic}?"                         │
│                                                                 │
│ Options:                                                        │
│ ○ Improve reliability (reduce failures)                        │
│ ○ Improve performance (speed, throughput)                      │
│ ○ Reduce complexity (easier to maintain)                       │
│ ○ Add new capability                                           │
│ ○ Let me describe the goal...                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 2: CONSTRAINTS                                       │
│                                                                 │
│ "What constraints should I consider?"                          │
│                                                                 │
│ Options (multiSelect: true):                                   │
│ ○ Must maintain backward compatibility                         │
│ ○ Cannot change external API contracts                         │
│ ○ Limited time/resources for implementation                    │
│ ○ Must work with existing infrastructure                       │
│ ○ No constraints - open to any approach                        │
│ ○ Let me specify constraints...                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 3: PRIORITIES                                        │
│                                                                 │
│ "Rank what matters most (drag to reorder or assign weights):"  │
│                                                                 │
│ 1. _____ Reliability (failure handling, recovery)              │
│ 2. _____ Performance (speed, throughput, latency)              │
│ 3. _____ Simplicity (maintenance, debugging, onboarding)       │
│ 4. _____ Cost (compute, API calls, storage)                    │
│ 5. _____ Time to implement (effort, complexity)                │
│                                                                 │
│ Options:                                                        │
│ ○ Reliability > Performance > Simplicity > Cost > Time         │
│ ○ Performance > Reliability > Time > Simplicity > Cost         │
│ ○ Simplicity > Time > Reliability > Performance > Cost         │
│ ○ Let me specify my own ranking...                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: CODEBASE RESEARCH (Automatic)                          │
│                                                                 │
│ - Read target component source                                  │
│ - Analyze dependencies (in and out)                            │
│ - Find related patterns in codebase                            │
│ - Review related incidents/RCAs                                │
│                                                                 │
│ Output: "Current Implementation Summary"                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 4: VALIDATE CURRENT STATE                            │
│                                                                 │
│ "Here's my understanding of the current implementation:        │
│                                                                 │
│ {Summary of current approach}                                   │
│                                                                 │
│ Files involved: {list}                                          │
│ Pattern used: {identified pattern}                              │
│ Known issues: {from RCAs/incidents}                             │
│                                                                 │
│ Is this accurate?"                                              │
│                                                                 │
│ Options:                                                        │
│ ○ Yes, that's correct                                          │
│ ○ Mostly correct, minor clarification (let me explain)         │
│ ○ Missing important context (let me add)                       │
│ ○ That's not quite right (let me correct)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: EXTERNAL RESEARCH (Automatic)                          │
│                                                                 │
│ WebSearch queries (all include "2026"):                        │
│ - "{topic} best practices 2026"                                │
│ - "{library} {pattern} 2026"                                   │
│ - "{problem} solutions comparison 2026"                        │
│ - "how {company} handles {problem} 2026"                       │
│                                                                 │
│ WebFetch for:                                                   │
│ - Official API documentation                                    │
│ - Library documentation                                         │
│ - Relevant blog posts/case studies                             │
│                                                                 │
│ Output: "External Research Summary"                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 5: VALIDATE RESEARCH SOURCES                         │
│                                                                 │
│ "I found these relevant sources:                               │
│                                                                 │
│ 1. {source 1} - {what it covers}                               │
│ 2. {source 2} - {what it covers}                               │
│ 3. {source 3} - {what it covers}                               │
│                                                                 │
│ Any other sources I should check?"                             │
│                                                                 │
│ Options:                                                        │
│ ○ These look good, proceed                                     │
│ ○ Also check {specific doc/source}                             │
│ ○ Focus more on {specific aspect}                              │
│ ○ Skip external research, just use codebase                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: IDENTIFY OPTIONS (Automatic)                           │
│                                                                 │
│ Based on research, identify 3-5 viable approaches:             │
│ - Option A: {approach based on pattern X}                      │
│ - Option B: {approach based on library Y}                      │
│ - Option C: {approach used by company Z}                       │
│ - Option D: Current approach (baseline)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 6: VALIDATE OPTIONS                                  │
│                                                                 │
│ "I've identified these approaches to evaluate:                 │
│                                                                 │
│ 1. {Option A}: {brief description}                             │
│ 2. {Option B}: {brief description}                             │
│ 3. {Option C}: {brief description}                             │
│ 4. Current approach (baseline)                                 │
│                                                                 │
│ Should I evaluate all of these?"                               │
│                                                                 │
│ Options:                                                        │
│ ○ Yes, evaluate all                                            │
│ ○ Remove {option} - not applicable because...                  │
│ ○ Add another option: {description}                            │
│ ○ Just compare {option A} vs {option B}                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: DEEP ANALYSIS (Automatic)                              │
│                                                                 │
│ For each option:                                                │
│ - How it works (detailed explanation)                          │
│ - Implementation approach                                       │
│ - Pros and cons                                                │
│ - Impact assessment (using framework above)                    │
│ - Effort estimate                                              │
│ - Risk level                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 7: VALIDATE IMPACT ASSESSMENT                        │
│                                                                 │
│ "Here's the impact assessment for {recommended option}:        │
│                                                                 │
│ Files to change: {N} files (~{X} lines)                        │
│ Tests to update: {N} test files                                │
│ New dependencies: {list or 'none'}                             │
│ Breaking changes: {yes/no}                                      │
│ Estimated effort: {X hours/days}                               │
│                                                                 │
│ Does this match your expectations?"                            │
│                                                                 │
│ Options:                                                        │
│ ○ Yes, that seems reasonable                                   │
│ ○ Effort seems underestimated                                  │
│ ○ Effort seems overestimated                                   │
│ ○ Missing some affected files/areas                            │
│ ○ Let me provide more context                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: SCORING & COMPARISON (Automatic)                       │
│                                                                 │
│ Score each option against user's priorities:                   │
│                                                                 │
│ | Criterion      | Weight | Opt A | Opt B | Opt C | Current |  │
│ |----------------|--------|-------|-------|-------|---------|  │
│ | Reliability    | 5      | 4     | 5     | 3     | 2       |  │
│ | Performance    | 4      | 3     | 4     | 5     | 3       |  │
│ | Simplicity     | 3      | 4     | 2     | 3     | 4       |  │
│ | Cost           | 2      | 4     | 3     | 2     | 5       |  │
│ | Time           | 1      | 3     | 2     | 4     | 5       |  │
│ |----------------|--------|-------|-------|-------|---------|  │
│ | Weighted Total |        | 56    | 54    | 48    | 45      |  │
│                                                                 │
│ Scoring: 1=Poor, 5=Excellent                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 8: REVIEW RECOMMENDATION                             │
│                                                                 │
│ "Based on your priorities, I recommend: {Option A}             │
│                                                                 │
│ Summary:                                                        │
│ ✓ Best reliability score (your top priority)                   │
│ ✓ Reasonable implementation effort                             │
│ ✗ Slightly more complex than current                           │
│                                                                 │
│ Key trade-off: {what you gain} vs {what you lose}              │
│                                                                 │
│ Do you want to proceed with this recommendation?"              │
│                                                                 │
│ Options:                                                        │
│ ○ Yes, create the design document                              │
│ ○ I prefer {other option} - let me explain why                 │
│ ○ Need more analysis on {specific aspect}                      │
│ ○ Let me think about it - just save the analysis               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: GENERATE REPORT                                        │
│                                                                 │
│ Write to: docs/design/{YYYY-MM-DD_HHMM}_{topic}.md             │
│                                                                 │
│ Include:                                                        │
│ - Executive summary                                             │
│ - User context (goals, constraints, priorities)                │
│ - Current state analysis                                        │
│ - External research findings                                    │
│ - All options with full analysis                               │
│ - Impact assessment for each                                   │
│ - Trade-off matrix                                             │
│ - Recommendation with rationale                                │
│ - Implementation considerations                                 │
│ - Next steps                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHECKPOINT 9: NEXT STEPS                                        │
│                                                                 │
│ "Design analysis complete.                                      │
│                                                                 │
│ What would you like to do next?"                               │
│                                                                 │
│ Options:                                                        │
│ ○ Create implementation plan (EnterPlanMode)                   │
│ ○ Start implementing now                                       │
│ ○ Share with team for review first                             │
│ ○ Save for later - just the analysis for now                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Other Modes

### Mode: Pattern Analysis (`/design pattern {name}`)

Explain a design pattern and assess its applicability to the current codebase.

**Workflow:**
1. **Checkpoint 1**: "What's the context for exploring this pattern?"
   - Considering adoption
   - Debugging existing implementation
   - Comparing with alternative patterns
   - Educational/understanding

2. **Research Phase**:
   - WebSearch: "{pattern name} implementation 2026"
   - WebSearch: "{pattern name} pros cons 2026"
   - WebSearch: "{pattern name} {language} example 2026"
   - Read codebase for existing pattern usage

3. **Checkpoint 2**: "I found these variations of {pattern}. Which interests you?"

4. **Analysis Phase**:
   - Pattern explanation (what, why, when)
   - Applicability to this codebase
   - Where it could be applied
   - Implementation approach
   - Pros/cons in this context

5. **Checkpoint 3**: Validate applicability assessment

6. **Output**: Pattern analysis document

---

### Mode: Migration Planning (`/design migrate {from} {to}`)

Plan migration from one approach to another.

**Workflow:**
1. **Checkpoint 1**: "Why are you migrating?"
   - Performance issues
   - Maintainability concerns
   - Deprecation of current approach
   - New requirements

2. **Checkpoint 2**: Constraints (timeline, risk tolerance, parallel operation?)

3. **Research Phase**:
   - Current implementation deep dive
   - Target approach research
   - Migration guides from external sources
   - Similar migrations (case studies)

4. **Checkpoint 3**: Validate understanding of current and target state

5. **Analysis Phase**:
   - Migration strategy options (big bang, strangler fig, parallel run)
   - Step-by-step migration plan
   - Risk assessment per step
   - Rollback points
   - Testing strategy

6. **Checkpoint 4**: Review migration plan

7. **Output**: Migration plan document

---

### Mode: Design Validation (`/design validate {proposal}`)

Review a proposed design before implementation.

**Workflow:**
1. **Checkpoint 1**: "How should I receive the proposal?"
   - Read from file (path)
   - Paste it here
   - It's in the conversation above

2. **Checkpoint 2**: "What aspects should I focus on?"
   - Completeness (does it cover all requirements?)
   - Feasibility (can we actually build this?)
   - Risk (what could go wrong?)
   - All of the above

3. **Analysis Phase**:
   - Compare proposal to codebase reality
   - Identify gaps or conflicts
   - Research alternatives for weak points
   - Assess effort estimates

4. **Checkpoint 3**: Present findings, ask for clarification on ambiguities

5. **Output**: Design review with recommendations

---

### Mode: Impact Analysis (`/design impact {change}`)

Assess the impact of a specific change before making it.

**Workflow:**
1. **Checkpoint 1**: "Describe the change you're considering"
   - Natural language description
   - Point to specific code/file
   - Reference a ticket/issue

2. **Research Phase**:
   - Find all usages of affected code
   - Map dependencies
   - Identify tests that would be affected
   - Check for related configurations

3. **Checkpoint 2**: "Here's what I found would be affected. Anything missing?"

4. **Analysis Phase**:
   - Full impact assessment using framework
   - Risk scoring
   - Suggested approach

5. **Output**: Impact assessment document

---

## Report Template

```markdown
# Design Analysis: {Topic}

**Date**: {YYYY-MM-DD HH:MM} UTC
**Analyst**: Claude Code (Session {N})
**Mode**: {Tradeoff | Pattern | Migrate | Validate | Impact}
**Interactive Checkpoints**: {N} decisions made by user

---

## Executive Summary

{2-3 sentences: What was analyzed, key finding, recommendation}

---

## User Context

### Goal
{From Checkpoint 1}

### Constraints
{From Checkpoint 2}

### Priorities (Weighted)
| Priority | Weight |
|----------|--------|
| {Priority 1} | {N} |
| {Priority 2} | {N} |
| ... | ... |

---

## Current State Analysis

### Implementation Overview
{Summary of current approach}

### Files Involved
| File | Purpose | LOC |
|------|---------|-----|
| {file} | {purpose} | {lines} |

### Current Pattern
{Identified pattern with explanation}

### Known Issues
{From RCAs/incidents}

---

## External Research (2026 Sources)

### Sources Consulted
1. **{Source 1}** - {URL}
   - Key finding: {summary}

2. **{Source 2}** - {URL}
   - Key finding: {summary}

### Industry Best Practices
{Summary of current best practices from research}

### How Others Solve This
{Examples from other companies/projects}

---

## Options Analyzed

### Option 1: {Name}

**Description**
{Detailed explanation of the approach}

**How It Works**
```
{Pseudo-code or architectural sketch}
```

**Pros**
- {Pro 1}
- {Pro 2}

**Cons**
- {Con 1}
- {Con 2}

**Impact Assessment**
| Aspect | Details |
|--------|---------|
| Files to modify | {list} |
| Tests to update | {list} |
| New dependencies | {list or none} |
| Breaking changes | {yes/no, details} |
| Estimated effort | {X hours/days} |
| Risk level | {Low/Medium/High} |

**Source/Inspiration**
{Where this approach comes from - external source or codebase pattern}

---

### Option 2: {Name}
{Same structure as Option 1}

---

### Option 3: Current Approach (Baseline)
{Same structure - always include current for comparison}

---

## Trade-Off Matrix

| Criterion | Weight | Option 1 | Option 2 | Option 3 | Current |
|-----------|--------|----------|----------|----------|---------|
| {Criterion 1} | {W} | {score}/5 | {score}/5 | {score}/5 | {score}/5 |
| {Criterion 2} | {W} | {score}/5 | {score}/5 | {score}/5 | {score}/5 |
| ... | ... | ... | ... | ... | ... |
| **Weighted Total** | | **{X}** | **{X}** | **{X}** | **{X}** |

**Scoring**: 1 = Poor, 2 = Below Average, 3 = Average, 4 = Good, 5 = Excellent

---

## Recommendation

### Recommended Option: {Name}

**Rationale**
{2-3 paragraphs explaining why this option best fits the goals, constraints, and priorities}

### Key Trade-Off
**What you gain**: {primary benefits}
**What you lose**: {primary costs/risks}

### Why Not {Other Options}
- {Option X}: {brief reason it wasn't recommended}
- {Option Y}: {brief reason it wasn't recommended}

---

## Implementation Considerations

### Suggested Approach
{How to implement the recommended option}

### Migration Path (if changing from current)
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Rollback Plan
{How to revert if needed}

### Testing Strategy
{How to validate the change}

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk 1} | {L/M/H} | {L/M/H} | {mitigation strategy} |
| {Risk 2} | {L/M/H} | {L/M/H} | {mitigation strategy} |

---

## Next Steps

Based on user selection at Checkpoint 9:

- [ ] {Next step 1}
- [ ] {Next step 2}
- [ ] {Next step 3}

---

## Appendix: Research Sources

### External Documentation
- {URL 1} - accessed {date}
- {URL 2} - accessed {date}

### Codebase References
- {file:line} - {what was examined}
- {file:line} - {what was examined}

---

**Analysis Complete**: {YYYY-MM-DD HH:MM} UTC
```

---

## Flags

```
--quick         Reduce checkpoints (goals + recommendation only)
--deep          More thorough research (additional sources)
--no-external   Skip external research (codebase only)
--compare-only  Don't recommend, just compare options
```

---

## Integration with /analyze

When `/analyze` triggers design escalation:

```
/analyze risk detects: "Retry logic scattered across 5 files"
         │
         ▼
User selects: "Yes, deep dive (/design skill)"
         │
         ▼
Claude outputs: "For comprehensive design analysis, run:
                /design tradeoff 'centralized retry strategy'

                This will:
                - Research retry patterns (middleware, decorator, library)
                - Assess impact on current codebase
                - Compare approaches with your priorities
                - Recommend best option with implementation plan"
         │
         ▼
User runs: /design tradeoff "centralized retry strategy"
         │
         ▼
Full interactive design workflow begins
```

---

## Examples

### Example 1: Data Format Decision

```
User: /design tradeoff "NDJSON vs CSV for batch exports"

Checkpoint 1 (Goal): "Improve reliability - current format has parsing issues"

Checkpoint 2 (Constraints): "Must work with existing GCS pipeline"

Checkpoint 3 (Priorities): Reliability > Simplicity > Performance > Cost > Time

Research:
- Current NDJSON implementation in batch_client.py
- Iterable API documentation (2026)
- "NDJSON vs CSV comparison 2026"
- "streaming JSON parsing Python 2026"

Options identified:
A. CSV with schema validation
B. NDJSON with per-record error handling
C. Parquet (binary, compressed)
D. Current NDJSON (baseline)

[Full analysis with trade-offs...]

Recommendation: Option B (NDJSON with per-record error handling)
- Keeps compatibility with existing pipeline
- Adds reliability without format change
- Lower implementation risk than format migration
```

### Example 2: Retry Architecture

```
User: /design tradeoff "centralized retry strategy"

Checkpoint 1 (Goal): "Reduce failures - seeing repeated timeouts"

Checkpoint 2 (Constraints): "Cannot change external API contracts"

Checkpoint 3 (Priorities): Reliability > Time > Simplicity > Performance > Cost

Research:
- Current retry patterns in codebase (5 different implementations)
- "httpx retry middleware 2026"
- "tenacity vs backoff library 2026"
- "circuit breaker pattern Python 2026"

Options identified:
A. HTTPTransport with built-in retries
B. Tenacity decorator on each method
C. Custom middleware class
D. Current scattered implementation

[Full analysis with impact assessment...]

Recommendation: Option A (HTTPTransport)
- Single point of configuration
- Built into httpx (no new dependency)
- Handles transport-level errors automatically
- 30-minute implementation
```

---

## Implementation Checklist

When implementing the /design skill:

- [ ] Create `.claude/skills/design/SKILL.md`
- [ ] Implement all 5 modes (tradeoff, pattern, migrate, validate, impact)
- [ ] Add all 9 checkpoints for tradeoff mode
- [ ] Implement research framework (codebase + external)
- [ ] Create impact assessment template
- [ ] Add report template
- [ ] Test with real design decisions
- [ ] Add to .gitignore (personal IP)
- [ ] Update DESIGN_ESCALATION.md with integration details

---

**Document Complete**: 2026-01-23
**Status**: Ready for implementation
**Estimated Implementation Effort**: 2-3 hours

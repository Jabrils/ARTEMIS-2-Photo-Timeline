---
name: design
description: "Interactive design analysis for architecture decisions. Combines codebase analysis, documentation review, and external research to provide evidence-based recommendations. Use for tradeoff analysis, pattern evaluation, migration planning, or design validation."
disable-model-invocation: false
argument-hint: "[mode] [topic]"
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch, Write
wrought:
  version: "1.0"
  tools:
    capabilities:
      - read_file
      - search_content
      - find_files
      - web_fetch
      - web_search
      - write_file
  platforms:
    claude-code:
      allowed-tools: "Read, Grep, Glob, WebFetch, WebSearch, Write"
      disable-model-invocation: false
  agent:
    role: "Design Analyst"
    expertise:
      - "architectural analysis"
      - "tradeoff evaluation"
      - "design patterns"
      - "external research"
    non_goals:
      - "writing production code"
      - "implementing designs"
  execution:
    default_mode: tot
    optional_modes:
      - react
      - self-refine
    max_iterations: 12
    max_refine: 2
    stop_conditions:
      - "Design analysis written to docs/design/"
      - "User approved recommendation"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/design/{YYYY-MM-DD_HHMM}_{topic}.md"
    required_sections:
      - "Executive Summary"
      - "Current State Analysis"
      - "Tradeoff Analysis"
      - "Recommendation"
      - "Impact Assessment"
      - "Sources"
  confidence:
    threshold: high
    low_confidence_behavior: "Present options without strong recommendation, flag uncertainty"
  context:
    max_tokens: 16000
    packing_order:
      - constraints
      - artifacts
      - evidence
      - checklist
    artifact_loading: on_demand
    handoff_trigger: 0.7
  pipeline:
    track: proactive
    standalone: false
    prerequisites: []
    produces:
      - "docs/design/*.md"
    suggested_next:
      - blueprint
---

# Design Skill

**Trigger**: `/design {mode} {topic}`

**Purpose**: Research-driven, interactive design analysis for architectural decisions. Combines codebase analysis, documentation review, external research (2026 sources), and impact assessment to provide evidence-based recommendations.

---

## Prerequisites

Before executing this skill, verify ALL of the following:
1. **Use Glob** to check for: `docs/findings/*_FINDINGS_TRACKER.md`
   - If NO match -> **STOP**: "Run /finding first to create a Findings Tracker."
   - If user says `--force`, proceed without validation.
2. **Read** the most recent Findings Tracker matching `*_FINDINGS_TRACKER.md`
   - Identify the relevant finding (ask user if ambiguous)

## Pre-flight Check

1. Verify artifact prerequisites (above)
2. Identify which finding/workflow this is for
3. Load finding report and related artifacts for context
4. Proceed to main skill instructions

---

## Modes

```
/design tradeoff {topic}     # Compare approaches (default, most common)
/design pattern {name}       # Explain pattern and assess applicability
/design migrate {from} {to}  # Plan migration between approaches
/design validate {proposal}  # Review a proposed design
/design impact {change}      # Assess impact of a specific change
```

---

## Design Principles

1. **Research-First**: Never recommend without understanding current state AND external best practices
2. **Current-Year Sources**: Always search for 2026 documentation, patterns, and practices
3. **Impact-Aware**: Every design decision includes concrete impact assessment
4. **Interactive**: User validates assumptions, priorities, and findings at checkpoints
5. **Evidence-Based**: Recommendations backed by code analysis AND external sources
6. **Actionable Output**: Ends with clear next steps, not just analysis

---

## Research Framework

See [research_framework.md](research_framework.md) for the 4-layer research process (Codebase → Documentation → External → Impact).

---

## Mode: Tradeoff Analysis (`/design tradeoff {topic}`)

The most common mode — comparing approaches for a design decision.

### Workflow

1. **CP1 — Understand Goal**: "What's the design goal for: {topic}?"
   → Improve reliability | Improve performance | Reduce complexity | Add new capability | Let me describe...

2. **CP2 — Constraints** [multi]: "What constraints should I consider?"
   → Must maintain backward compat | Cannot change external APIs | Limited time/resources | Must work with existing infra | No constraints | Let me specify...

3. **CP3 — Priorities**: "What matters most for this decision?"
   → Reliability > Performance > Simplicity > Cost > Time* | Performance > Reliability > Time > Simplicity > Cost | Simplicity > Time > Reliability > Performance > Cost | Time > Simplicity > Reliability > Performance > Cost | Let me specify...

**PHASE 1: Codebase Research** (Automatic)
- Read target component source, analyze dependencies, find related patterns, review related incidents/RCAs

4. **CP4 — Validate Current State**: "Here's my understanding of the current implementation:
   {Summary}
   Files involved: {list}
   Pattern used: {identified pattern}
   Known issues: {from RCAs}
   Is this accurate?"
   → Yes, correct | Mostly correct, minor clarification | Missing important context | Not quite right

**PHASE 2: External Research** (Automatic)
- WebSearch: "{topic} best practices 2026", "{library} {pattern} 2026", "{problem} solutions comparison 2026"
- WebFetch: Official documentation as needed

5. **CP5 — Validate Research Sources**: "I found these relevant sources:
   1. {source 1} — {what it covers}
   2. {source 2} — {what it covers}
   3. {source 3} — {what it covers}
   Any other sources I should check?"
   → These look good, proceed | Also check {specific source} | Focus more on {aspect} | Skip external research

**PHASE 3: Identify Options** (Automatic)
- Based on research, identify 3-5 viable approaches (always include current approach as baseline)

6. **CP6 — Validate Options**: "I've identified these approaches to evaluate:
   1. {Option A}: {brief description}
   2. {Option B}: {brief description}
   3. {Option C}: {brief description}
   4. Current approach (baseline)
   Should I evaluate all of these?"
   → Yes, evaluate all | Remove an option | Add another option | Just compare specific options

**PHASE 4: Deep Analysis** (Automatic)
- For each option: how it works, implementation approach, pros/cons, impact assessment, effort estimate, risk level

7. **CP7 — Validate Impact Assessment**: "Here's the impact assessment for {recommended option}:
   Files to change: {N} files (~{X} lines)
   Tests to update: {N} test files
   New dependencies: {list or 'none'}
   Breaking changes: {yes/no}
   Estimated effort: {X hours/days}
   Does this match your expectations?"
   → Yes, reasonable | Effort underestimated | Effort overestimated | Missing affected areas | Let me provide context

**PHASE 5: Scoring & Comparison** (Automatic)
- Score each option against user's priorities, calculate weighted totals, generate trade-off matrix

8. **CP8 — Review Recommendation**: "Based on your priorities, I recommend: {Option}
   Summary: ✓ {Primary benefit} ✓ {Secondary benefit} ✗ {Main trade-off}
   Key trade-off: {what you gain} vs {what you lose}
   Do you want to proceed with this recommendation?"
   → Yes, create the design document | I prefer a different option | Need more analysis on specific aspect | Just save the analysis

**PHASE 6: Generate Report** (Automatic)
Write to: `docs/design/{YYYY-MM-DD_HHMM}_{topic_slug}.md`

9. **CP9 — Next Steps**: "Design analysis complete: {filename}. What would you like to do next?"
   → Create implementation plan (EnterPlanMode) | Start implementing now | Share with team first | Save for later

**STOP** and await user decision.

---

## Mode: Pattern Analysis (`/design pattern {name}`)

Explain a design pattern and assess its applicability.

### Workflow

1. **CP1 — Context**: "What's the context for exploring the {pattern} pattern?"
   → Considering adoption | Debugging existing implementation | Comparing with alternatives | Educational

**PHASE 1: Research** (Automatic)
- WebSearch: "{pattern} implementation 2026", "{pattern} pros cons 2026", "{pattern} {language} example 2026"
- Scan codebase for existing pattern usage

2. **CP2 — Variation Selection**: "I found these variations of {pattern}:
   1. {Variation A}: {brief description}
   2. {Variation B}: {brief description}
   3. {Variation C}: {brief description}
   Which interests you most?"
   → {Variation A} | {Variation B} | Compare all variations | General overview

**PHASE 2: Analysis** (Automatic)
- Pattern explanation (what, why, when), applicability to codebase, where it could be applied, pros/cons

3. **CP3 — Validate Applicability**: "Based on analysis, {pattern} would fit well in:
   - {Location 1}: {why}
   - {Location 2}: {why}
   And would NOT fit well in:
   - {Location 3}: {why not}
   Does this match your intuition?"
   → Yes, helpful | Surprised about {location} | What about {other location}? | Different use case

**PHASE 3: Generate Report** (Automatic)
Write to: `docs/design/{YYYY-MM-DD_HHMM}_pattern_{name}.md`

**STOP** and await instructions.

---

## Mode: Migration Planning (`/design migrate {from} {to}`)

Plan migration from one approach to another.

### Workflow

1. **CP1 — Migration Reason**: "Why are you migrating from {from} to {to}?"
   → Performance issues | Maintainability concerns | Deprecation | New requirements can't meet | Let me explain...

2. **CP2 — Constraints** [multi]: "What constraints affect this migration?"
   → Must maintain backward compat | Cannot have downtime | Must be reversible | Limited time window | No constraints | Let me specify...

3. **CP3 — Migration Strategy**: "What migration strategy do you prefer?"
   → Big bang (all at once) | Strangler fig (gradual) | Parallel run (both systems) | Let me understand options first

**PHASE 1: Current State Analysis** (Automatic)
- Deep dive into current implementation, map all usages and dependencies, identify migration complexity

**PHASE 2: Target State Research** (Automatic)
- Research target approach (2026 sources), find migration guides, look for similar case studies

4. **CP4 — Validate Understanding**: "Migration scope:
   Current ({from}): {N} files, {N} call sites, key complexity: {desc}
   Target ({to}): {approach description}, key benefit: {desc}
   Is this accurate?"
   → Yes, proceed | Current scope is different | Target needs correction | Add more context

**PHASE 3: Migration Plan** (Automatic)
- Step-by-step plan, risk assessment, rollback points, testing strategy, timeline estimate

5. **CP5 — Review Plan**: "Migration plan summary:
   Phase 1: {desc} ({effort}), Phase 2: {desc} ({effort}), Phase 3: {desc} ({effort})
   Total effort: {estimate}, Risk level: {assessment}
   Does this look feasible?"
   → Yes, create detailed plan | Timeline too aggressive | Missing a phase | Risk too high

**PHASE 4: Generate Report** (Automatic)
Write to: `docs/design/{YYYY-MM-DD_HHMM}_migrate_{from}_to_{to}.md`

**STOP** and await instructions.

---

## Mode: Design Validation (`/design validate {proposal}`)

Review a proposed design before implementation.

### Workflow

1. **CP1 — Receive Proposal**: "How should I receive the design proposal?"
   → Read from file (provide path) | I'll paste it here | Described in conversation above | Reference a PR or issue

2. **CP2 — Review Focus** [multi]: "What aspects should I focus on?"
   → Completeness | Feasibility | Risk assessment | Alignment with architecture | All of the above*

**PHASE 1: Proposal Analysis** (Automatic)
- Parse proposal, compare to codebase reality, identify gaps/conflicts, research alternatives for weak points

3. **CP3 — Clarify Ambiguities**: "I have questions about the proposal:
   1. {Ambiguity 1}
   2. {Ambiguity 2}
   Can you clarify?"
   → Let me explain... | Skip — not critical | Proposal should cover this

**PHASE 2: Validation** (Automatic)
- Assess each aspect, score the proposal, identify improvements

4. **CP4 — Review Findings**: "Validation summary:
   ✓ {Strength 1} ✓ {Strength 2} ⚠ {Concern 1} ✗ {Gap 1}
   Overall: {Ready to implement | Needs revision | Major concerns}
   How should I proceed?"
   → Create detailed review document | Focus on addressing concerns | Looks good — summarize | Compare with alternative

**PHASE 3: Generate Report** (Automatic)
Write to: `docs/design/{YYYY-MM-DD_HHMM}_review_{proposal_name}.md`

**STOP** and await instructions.

---

## Mode: Impact Analysis (`/design impact {change}`)

Assess impact of a specific change before making it.

### Workflow

1. **CP1 — Describe Change**: "Describe the change you're considering:"
   → Point to specific code/file | Describe in natural language | Reference a ticket/issue | In the conversation above

2. **CP2 — Change Scope**: "What type of change is this?"
   → Interface change (signatures, contracts) | Implementation change (internal only) | Dependency change (add/remove/update) | Configuration change | Let me describe...

**PHASE 1: Impact Discovery** (Automatic)
- Find all usages of affected code (Grep), map dependencies, identify affected tests, check configurations

3. **CP3 — Validate Scope**: "Here's what I found would be affected:
   Code: {file 1}: {how affected}, {file 2}: {how affected}
   Tests: {test file 1}, {test file 2}
   Config: {config if any}
   Anything I'm missing?"
   → No, this covers it | Also affects {area} | {File} isn't affected | Need to check {area}

**PHASE 2: Risk Assessment** (Automatic)
- Full impact assessment using framework, risk scoring, mitigation suggestions

4. **CP4 — Review Assessment**: "Impact assessment:
   Effort: {estimate}, Risk: {Low/Medium/High}, Breaking changes: {yes/no}
   Top risk: {description}, Mitigation: {suggestion}
   Does this help with your decision?"
   → Yes, proceed with change | Yes, but mitigate risks first | Risk too high — reconsider | Need more detail on {aspect}

**PHASE 3: Generate Report** (Automatic)
Write to: `docs/design/{YYYY-MM-DD_HHMM}_impact_{change_slug}.md`

**STOP** and await instructions.

---

## Report Template

See [report_template.md](report_template.md) for the full design analysis report template.

---

## Flags

```
--quick         Reduce to 3 checkpoints (goal, options, recommendation)
--deep          More thorough research (5+ external sources)
--no-external   Skip external research (codebase only)
--compare-only  Don't recommend, just compare options
```

---

## Findings Tracker Update Protocol

See [tracker_update_checklist.md](../_shared/tracker_update_checklist.md)
- Stage: "Designing"
- Task: FN.1 (Design approach)
- GitHub field: `32f197e1`

---

## After Design Analysis

**ALWAYS STOP** after generating the report.

Output format:
```
Design analysis complete: docs/design/{filename}.md

Mode: {mode}
Interactive checkpoints: {N}
Research sources: {N} internal, {N} external

Recommendation: {one-line summary}
Key trade-off: {what you gain} vs {what you lose}

Estimated effort: {if applicable}
Risk level: {if applicable}
```

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer to implement. Do NOT offer to skip `/blueprint`. Do NOT offer alternatives to the pipeline sequence.

Next step: Run `/blueprint` with the design at `docs/design/{filename}.md` to create an implementation spec and prompt.

**STOP** — do NOT proceed with implementation. Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Await user instructions.

---

## Integration

### From /analyze
When `/analyze` escalates with "deep dive" option:
```
User runs: /design tradeoff "{topic from escalation}"
```

### To Implementation
When user selects "Create implementation plan":
```
Use EnterPlanMode to create detailed implementation plan
```

---

## Examples

```
/design tradeoff "retry strategy for API calls"
→ Full interactive comparison of retry approaches

/design pattern "circuit breaker"
→ Pattern explanation + applicability assessment

/design migrate "scattered retries" "centralized middleware"
→ Migration plan with phases and rollback points

/design validate "the proposed caching layer"
→ Review of design proposal with gaps identified

/design impact "changing batch_client timeout from 30s to 60s"
→ Impact assessment of specific change
```

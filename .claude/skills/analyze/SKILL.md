---
name: analyze
description: "Strategic system analysis for health assessment, pattern recognition, component deep dives, risk assessment, and architecture review. Use for proactive system understanding beyond reactive incident response."
disable-model-invocation: false
argument-hint: "[mode] [target]"
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
    role: "Systems Analyst"
    expertise:
      - "system health assessment"
      - "pattern recognition"
      - "risk prioritization"
      - "architecture review"
    non_goals:
      - "implementing fixes"
      - "incident response"
      - "code changes"
  execution:
    default_mode: tot
    optional_modes:
      - react
    max_iterations: 15
    max_refine: 2
    stop_conditions:
      - "Analysis written to docs/analysis/"
      - "User approved analysis scope and findings"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/analysis/{YYYY-MM-DD_HHMM}_{scope}.md"
    required_sections:
      - "Executive Summary"
      - "Scope"
      - "Findings"
      - "Risk Assessment"
      - "Recommendations"
  confidence:
    threshold: high
    low_confidence_behavior: "Flag areas needing deeper investigation"
  context:
    max_tokens: 16000
    artifact_loading: on_demand
    handoff_trigger: 0.7
  pipeline:
    track: audit
    standalone: true
    prerequisites: []
    produces:
      - "docs/analysis/*.md"
    suggested_next:
      - finding
      - investigate
      - design
---

# Systems Analyst Skill

**Trigger**: `/analyze {mode} [scope]`

**Purpose**: Strategic-level system analysis that goes beyond reactive incident response to provide **proactive system health assessment, pattern recognition across incidents, architectural insight, and risk prioritization**.

---

## Pre-flight Check

This skill is **standalone** — it can be invoked at any time without prerequisites.

If this invocation is part of an active workflow, check `docs/findings/*_FINDINGS_TRACKER.md`
for a relevant tracker and note it for context, but do not enforce stage requirements.

---

## Modes

```
/analyze health                    # Full system health assessment
/analyze patterns [time-period]    # Pattern recognition (default: last-7-days)
/analyze component [scope]         # Deep dive on specific component
/analyze risk [scope]              # Risk assessment with prioritization
/analyze architecture              # Architectural review + doc sync
/analyze discover                  # Build/refresh System Map only
```

---

## Design Principles

1. **Discovery-Based Scoping**: No hard-coded component names. The skill discovers what exists.
2. **Fully Interactive**: ALL modes use AskUserQuestion at key decision points.
3. **Artifact-Driven**: System Map persists across analyses.
4. **No File Edits Without Confirmation**: Architecture mode previews changes before applying.
5. **Escalation**: When findings suggest redesign or corrective fix, offer to explore alternatives.

---

## Step 0: Load or Create System Map

See [system_map_template.md](system_map_template.md) for the system map template and discovery process.

If system map exists at `docs/analysis/system-map.md` and is <24h old, load it. Otherwise, follow the template to create one.

---

## Mode: Discover (`/analyze discover`)

**Purpose**: Build or refresh the System Map without full analysis.

### Workflow

1. **CP1 — Scope Confirmation** [multi]: "I'll scan the project to build a System Map. What should I include?"
   → Backend services* | API layer | Data models | Frontend components | Configuration files | All of the above

2. **CP2 — Exclusions**: "Any directories or patterns to exclude from scanning?"
   → No exclusions (scan everything)* | Exclude tests/ | Exclude vendor/node_modules | Let me specify...

3. **Run Discovery** (as specified in system map template)

4. **CP3 — Validation**: "I found {N} components. Quick review:
   {summary table}
   Does this look correct?"
   → Yes, save the System Map | Remove some components | Add missing components | Rescan with different options

5. **Save System Map** to `docs/analysis/system-map.md`

6. **STOP** and present summary. Await instructions.

---

## Mode: System Health (`/analyze health`)

**Purpose**: Overall system reliability assessment.

### Workflow

1. **Load System Map** (create if missing)

2. **CP1 — Focus Areas** [multi]: "What aspects of system health matter most right now?"
   → Reliability* | Performance | Maintainability | Observability | All dimensions equally

3. **CP2 — Known Context**: "Any known issues or recent changes I should account for?"
   → No, analyze with fresh eyes* | Yes, known issues (let me describe) | Recent deployment may affect results | In incident recovery mode

4. **Collect Data**: Read all `docs/RCAs/*.md`, `docs/incidents/*.md`, `docs/investigations/*.md`, `docs/findings/*.md`. Search logs for error patterns (last 7 days).

5. **Analyze**: Count incidents by component, calculate frequency trends, identify recurring failure modes, assess monitoring coverage.

6. **Score Each Dimension** (0-10): Reliability, Performance, Maintainability, Observability.

7. **CP3 — Validate Scores**: "Here are the preliminary scores:
   | Dimension | Score | Notes |
   |-----------|-------|-------|
   | Reliability | X/10 | {note} |
   | Performance | X/10 | {note} |
   | Maintainability | X/10 | {note} |
   | Observability | X/10 | {note} |
   Do these match your experience?"
   → Yes, accurate | Reliability seems off | Performance seems off | Maintainability seems off | Observability seems off | Let me provide context

8. **Escalation Check** (see Escalation section below)

9. **Generate Report**: Write to `docs/analysis/{YYYY-MM-DD_HHMM}_health.md`

10. **STOP** and present summary. Await instructions.

---

## Mode: Pattern Recognition (`/analyze patterns [time-period]`)

**Purpose**: Identify recurring issues across incidents.

### Workflow

1. **CP1 — Time Period**: "What time period should I analyze for patterns?"
   → Last 7 days* | Last 30 days | Last 90 days | Since last deploy | Custom range

2. **CP2 — Pattern Focus** [multi]: "What types of patterns are you most interested in?"
   → Temporal patterns (time-of-day clustering)* | Causal patterns (same root cause recurring) | Structural patterns (same components failing together) | Cascade patterns (A→B→C failures) | All pattern types

3. **Collect Data**: All RCAs and incidents in time range, error logs.

4. **Pattern Types to Look For**: Temporal, Causal, Structural, Cascade.

5. **CP3 — Validate Top Patterns** (for each significant pattern, top 3):
   "Pattern Found: {description}
   Occurrences: {N} times in {period}, Components: {list}
   Is this pattern..."
   → New insight — investigate further | Known — being addressed | Known — accepted/deprioritized | False positive

6. **Escalation Check** (see Escalation section below)

7. **Generate Report**: Write to `docs/analysis/{YYYY-MM-DD_HHMM}_patterns.md`

8. **STOP** and present findings. Await instructions.

---

## Mode: Component Deep Dive (`/analyze component [scope]`)

**Purpose**: Focused analysis on a specific component.

### Workflow

1. **Scope Resolution**: If no scope provided, present discovered components from System Map.

2. **CP1 — Component Selection**: "Which component would you like to analyze?"
   → {Component 1 from System Map} | {Component 2} | {Component 3} | Let me specify by path or description

3. **CP2 — Analysis Depth**: "How deep should the analysis go?"
   → Quick overview (dependencies, recent incidents)* | Standard (+ code patterns, error handling) | Deep dive (+ test coverage, all historical incidents)

4. **CP3 — Context**: "Any specific concerns about this component?"
   → No specific concerns* | Recent failures — focus on reliability | Performance issues | Planning changes — assess impact | Let me describe...

5. **Analyze Component**: Read all source files, map dependencies, find related incidents/RCAs/findings, identify error handling patterns, assess test coverage (if requested).

6. **Escalation Check** (see Escalation section below)

7. **Generate Report**: Write to `docs/analysis/{YYYY-MM-DD_HHMM}_component_{name}.md`

8. **STOP** and present findings. Await instructions.

---

## Mode: Risk Assessment (`/analyze risk [scope]`)

**Purpose**: Prioritized risk matrix with likelihood and impact scoring.

### Workflow

1. **CP1 — Scope**: "What scope should I assess for risks?"
   → All components (comprehensive) | External integrations only* | Data pipeline only | Recently changed components | Let me specify...

2. **CP2 — Risk Tolerance**: "What's your risk tolerance for this assessment?"
   → Conservative — flag everything suspicious* | Moderate — likely issues only | Aggressive — critical risks only

3. **CP3 — Business Context**: "Any business context that affects risk prioritization?"
   → No special context* | Preparing for high-traffic event | In stabilization period | Aggressive timeline | Let me describe...

4. **Identify Risks**: Single points of failure, missing error handling, no retry logic, hardcoded timeouts, missing monitoring, stale dependencies.

5. **Score Each Risk**: Likelihood (1-5) x Impact (1-5). 1-5: Low, 6-12: Medium, 13-19: High, 20-25: Critical.

6. **CP4 — Validate HIGH/CRITICAL** (for each high or critical risk):
   "Risk: {description}, Score: {X} ({severity}). Is this..."
   → New finding — needs attention | Known — actively being fixed | Known — accepted risk | Not a real risk

7. **Escalation Check** (see Escalation section below)

8. **Generate Report**: Write to `docs/analysis/{YYYY-MM-DD_HHMM}_risk.md`

9. **STOP** and present findings. Await instructions.

---

## Mode: Architecture Review (`/analyze architecture`)

**Purpose**: Review architecture, identify discrepancies between docs and code.

**WARNING**: This mode may modify ARCHITECTURE.md. Interactive confirmation REQUIRED.

### Workflow

1. **CP1 — Scope**: "What should the architecture review focus on?"
   → Full system architecture* | Backend services only | Data flow and pipelines | API design | Let me specify...

2. **CP2 — Documentation Intent**: "How should I handle discrepancies between docs and code?"
   → Assume code is truth, docs are outdated* | Assume docs are truth, code has drifted | Ask me for each discrepancy | Just report discrepancies

3. **Discover Actual Architecture**: Scan codebase for services, APIs, models. Build dependency graph. Identify patterns.

4. **Compare to Documentation**: Read ARCHITECTURE.md. Identify discrepancies (components in code but not docs, in docs but not code, incorrect relationships, outdated descriptions).

5. **CP3 — Per-Discrepancy** (if "ask me" selected):
   "Discrepancy: Doc says '{X}', code shows '{Y}'"
   → Update ARCHITECTURE.md (doc outdated) | Flag as tech debt (code should change) | Ignore (intentional)

6. **CP4 — Confirm Changes** (REQUIRED before any file edits):
   "I will make these changes to ARCHITECTURE.md:
   {diff preview}
   Apply changes?"
   → Yes, apply all | Let me review individually | No, cancel (just output report)

7. **Escalation Check** (see Escalation section below)

8. **Generate Report**: Write to `docs/analysis/{YYYY-MM-DD_HHMM}_architecture.md`

9. **Apply Changes** (only if confirmed in CP4)

10. **STOP** and present findings. Await instructions.

---

## Escalation

When any mode detects a finding that suggests **architectural redesign** or a **corrective fix**, trigger an escalation checkpoint.

### Design Triggers
- Same logic duplicated in 3+ files
- Technology choice conflicts with requirements
- Approach won't scale to 10x
- Same component in 3+ incidents
- High coupling hotspot

### Fix Triggers
- Known bug found by analysis
- Security vulnerability with known exposure
- Configuration drift from intended state
- Deprecated dependency with known CVE or EOL
- Missing validation at a trust boundary

### Escalation Checkpoint
"Finding: {description}. This suggests a design consideration or corrective fix. How would you like to proceed?"
→ Explore design inline (quick trade-off) | Design deep dive (recommend /design) | Corrective fix (recommend /finding then /rca-bugfix) | Note it in the report | Accepted limitation

See `DESIGN_ESCALATION.md` for full design escalation specification.

---

## Report Template (All Modes)

See [report_template.md](report_template.md) for the full analysis report template.

---

## Flags

```
--batch         Skip interactive checkpoints (use defaults)
                NOT allowed for architecture mode
--dry-run       Show findings without creating reports
--refresh       Force refresh System Map before analysis
--verbose       Show all findings, not just significant ones
```

**Note**: `--batch` is NOT allowed for architecture mode (file edits require confirmation).

---

## After Analysis

**ALWAYS STOP** after generating the report.

Output format:
```
Analysis complete: docs/analysis/{filename}.md

Interactive decisions: {N} checkpoints
User context applied: {summary of user inputs}

Key Finding: {One-line summary of most important finding}

{Mode-specific metrics}
Health Score: {X}/10 (if health mode)
Risks Found: {N} critical, {N} high (if risk mode)
Patterns Found: {N} recurring issues (if patterns mode)

Design Considerations: {N} design escalation opportunities identified
Fix Escalations: {N} corrective fix opportunities identified

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline step below. Do NOT offer to implement. Do NOT offer to skip `/finding`. Do NOT offer alternatives to the pipeline sequence.

Next step: Run `/finding` with the analysis at `docs/analysis/{filename}.md` to create a Findings Tracker for any discoveries.

Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Awaiting your instructions. Do NOT proceed with fixes or implementations.
```

---

## Integration with Other Skills

| After Analysis... | Consider... |
|-------------------|-------------|
| Found specific incident pattern | `/investigate {pattern}` |
| Identified root cause | `/rca-bugfix {cause}` |
| Design escalation selected "deep dive" | `/design tradeoff {topic}` |
| Fix escalation selected "corrective fix" | `/finding {description}` |
| Need implementation plan | Use EnterPlanMode |
| Need ongoing monitoring | `/watchdog {component}` |

---

## Example Usage

```
/analyze discover             → Interactive: confirms scope, exclusions, validates findings
/analyze health               → Interactive: focus areas, known context, validates scores
/analyze patterns             → Interactive: time period, pattern types, validates top patterns
/analyze patterns last-30-days → Skips time period question, still asks pattern types
/analyze component            → Interactive: component selection, depth, concerns
/analyze component "the batch client" → Skips selection, still asks depth and concerns
/analyze risk                 → Interactive: scope, tolerance, business context, validates findings
/analyze architecture         → Interactive: focus, discrepancy handling, change confirmation
/analyze health --batch       → Uses defaults for all checkpoints, still generates report
```

# Design Research Framework

4-layer research process used by all design modes.

---

## Layer 1: Codebase Analysis

Before any design work, understand the current state:

1. **Target Component(s)**
   - Read all source files (use Read tool)
   - Count lines, functions, classes
   - Identify patterns in use
   - Map error handling approach

2. **Dependencies (Inward)**
   - What does this component import?
   - External libraries used
   - Internal modules depended on

3. **Dependencies (Outward)**
   - What imports this component? (use Grep)
   - How many callers?
   - What would break if interface changes?

4. **Related Code**
   - Similar patterns elsewhere in codebase
   - Previous attempts at solving this problem
   - Comments indicating tech debt or TODOs

## Layer 2: Documentation Analysis

Read internal docs for context:

Priority order:
1. CLAUDE.md — Project context, decisions
2. ARCHITECTURE.md — System design
3. README.md — User manual
4. docs/RCAs/*.md — Past failures
5. docs/incidents/*.md — Related incidents
6. docs/plans/*.md — Previous design decisions
7. docs/research/*.md — Prior research

## Layer 3: External Research (2026 Sources)

**CRITICAL**: Always include current year (2026) in searches.

Use WebSearch for:
- "{topic} best practices 2026"
- "{library} {pattern} 2026"
- "{problem} solutions comparison 2026"
- "how {company} handles {problem} 2026"

Use WebFetch for:
- Official API documentation
- Library documentation
- Relevant blog posts/case studies

## Layer 4: Impact Assessment

For every design option, assess:

1. **CODE CHANGES** — Files to modify (with estimates), files to create/delete, interfaces changing
2. **TEST CHANGES** — Tests to update, new tests needed, test infrastructure changes
3. **CONFIGURATION** — Environment variables, config files, feature flags
4. **DEPLOYMENT** — Database migrations, breaking changes, rollback complexity, downtime
5. **OPERATIONAL** — Monitoring changes, logging changes, runbook updates
6. **DEPENDENCIES** — New/updated/removed dependencies
7. **RISKS** — What could go wrong, blast radius, detection strategy, recovery plan

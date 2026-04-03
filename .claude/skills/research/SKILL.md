---
name: research
description: "Research a technical topic and document findings. Use when you need to research a technical topic, error, or concept and create a documented record."
context: fork
agent: general-purpose
disable-model-invocation: false
argument-hint: "[topic or question]"
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
    role: "Technical Researcher"
    expertise:
      - "technical documentation"
      - "community knowledge synthesis"
    non_goals:
      - "code implementation"
      - "direct code changes"
  execution:
    default_mode: react
    max_iterations: 10
    stop_conditions:
      - "Research report written to docs/research/"
      - "User instructed to stop"
  output:
    format: markdown
    template: "docs/research/{YYYY-MM-DD_HHMM}_{topic}.md"
    required_sections:
      - "Question"
      - "TL;DR"
      - "Official Documentation"
      - "Community Knowledge"
      - "Best Practices"
      - "Sources"
    prohibited_content:
      - "credentials"
      - "secrets"
      - "PII"
  confidence:
    threshold: medium
    low_confidence_behavior: "Flag gaps and suggest follow-up research"
  pipeline:
    track: proactive
    standalone: true
    prerequisites: []
    produces:
      - "docs/research/*.md"
    suggested_next:
      - investigate
      - design
      - blueprint
---

# Research Skill

**Trigger**: Use `/research {question or topic}` when you need to research a technical topic, error, or concept and create a documented record.

**Purpose**: Research topics thoroughly, document findings with sources, and build a knowledge base to avoid repeating the same issues.

**Examples**:

- `/research Why does Iterable batch export return 400 after job expires?`
- `/research What are httpx timeout best practices for long-running downloads?`
- `/research How does GCS resumable upload handle network interruptions?`
- `/research [pasted error message or documentation]`

---

## Pre-flight Check

This skill is **standalone** — it can be invoked at any time without prerequisites.

If this invocation is part of an active workflow, check `docs/findings/*_FINDINGS_TRACKER.md`
for a relevant tracker and note it for context, but do not enforce stage requirements.

---

## Instructions

1. **Identify the technologies/topics** involved in the question
2. **Research official documentation** (search as of {current_month_year})
3. **Research online** for community knowledge, Stack Overflow, GitHub issues (search as of {current_month_year})
4. **Check existing research** in `docs/research/` and `docs/RCAs/` to avoid duplicating work
5. **Write research report** to `docs/research/{YYYY-MM-DD_HHMM}_{topic}.md`
6. **STOP** and await further instructions

---

## Research Process

### Step 1: Identify What to Research

Parse the user's question or pasted text to identify:

- Which technologies/API/library are involved?
- What specific behavior, enhancement or error needs explanation?
- What is the user trying to understand?
- What is the user trying to implement?

### Step 2: Search Official Documentation

**Search as of {current_month_year}** for the relevant technology:

**EXAMPLES** (use as patterns, search for whatever is relevant):

- If about **Iterable**: Search "Iterable API {topic} {current_month_year}"
- If about **Intercom**: Search "Intercom API {topic} {current_month_year}"
- If about **GCS**: Search "Google Cloud Storage {topic} {current_month_year}"
- If about **httpx**: Search "Python httpx {topic} {current_month_year}"
- If about **FastAPI**: Search "FastAPI {topic} {current_month_year}"
- If about **PostgreSQL**: Search "PostgreSQL {topic} {current_month_year}"
- If about **Python**: Search "Python {topic} {current_month_year}"

**IMPORTANT**: Only search documentation relevant to the actual question. Identify the technology first, then search.

### Step 3: Search Online Resources

Search for:

- Stack Overflow questions/answers
- GitHub issues and discussions
- Blog posts from reputable sources
- Official changelogs or release notes

### Step 4: Check Existing Knowledge

Before writing, check:

- `docs/research/` - Have we researched this before?
- `docs/RCAs/` - Have we encountered this issue before?
- `docs/investigations/` - Any related investigations?
- `docs/findings/` - Any proactive findings related to this topic?
- `docs/plans/` - Any implementation plans that addressed this?

If existing research exists, reference it and add new findings.

### Step 5: Synthesize Findings

Combine all sources into a coherent answer:

- What does the official documentation say?
- What does the community say?
- Are there any gotchas or undocumented behaviors?
- What are the best practices?

---

## Research Report Template

See [report_template.md](report_template.md) for the full research report template.

Write to: `docs/research/{YYYY-MM-DD_HHMM}_{topic}.md`

---

## After Writing

**STOP** and tell the user:

```
Research complete.

Report saved to: docs/research/{YYYY-MM-DD_HHMM}_{topic}.md

Summary: {2-3 sentence TL;DR}

Key sources:
- {Source 1 with link}
- {Source 2 with link}

**CRITICAL PIPELINE RULE**: Suggest ONLY the next pipeline steps below. Do NOT offer `/plan` directly — that comes after `/design` and `/blueprint`.

Recommended next steps:
- Run `/finding` with the research at `docs/research/{filename}.md` if discoveries need tracking
- Run `/design` with the research at `docs/research/{filename}.md` if this informs an architecture decision
- Run `/investigate` with the research at `docs/research/{filename}.md` if this relates to an active incident

Awaiting your instructions.
```

**Do NOT continue.** Do NOT add commentary suggesting any pipeline step could be skipped or is unnecessary. Wait for the user to decide how to proceed.

# Context Check Protocol

Shared two-step context management protocol for skills that produce artifacts and then enter /plan mode.

**Parameters** (provided by the referencing SKILL.md):
- `{TASK_TYPE}` — What this skill produces (e.g., "Blueprint", "RCA")
- `{OUTPUT_DIR}` — Where the primary artifact is written (e.g., "docs/blueprints/", "docs/RCAs/")
- `{ENTITY_NAME}` — What is being processed (e.g., "feature", "issue")
- `{EXAMPLE_PATH}` — Example output path (e.g., "docs/blueprints/2026-01-27_1200_csv_migration.md")

---

## Step 1: Initial Context Check

Ask the user to run `/context` and share the output.

Based on the context usage:

### If context > 80% (not enough room):
1. Perform an expert-level {TASK_TYPE} of the {ENTITY_NAME}
2. Write the {TASK_TYPE} to `{OUTPUT_DIR}{YYYY-MM-DD_HHMM}_{name}.md`
3. Tell the user: "Context is high. {TASK_TYPE} saved. Please run `/session-end` and start a new session."
4. **STOP** - Do not proceed further

### If context <= 80% (enough room):
1. Perform an expert-level {TASK_TYPE} of the {ENTITY_NAME}
2. Write the {TASK_TYPE} to `{OUTPUT_DIR}{YYYY-MM-DD_HHMM}_{name}.md`
3. Using the {TASK_TYPE}, write an expert-level prompt for `/plan` mode
4. Write the prompt to `docs/prompts/{YYYY-MM-DD_HHMM}_{name}.md`
5. Proceed to Step 2

## Step 2: Pre-Planning Context Check

Ask the user to run `/context` again and share the output.

### If context > 85% (not enough room for planning):
1. Tell the user: "Context too high for planning. Please run `/session-end` and start a new session."
2. Tell the user: "In the next session, run `/plan` with the prompt saved at `docs/prompts/{YYYY-MM-DD_HHMM}_{name}.md`"
3. **STOP**

### If context <= 85% (enough room):
1. Tell the user: "Ready for planning. Please run `/plan`"
2. When in plan mode, use the expert-level prompt you wrote to guide the implementation plan

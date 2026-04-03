# Findings Tracker Update Checklist

Shared protocol for downstream skills that update Findings Trackers.

**Parameters** (provided by the referencing SKILL.md):
- `{STAGE_NAME}` — The lifecycle stage this skill sets (e.g., "Designing", "Investigating", "Blueprint Ready", "RCA Complete")
- `{TASK_DESCRIPTION}` — The resolution task text (e.g., "FN.1: Design approach", "FN.2: RCA + fix design")
- `{GITHUB_LIFECYCLE_FIELD_ID}` — The GitHub Projects field ID for this stage
- `{ARTIFACT_TYPE}` — What this skill produces (e.g., "Design analysis", "Investigation", "Blueprint + Prompt", "RCA + Prompt")
- `{ARTIFACT_PATH_PATTERN}` — The output path pattern (e.g., "{report_path}", "{blueprint_path} + {prompt_path}")

---

## At the START of work

Check if this work relates to a tracked finding:

1. If input contains `F{N}` (e.g., "F1", "F3"), search `docs/findings/*_FINDINGS_TRACKER.md` for that finding
2. If input is topic-based, search active trackers for a matching finding title
3. If a match is found:
   a. Read the tracker and any linked artifacts (finding report, investigation, design analysis)
   b. Use these as context for the current work

## At the END of work

After writing the output artifact(s):

1. Update the tracker's overview table: set `Stage` to `{STAGE_NAME}`, set `Status` to `In Progress`
2. Update the per-finding **Lifecycle** table — append row:
   ```
   | {STAGE_NAME} | {YYYY-MM-DD HH:MM} UTC | {session} | [{ARTIFACT_TYPE}]({ARTIFACT_PATH_PATTERN}) |
   ```
3. Check the resolution task: `[x] **{TASK_DESCRIPTION}**...`
4. Add changelog entry:
   ```
   | {YYYY-MM-DD HH:MM} UTC | {session} | FN stage -> {STAGE_NAME}. {ARTIFACT_TYPE}: {ARTIFACT_PATH_PATTERN} |
   ```
5. Update `Last Updated` timestamp at top of tracker
6. Sync to GitHub Projects (NON-FATAL) — read `docs/reference/github_projects_sync_protocol.md`, follow Protocol B: Lifecycle Stage = {STAGE_NAME} (`{GITHUB_LIFECYCLE_FIELD_ID}`), Status = In Progress (`47fc9ee4`), Evidence = artifact path(s). If `**Project Item ID**:` is missing or `—`, skip sync with a note.

## HANDOFF UPDATE

After the standard handoff message to the user, add:

```
Tracker updated: {tracker_path} — FN stage -> {STAGE_NAME}

After /plan completes, update the tracker:
- Stage -> Planned
- Lifecycle row: `| Planned | {timestamp} | {session} | [Plan]({plan_path}) |`
- Check task: `[x] **FN.3**: Implementation plan...`
- Changelog: `FN stage -> Planned. Plan: {plan_path}`
- GitHub sync (NON-FATAL): Protocol B — Lifecycle Stage = Planned (`a66cfac9`), Status = In Progress (`47fc9ee4`)
```

This ensures the tracker gets updated after /plan (which is EnterPlanMode and can't be modified directly).

---

If no matching finding exists, proceed normally — not all work originates from findings.

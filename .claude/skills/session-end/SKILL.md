---
name: session-end
description: "End session and create all handoff documentation"
disable-model-invocation: false
wrought:
  version: "1.0"
  platforms:
    claude-code:
      disable-model-invocation: false
---

Session is ending. Please complete all session end tasks:

1. **Save active plan file (if exists):**

   - Check `~/.claude/plans/` for recent plan files (modified today)
   - If found, copy to `~/docs/plans/PLAN_{datetime}_{original_name}.md`
   - This preserves implementation plans between sessions
2. **Create new handoff document:**

   - Get current date/time: `date '+%Y-%m-%d_%H%M'`
   - Create file: `NEXT_SESSION_PROMPT_{datetime}.md`
   - Include updated "START HERE" section
   - Update status: what was completed this session
   - Update priorities: what's next
   - Include any new insights or decisions
   - **Reference any active plan file** (from step 1)
3. **Create session summary:**

   - Create file: `SESSION_SUMMARY_{datetime}.md`
   - Document what was accomplished
   - List issues encountered
   - Record decisions made
   - Include metrics and statistics
   - Reference plan file if applicable
4. **Update CLAUDE.md:**

   - Edit line 24 to change `@NEXT_SESSION_PROMPT_*.md`
   - Point to the NEW handoff file you just created
   - Update "Last Updated" timestamp at bottom
   - Update "Last Session" description
5. **Archive old handoff:**

   - Move old `NEXT_SESSION_PROMPT_*.md` to `docs/archive/sessions/`
   - Keep only the NEW handoff in root directory
6. **Update Findings Trackers (if applicable):**

   - Each group of related findings has its own named tracker: `docs/findings/{datetime}_{name}_FINDINGS_TRACKER.md`
   - Check ALL `docs/findings/*_FINDINGS_TRACKER.md` files for trackers related to this session's work
   - For each tracker that had findings-related work done this session (fixes, investigations, designs, or verification of FN tasks):
     - Update the checkbox status of any resolved tasks (e.g., `- [x] **F1.1**: ...`)
     - Update the finding's `Status` field (`Open` → `In Progress` → `Resolved` → `Verified`)
     - Update the finding's `Stage` field to reflect the current pipeline position
     - Update `Resolved in session` / `Verified in session` fields with the session number
     - Add a row to the **Changelog** table with the date, session number, and what changed
     - Update the `Last Updated` timestamp at the top of the file

   **Stage reconciliation** — Check if artifacts exist that the tracker doesn't yet reflect:
     - Investigation report exists in `docs/investigations/` matching finding → Stage should be ≥ `Investigating`
     - RCA exists in `docs/RCAs/` matching finding → Stage should be ≥ `RCA Complete`
     - Design analysis exists in `docs/design/` matching finding → Stage should be ≥ `Designing`
     - Blueprint exists in `docs/blueprints/` matching finding → Stage should be ≥ `Blueprint Ready`
     - Plan exists in `docs/plans/` matching finding → Stage should be ≥ `Planned`
     - Code changes committed for finding → Stage should be `Resolved`
   If a stage was missed (artifact exists but no lifecycle row), backfill the lifecycle row with approximate timestamp.

   **GitHub Projects sync (NON-FATAL)** — For each finding whose stage changed this session, read `docs/reference/github_projects_sync_protocol.md` and follow Protocol B to update the board. Key mappings:
     - Implementing → Lifecycle Stage = Implementing (`9afc76db`), Status = In Progress (`47fc9ee4`)
     - Resolved → Lifecycle Stage = Resolved (`c9de0e86`), Status = Done (`98236657`)
     - Verified → Lifecycle Stage = Verified (`a20e6ccd`), Status = Done (`98236657`)
   If `**Project Item ID**:` is missing or `—` in the tracker, skip sync with a note.

   **Output format** — Show Stage alongside Status:
   ```
   Findings Trackers:
     {tracker_name}:
       F1: {title} — Status: In Progress | Stage: RCA Complete
       F2: {title} — Status: Open | Stage: Open
   ```

   - If no findings work was done this session, skip this step

**IMPORTANT**:

- Save plan file FIRST (step 1)
- Create new files NEXT (steps 2-3)
- THEN update CLAUDE.md to point to them (step 4)
- This ensures CLAUDE.md never points to non-existent files

After completing all tasks, provide a summary showing:

- New handoff filename
- New summary filename
- CLAUDE.md updated (show new line 24)
- Old handoff archived location
- Findings Tracker(s) updated (if applicable — show which tracker(s), which tasks/findings changed)

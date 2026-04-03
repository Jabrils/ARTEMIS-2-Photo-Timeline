# Post-Plan Menu

After saving the plan and updating any findings tracker, present this menu
using AskUserQuestion:

"Implementation plan complete and saved to {plan_path}. How would you like
to proceed?"

Options:
1. **Accept & Implement (clear context)** — Accept the plan, run /clear
   to free up context, then implement fresh with full context available
2. **Accept & Implement (continue)** — Accept the plan and begin
   implementation now in this session
3. **Revise Plan** — Tell me what to change in the plan before proceeding
4. **Accept Plan Only** — Accept the plan but don't implement yet — stop here

Based on the user's choice:
- **Option 1**: Tell the user to run /clear, then invoke `/wrought-implement`
  (proactive) or `/wrought-rca-fix` (reactive) with the plan at {plan_path}
  when the new session starts. NEVER implement by editing files directly.
- **Option 2**: Invoke `/wrought-implement` (proactive) or `/wrought-rca-fix`
  (reactive) immediately. NEVER implement by editing files directly.
- **Option 3**: Ask the user what to change, revise the plan, then
  re-present this menu.
- **Option 4**: STOP. The plan is saved for a future session.

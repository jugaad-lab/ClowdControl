# Token Budgeting System

Track and alert on token consumption across projects and tasks.

## Schema Changes

Run `supabase/migrations/005_token_budgeting.sql` via Supabase Dashboard → SQL Editor.

This adds:
- `projects.budget_tokens` — Total token budget (0 = unlimited)
- `projects.tokens_consumed` — Running total from all tasks
- `projects.budget_alert_threshold` — Alert when usage exceeds this % (default: 80%)
- Auto-update trigger when task tokens change
- `project_budget_status` view for dashboards

## Scripts

### Set a project budget
```bash
./scripts/agentcomms/set-budget.sh <project_id> <tokens> [threshold]
# Example: Set 100k budget with 75% alert
./scripts/agentcomms/set-budget.sh abc-123 100000 0.75
```

### Track token usage on a task
```bash
./scripts/agentcomms/track-tokens.sh <task_id> <tokens_used>
# Example: Log 5000 tokens used
./scripts/agentcomms/track-tokens.sh def-456 5000
```

### Check budget status
```bash
./scripts/agentcomms/budget-status.sh [project_id]
# Without arg: shows all active projects
# Output:
# ✅ [ProjectA] OK: 45% (45000/100000)
# ⚠️  [ProjectB] WARNING: 82% (82000/100000) — PM: chhotu
# 🚨 [ProjectC] EXCEEDED: 115% (115000/100000) — PM: cheenu
```

## Integration Points

### Heartbeat Monitoring
Add to HEARTBEAT.md:
```bash
# Check budget status for active projects
~/workspace/skills/clowdcontrol/scripts/agentcomms/budget-status.sh | grep -E "⚠️|🚨"
```

### Task Completion
When completing tasks, update token consumption:
```bash
# After finishing work, estimate tokens used
./scripts/agentcomms/track-tokens.sh $TASK_ID 15000
```

## Future Enhancements
- [ ] Automatic token tracking from Clawdbot session stats
- [ ] Discord/Slack alerts when threshold exceeded
- [ ] Historical tracking in agent_activity table
- [ ] Dashboard visualization

---
name: clowdcontrol-pm
description: PM workflow integration for ClowdControl. Checks for assigned projects, finds next viable tasks, and drives work forward. Add to HEARTBEAT.md for continuous project progress.
metadata: {"clawdbot":{"emoji":"🎯"}}
---

# ClowdControl PM Workflow

This skill turns you into an active Project Manager in ClowdControl. Instead of waiting for instructions, you proactively check your projects and drive tasks forward.

## Setup

### 1. Environment

Ensure you have credentials in `~/workspace/.env.agentcomms`:
```bash
MC_SUPABASE_URL=https://xxxxx.supabase.co
MC_SERVICE_KEY=your-service-role-key
AGENT_ID=chhotu  # Your agent ID
```

### 2. Add to HEARTBEAT.md

Add this to your `HEARTBEAT.md`:
```markdown
## ClowdControl PM Check
Every heartbeat, check for active work:
1. Source `~/workspace/.env.agentcomms`
2. Query projects where I'm PM: `GET /rest/v1/projects?current_pm_id=eq.AGENT_ID&status=eq.active`
3. For each project, find next viable task (not blocked, highest priority)
4. If task found → claim it and start working
5. If no tasks → check if sprint needs planning
```

## PM Workflow

### On Heartbeat: Check My Projects

```bash
#!/bin/bash
source ~/workspace/.env.agentcomms

# 1. Get my active projects
PROJECTS=$(curl -s "$MC_SUPABASE_URL/rest/v1/projects?current_pm_id=eq.$AGENT_ID&status=eq.active" \
  -H "apikey: $MC_SERVICE_KEY" \
  -H "Authorization: Bearer $MC_SERVICE_KEY")

# 2. For each project, find next task
for PROJECT_ID in $(echo $PROJECTS | jq -r '.[].id'); do
  # Get unclaimed tasks, ordered by priority
  NEXT_TASK=$(curl -s "$MC_SUPABASE_URL/rest/v1/tasks?project_id=eq.$PROJECT_ID&status=in.(backlog,assigned)&order=priority.desc&limit=1" \
    -H "apikey: $MC_SERVICE_KEY" \
    -H "Authorization: Bearer $MC_SERVICE_KEY")
  
  if [ "$(echo $NEXT_TASK | jq length)" -gt 0 ]; then
    echo "Found task: $(echo $NEXT_TASK | jq -r '.[0].title')"
  fi
done
```

### Decision Tree: What To Do Next

```
Heartbeat fires
    │
    ▼
Query my projects (current_pm_id = me, status = active)
    │
    ├── No projects? → HEARTBEAT_OK
    │
    ▼
For each project:
    │
    ├── Any tasks assigned to me with status=in_progress?
    │   └── YES → Continue working on that task
    │
    ├── Any tasks in backlog/assigned not blocked?
    │   └── YES → Pick highest priority, start working
    │
    ├── All tasks done in current sprint?
    │   └── YES → Check if sprint needs closing, plan next sprint
    │
    └── No actionable work?
        └── HEARTBEAT_OK (or notify human)
```

### Finding the Next Viable Task

A task is "viable" if:
- `status` is `backlog` or `assigned`
- Not blocked by dependencies (all `depends_on` tasks are `done`)
- Matches my capabilities OR needs to be delegated

```bash
# Query for next viable task
curl -s "$MC_SUPABASE_URL/rest/v1/tasks?\
project_id=eq.$PROJECT_ID&\
status=in.(backlog,assigned)&\
order=priority.desc,created_at.asc&\
limit=5" \
  -H "apikey: $MC_SERVICE_KEY" \
  -H "Authorization: Bearer $MC_SERVICE_KEY"
```

Then check dependencies:
```bash
# For each task, verify dependencies are met
DEPS=$(curl -s "$MC_SUPABASE_URL/rest/v1/task_dependencies?task_id=eq.$TASK_ID" \
  -H "apikey: $MC_SERVICE_KEY")

# Check if all depends_on tasks are done
for DEP_ID in $(echo $DEPS | jq -r '.[].depends_on_task_id'); do
  DEP_STATUS=$(curl -s "$MC_SUPABASE_URL/rest/v1/tasks?id=eq.$DEP_ID&select=status" \
    -H "apikey: $MC_SERVICE_KEY" | jq -r '.[0].status')
  if [ "$DEP_STATUS" != "done" ]; then
    echo "Blocked by $DEP_ID"
    continue  # Skip this task
  fi
done
```

### Claiming and Starting a Task

```bash
# 1. Update task status to in_progress
curl -X PATCH "$MC_SUPABASE_URL/rest/v1/tasks?id=eq.$TASK_ID" \
  -H "apikey: $MC_SERVICE_KEY" \
  -H "Authorization: Bearer $MC_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"in_progress\",
    \"assigned_to\": \"$AGENT_ID\"
  }"

# 2. Log activity
curl -X POST "$MC_SUPABASE_URL/rest/v1/activity_log" \
  -H "apikey: $MC_SERVICE_KEY" \
  -H "Authorization: Bearer $MC_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"task_started\",
    \"entity_type\": \"task\",
    \"entity_id\": \"$TASK_ID\",
    \"agent_id\": \"$AGENT_ID\"
  }"
```

### PM vs Specialist Work

As PM, decide: **Do it myself or delegate?**

| Task Type | Action |
|-----------|--------|
| Sprint planning | Do it myself |
| Code review | Do it myself |
| Coordination | Do it myself |
| Development | Delegate to `friday-dev` |
| Research | Delegate to `fury` |
| QA/Testing | Delegate to `hawkeye` |
| Design | Delegate to `wanda` |

To delegate:
```bash
# Create task handoff
./scripts/agentcomms/handoff.sh "friday-dev" "Implement login feature" "high"
```

### Completing a Task

```bash
# 1. Update task status
curl -X PATCH "$MC_SUPABASE_URL/rest/v1/tasks?id=eq.$TASK_ID" \
  -H "apikey: $MC_SERVICE_KEY" \
  -H "Authorization: Bearer $MC_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "completed_at": "now()"
  }'

# 2. Check if sprint is complete
# (all tasks in sprint are done)
```

## Integration with AGENTS.md

Add to your AGENTS.md:

```markdown
## ClowdControl PM Duties

When I'm PM for a project:
1. **Heartbeat** → Check for next viable task
2. **Task found** → Either do it or delegate
3. **Task blocked** → Update status, find alternative
4. **Sprint done** → Close sprint, plan next
5. **No work** → Report to human or HEARTBEAT_OK

I don't wait for instructions. I drive the project forward.
```

## Proactive Behaviors

### Daily (via heartbeat)
- [ ] Check all my projects for actionable tasks
- [ ] Update task statuses if anything changed
- [ ] Unblock anything waiting on me

### On Task Completion
- [ ] Mark task done in ClowdControl
- [ ] Check if sprint acceptance criteria met
- [ ] Pick up next task automatically

### On Blocker
- [ ] Update task to `blocked` status
- [ ] Notify human if critical
- [ ] Find alternative work meanwhile

## Example Heartbeat Check

```markdown
# In HEARTBEAT.md

## ClowdControl PM Check
1. Query: `projects?current_pm_id=eq.chhotu&status=eq.active`
2. For each project:
   - Find next viable task (not blocked, highest priority)
   - If specialist work → delegate via handoff
   - If PM work → start working
3. Update any stale task statuses
4. If nothing to do → HEARTBEAT_OK
```

## Why This Matters

Without this skill, ClowdControl is passive — it stores data but doesn't drive action.

With this skill, you become an **active PM** who:
- Proactively checks for work
- Drives tasks to completion
- Delegates appropriately
- Keeps projects moving

The project progresses even when humans aren't watching.

# PM Protocol — Agent Dispatch System

**Version:** 1.0  
**Target:** Any Clawdbot instance acting as PM

---

## Overview

When a task needs execution, the PM follows a structured dispatch protocol. This ensures work flows through the proper agent pipeline — never done ad-hoc by the PM itself (unless no suitable specialist exists).

---

## Trigger Sources

The PM receives work requests from three sources:

| Source | How it arrives | Example |
|--------|---------------|---------|
| **Webhook** | External webhook to configured channel | `🚀 Start Requested — Task: Fix progress bug` |
| **Cron/Heartbeat** | PM heartbeat checks active sprints | PM finds unassigned tasks in priority order |
| **Direct** | Human tells PM directly | "Start working on the auth feature" |

All three MUST follow the same dispatch protocol below.

---

## Dispatch Protocol

### Step 1: Parse the Task

Extract from the request:
- **Task title** and description
- **Task ID** (UUID)
- **Task type** (development, research, design, testing, bug, documentation, etc.)
- **Priority** (P1-P4)
- **Project ID**

### Step 2: Query AgentRegistry

Fetch specialist agents from the AgentRegistry:

```sql
SELECT * FROM agents 
WHERE agent_type = 'specialist' 
AND is_active = true;
```

Each agent record contains:
```json
{
  "id": "worker-dev",
  "display_name": "Developer",
  "role": "Developer", 
  "capabilities": ["coding", "debugging", "architecture"],
  "invocation_method": "claude_code",
  "invocation_config": {
    "model": "anthropic/claude-sonnet-4-5",
    "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]
  }
}
```

### Step 3: Select Best Agent

Match task type → agent capabilities:

| Task Type | Primary Agent | Fallback |
|-----------|--------------|----------|
| `development`, `bug` | Developer | PM handles |
| `research` | Customer Researcher | Product Analyst |
| `design` | Designer | — |
| `testing` | QA Engineer | UI QA |
| `documentation` | Documentation Specialist | Content Writer |
| `business`, `marketing` | Social Media / Email | — |
| `other` | PM evaluates and picks | — |

**Selection criteria:**
1. Match capabilities to task type
2. Check if agent is currently busy (via active sessions)
3. Prefer agents with relevant recent activity on the same project

### Step 4: Create Task File

Write a detailed task specification to `tasks/TASK-{slug}.md`:

```markdown
# Task: {Title}

## Task ID
`{uuid}`

## Agent
- **Target:** {agent_id}
- **Model:** {from invocation_config}

## Objective
{Clear, specific goal}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Files to Modify
- `{path}` — {what changes}

## Project Location
`{absolute path to project}`
```

### Step 5: Invoke Agent

Based on `invocation_method`:

#### `sessions_spawn` (most agents)

```python
sessions_spawn(
  task=f"Read {task_file_path} and complete the task. Report results when done.",
  model=invocation_config['model'],
  label=f"{agent_id}-{task_slug}",
  thinking=invocation_config.get('thinking')
)
```

#### `claude_code` (developer agents)

1. Pre-trust the project in `~/.claude.json`
2. Write task to `TASK.md` in project root
3. **Pick mastery agent based on complexity:**
   - Low (< 50 LOC) → `--agent junior-dev`
   - Medium, frontend → `--agent frontend-dev`
   - Medium, backend → `--agent backend-dev`
   - High (> 200 LOC) → `--agent senior-dev`
   - Multi-component → `--agent project-manager`
4. Spawn with the selected agent:

```bash
cd {project_path}
claude --agent {mastery-agent} -p --allowedTools "Bash(*)" "Edit(*)" "Write(*)" "Read(*)" "Fetch(*)" \
  "Follow TASK.md and complete the task. Commit your changes when done."
```

> **MANDATORY:** Always include `--agent` flag. Available: `senior-dev`, `junior-dev`, `frontend-dev`, `backend-dev`, `project-manager`, `ai-engineer`, `ml-engineer`, `data-scientist`, `data-engineer`, `product-manager`

#### `custom` (extensible)

Follow `invocation_config.command` template.

### Step 6: Update Task Status

After spawning:
```sql
UPDATE tasks SET 
  status = 'assigned',
  assigned_to = '{agent_id}',
  assigned_at = NOW()
WHERE id = '{task_id}';
```

Log to activity:
```sql
INSERT INTO activity_log (project_id, action, actor_id, details)
VALUES ('{project_id}', 'task_assigned', '{pm_id}', 
  '{\"task_id\": \"{task_id}\", \"agent_id\": \"{agent_id}\", \"method\": \"{invocation_method}\"}');
```

### Step 7: Start Monitoring Cron

**Every dispatch MUST start a monitoring cron if one isn't already running.**

#### When to create monitor cron:
- **Webhook trigger** → Create cron for that task
- **Full Speed mode** → Create cron for the sprint
- **Single task dispatch** → Create cron for that task
- **Heartbeat picks up task** → Create cron if not already running

#### Monitor cron behavior:
- **Frequency:** Every 5 minutes
- **Scope:** All in-progress tasks in scope
- **Actions per check:**
  1. Poll each agent's session status
  2. If agent finished → mark task complete, chain next if Full Speed
  3. If agent failed → reassign or escalate, notify channel
  4. If agent stuck (>15 min no progress) → check logs, intervene
- **Auto-disable:** When all monitored tasks are done
- **Target:** `sessionTarget: "isolated"` with `wakeMode: "next-heartbeat"`

#### Template:
```json
{
  "name": "sprint{N}-agent-monitor",
  "description": "Monitor Sprint {N} agents - auto-created by PM dispatch",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *", "tz": "{your-timezone}"},
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "text": "🔄 SPRINT {N} AGENT MONITOR — Check all in-progress tasks, update status, chain next if Full Speed mode.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

### Step 8: Execution Mode Behaviors

#### Manual Mode
- **No automated chaining.** PM waits for next trigger.
- When triggered → dispatch one task, monitor until done, stop.
- Single-task monitoring cron: every 5 min, auto-disables when that task completes.

#### Full Speed Mode
- **5-min monitoring cron** that:
  1. Checks all in-progress agents
  2. When agent finishes → marks task done, picks next backlog task, dispatches it
  3. Chains through ALL backlog tasks automatically
  4. Only stops on: blocker, budget limit, or no more backlog tasks
  5. When sprint complete → post summary to channel, disable cron

#### Background Mode
- **30-min task processing cron** that:
  1. Checks active sprint for backlog tasks
  2. Picks highest-priority backlog task
  3. Dispatches to appropriate agent
  4. Monitors spawned agent
  5. When agent finishes → marks task done, waits for next 30-min cycle
  6. Processes ONE task per cycle (no chaining)
  7. When sprint complete → post summary, disable cron

#### Mode Switch Behavior
- **→ Manual:** Disable processing crons. In-progress tasks continue.
- **→ Full Speed:** Create 5-min monitoring cron immediately. Start chaining if backlog exists.
- **→ Background:** Create 30-min processing cron. First run at next cycle.

#### Cron Templates

**Full Speed:**
```json
{
  "name": "sprint{N}-fullspeed-monitor",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *"},
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "🔥 FULL SPEED MONITOR — Sprint {N}. Check agents, chain next task if any finished.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

**Background:**
```json
{
  "name": "sprint{N}-background-processor",
  "schedule": {"kind": "cron", "expr": "*/30 * * * *"},
  "sessionTarget": "isolated", 
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "⏰ BACKGROUND PROCESSOR — Sprint {N}. Pick ONE backlog task, dispatch to best agent.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

> ⚠️ **NEVER use `systemEvent` + `sessionTarget: main` for monitoring crons.**
> Always use `agentTurn` + `sessionTarget: isolated` + `deliver: true` for reliable execution.

---

## Anti-Patterns (Don't Do This)

| ❌ Wrong | ✅ Right |
|----------|---------|
| PM fixes the bug itself without checking roster | PM queries agents, dispatches to specialist |
| PM says "No agent available" without checking DB | PM queries database for available agents |
| PM skips task file, gives instructions verbally | PM writes full task spec to `tasks/TASK-*.md` |
| PM announces spawn without actual tool call | PM calls tool first, confirms with real session ID |
| PM says "I'll check on them" with no mechanism | PM creates monitoring cron immediately |
| PM manually remembers to check agents | Monitoring cron auto-fires every 5 min until done |

---

## Configuration Variables

Replace these placeholders with your setup:

- `{your-database-url}` — Agent roster database connection
- `{your-channel-id}` — Discord/Slack channel for notifications
- `{your-timezone}` — Local timezone for cron schedules
- `{pm_id}` — Your PM agent ID
- `{project_workspace}` — Base path for projects

---

## Sharing This Protocol

This protocol is designed to be **portable**. Any Clawdbot PM can follow it:

1. Agent roster lives in **shared database** (not local config)
2. Task files use **standard template** 
3. Invocation methods are **self-describing** via database
4. Any PM reads protocol + queries DB = ready to dispatch

To deploy on a new PM:
- Install this skill
- Configure database connection
- Set up channel notifications
- Populate AgentRegistry
- Test with a simple task

---

*This is the canonical reference for PM task dispatch.*
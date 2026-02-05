---
name: mission-control-pm
description: PM dispatch protocol for multi-agent task coordination. Manages sprints, dispatches tasks to specialized agents, monitors progress, and chains work in Full Speed mode.
metadata: {"clawdbot":{"emoji":"🎯"}}
---

# Mission Control PM Protocol

A comprehensive task dispatch system that transforms any Clawdbot instance into a Project Manager capable of coordinating specialized agent teams. This skill provides the complete workflow for receiving work requests, matching tasks to agents, spawning workers, and monitoring progress through completion.

## Overview

The PM protocol enables sophisticated multi-agent coordination with three execution modes:
- **Manual Mode**: Dispatch individual tasks on demand
- **Full Speed Mode**: Chain through all sprint tasks with automatic progression
- **Background Mode**: Process backlog tasks at regular intervals

All work flows through specialized agents — the PM never executes tasks directly unless no suitable agent exists.

## Prerequisites

1. **AgentRegistry Database**: Set up a database with agent profiles (see templates/)
2. **Project Structure**: Tasks directory for detailed specifications
3. **Agent Skills**: Install relevant skills for your specialist agents
4. **Monitoring Setup**: Cron job capability for automated monitoring

## Quick Start

### 1. Set Up AgentRegistry

Create your AgentRegistry database with this schema:

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  capabilities TEXT[] NOT NULL,
  invocation_method TEXT CHECK (invocation_method IN ('sessions_spawn', 'claude_code', 'custom')),
  invocation_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  agent_type TEXT DEFAULT 'specialist'
);
```

Add your first developer agent:
```sql
INSERT INTO agents (id, display_name, role, capabilities, invocation_method, invocation_config) VALUES
('worker-dev', 'Developer', 'Developer', 
 ARRAY['coding', 'debugging', 'architecture'], 
 'claude_code',
 '{"model": "anthropic/claude-sonnet-4-5", "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]}');
```

### 2. Configure Your Trigger Source

Choose how the PM receives work:

**Option A: Discord Webhook**
```json
{
  "webhook_url": "https://your-clawdbot-endpoint/webhook/discord",
  "channel": "#your-mission-control-channel",
  "trigger_format": "🚀 Start Requested — Task: {task_title}"
}
```

**Option B: Heartbeat Monitoring**
```markdown
<!-- In HEARTBEAT.md -->
Check active sprint for unassigned tasks in priority order.
If found: start dispatch protocol.
```

**Option C: Direct Commands**
```
"Start working on the authentication feature"
```

### 3. Create First Task

Write a task specification to `tasks/TASK-{slug}.md`:

```markdown
# Task: Add User Authentication

## Task ID
`550e8400-e29b-41d4-a716-446655440000`

## Agent
- **Target:** worker-dev
- **Model:** anthropic/claude-sonnet-4-5

## Objective
Implement JWT-based user authentication with login/logout/signup endpoints.

## Requirements
1. Create auth middleware
2. Add JWT token generation/validation
3. Implement login/logout/signup routes

## Acceptance Criteria
- [ ] User can sign up with email/password
- [ ] User can log in and receive JWT token
- [ ] Protected routes validate JWT tokens
- [ ] User can log out (token invalidation)

## Files to Modify
- `src/auth/` — New auth module
- `src/middleware/auth.ts` — JWT middleware
- `src/routes/auth.ts` — Auth endpoints

## Project Location
`/path/to/your/project`
```

## Dispatch Protocol

When work arrives, the PM follows this exact sequence:

### Step 1: Parse Request
Extract task details:
- Title and description
- Task ID (generate UUID if missing)
- Task type (development, research, design, testing, bug, documentation)
- Priority (P1-P4)
- Project ID

### Step 2: Query AgentRegistry
```python
# Pseudo-code for agent matching
available_agents = query_database(
    "SELECT * FROM agents WHERE is_active = true AND agent_type = 'specialist'"
)
```

### Step 3: Match Task to Agent

Use this mapping table:

| Task Type | Primary Agent Type | Fallback |
|-----------|-------------------|----------|
| `development`, `bug` | Developer | PM handles |
| `research` | Customer Researcher | Product Analyst |
| `design` | Designer | — |
| `testing` | QA Engineer | UI QA |
| `documentation` | Documentation Specialist | Content Writer |
| `business`, `marketing` | Social Media / Email | — |
| `other` | PM evaluates | — |

Selection criteria:
1. Match capabilities to task type
2. Check availability (not currently busy)
3. Prefer agents with recent project experience

### Step 4: Create Task File
Write detailed specification to `tasks/TASK-{slug}.md` using the provided template.

### Step 5: Spawn Agent

Based on agent's `invocation_method`:

#### sessions_spawn Method
```python
sessions_spawn(
    task=f"Read {task_file_path} and complete the task. Report results when done.",
    model=agent_config['model'],
    label=f"{agent_id}-{task_slug}",
    thinking=agent_config.get('thinking')
)
```

#### claude_code Method (for developers)
```python
# 1. Pre-trust project
update_claude_config(project_path, trusted=True)

# 2. Write TASK.md in project root with mastery analysis
task_content = render_template('TASK-MASTERY-TEMPLATE.md', {
    'complexity_analysis': analyze_task_complexity(task),
    'delegation_hints': generate_delegation_hints(task),
    **task_data
})
write_file(f"{project_path}/TASK.md", task_content)

# 3. Spawn Claude Code with mastery delegation capability
subprocess.run([
    "claude", 
    "--allowedTools", "Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)",
    "Analyze TASK.md complexity. If high complexity OR specialized domain, delegate to appropriate mastery agent using claude --agent. Otherwise execute directly. Commit when done."
], cwd=project_path)
```

#### Mastery Agent Selection Rules
When dispatching to mastery-enabled agents, include delegation hints:

```python
def generate_delegation_hints(task):
    complexity = estimate_complexity(task.description, task.files_to_modify)
    domain = classify_domain(task.requirements)
    
    if complexity == 'high' or len(task.files_to_modify) > 5:
        return 'senior-dev'
    elif domain == 'frontend':
        return 'frontend-dev' 
    elif domain == 'backend':
        return 'backend-dev'
    elif complexity == 'low':
        return 'junior-dev'
    else:
        return 'direct'  # Handle without delegation
```

### Step 6: Update Task Status
```sql
UPDATE tasks SET 
    status = 'assigned',
    assigned_to = '{agent_id}',
    assigned_at = NOW()
WHERE id = '{task_id}';
```

### Step 7: Start Monitoring

**CRITICAL**: Every dispatch must create a monitoring mechanism.

Create a cron job to check agent progress:

```json
{
  "name": "task-monitor-{task-slug}",
  "description": "Monitor agent progress on task {task_id}",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *"},
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn", 
    "message": "🔄 Monitor task {task_id}: Check agent {agent_id} status, update database, notify if complete/failed.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

## Execution Modes

### Manual Mode
- **Trigger**: Start button or direct instruction
- **Behavior**: Dispatch one task, monitor until done, stop
- **Cron**: Single-task monitoring (auto-disables when complete)

### Full Speed Mode  
- **Trigger**: Sprint activation with backlog
- **Behavior**: Chain through ALL backlog tasks automatically
- **Cron**: 5-minute monitoring that dispatches next task when previous completes

```json
{
  "name": "sprint{N}-fullspeed-monitor",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *"},
  "sessionTarget": "isolated", 
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "🔥 FULL SPEED — Check sprint {N} agents, chain next backlog task if any finished",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

### Background Mode
- **Trigger**: Sprint activation with 30-min processing
- **Behavior**: Process one backlog task per cycle (no chaining)
- **Cron**: 30-minute intervals, picks highest priority task

```json
{
  "name": "sprint{N}-background-processor", 
  "schedule": {"kind": "cron", "expr": "*/30 * * * *"},
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "⏰ BACKGROUND — Pick ONE backlog task from sprint {N}, dispatch to best agent",
    "deliver": true, 
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

## Agent Communication

### Task File Format
All agents receive work via standardized task files following `templates/TASK-TEMPLATE.md`.

### Progress Monitoring
The monitoring cron checks:
1. **Agent Status**: Poll session/process status
2. **Task Updates**: Check for completion signals
3. **Mastery Delegation**: Detect when Claude Code delegates to sub-agents
4. **Error Handling**: Detect failures and reassign
5. **Chain Logic**: In Full Speed, dispatch next task automatically

### Mastery Delegation Tracking
When monitoring mastery-enabled agents:
- **Check session logs** for delegation commands (`claude --agent` calls)
- **Update delegation chain** in database when sub-delegation detected
- **Monitor sub-agent progress** through Claude Code session
- **Escalate if delegation fails** to ensure task doesn't get stuck

### Output Collection
Agents report via standardized formats (see agent profiles in examples/).

## Anti-Patterns to Avoid

| ❌ Wrong | ✅ Right |
|----------|---------|
| PM executes tasks directly | PM dispatches to specialist agents |
| PM announces spawn without tool call | PM calls spawn tool first, then confirms |
| PM manually checks on agents | PM creates monitoring cron before confirming |
| Verbal task instructions | Written task file following template |
| Hardcoded agent selection | Query database for available agents |

## Configuration Placeholders

Replace these with your actual values:

- `{your-database-url}` → Your AgentRegistry database
- `{your-channel-id}` → Discord/Slack channel for notifications  
- `{project-workspace}` → Your projects directory
- `{your-clawdbot-endpoint}` → Webhook endpoint URL

## Claude Code Mastery Integration

### Available Mastery Agents
The following claude-code-mastery agents are available for delegation:

| Agent | Specialization | Model | Best For |
|-------|----------------|-------|----------|
| `senior-dev` | Architecture, complex logic | Sonnet | Large features, refactoring, system design |
| `junior-dev` | Simple fixes, documentation | Haiku | Bug fixes, docs, unit tests, simple features |
| `frontend-dev` | React, UI/UX, client-side | Sonnet | UI components, responsive design, interactions |
| `backend-dev` | APIs, databases, server-side | Sonnet | REST APIs, database design, authentication |
| `project-manager` | Task breakdown, planning | Sonnet | Multi-component features, sprint planning |
| `ai-engineer` | LLM integration, ML | Sonnet | AI features, prompt engineering, RAG systems |

### Delegation Workflow
1. **PM dispatches** task to worker-dev using standard protocol
2. **worker-dev analyzes** task complexity and domain requirements  
3. **Delegation decision**: Based on complexity matrix and domain expertise
4. **Internal delegation**: `claude --agent {chosen-agent} -p "prompt"`
5. **Monitoring continues**: PM tracks progress through Claude Code session
6. **Result reporting**: Final results bubble up through delegation chain

### Fallback Strategy
If mastery delegation fails:
1. **worker-dev handles directly** (maintains task completion)
2. **Monitoring detects issues** via session logs
3. **PM intervention** if needed for complex failures
4. **Task marked complete** regardless of delegation success/failure

## Extension Points

### Custom Agent Types
Add new agent types by:
1. Creating agent profile following `templates/AGENT-PROFILE-TEMPLATE.md`
2. Adding to database with appropriate capabilities
3. Updating task type mapping table

### Custom Invocation Methods
Extend beyond `sessions_spawn` and `claude_code`:
1. Set `invocation_method: "custom"`
2. Define `invocation_config.command` template
3. Handle in dispatch logic

### Custom Task Types
Map new task types to agent capabilities in the dispatch logic.

## Troubleshooting

**Agent Won't Spawn**
- Check database connectivity
- Verify agent is `is_active = true`
- Ensure invocation_config is valid JSON

**Tasks Not Getting Picked Up**
- Verify monitoring cron is running
- Check task status in database
- Ensure agent hasn't failed silently

**No Suitable Agent Found**
- Add fallback agent to database
- Update capability mapping
- Allow PM to handle edge cases

## Files Included

- `PM-PROTOCOL.md` — Complete protocol reference
- `templates/AGENT-PROFILE-TEMPLATE.md` — Agent profile structure
- `templates/TASK-TEMPLATE.md` — Task specification format
- `examples/example-agent-friday.md` — Sample developer agent
- `examples/example-task.md` — Sample task file

---

*Install this skill to transform your Clawdbot into a mission control PM capable of coordinating specialized agent teams.*
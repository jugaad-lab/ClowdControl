# Agent Communication Guide

## How Agents Talk to Each Other

ClowdControl agents communicate through three mechanisms:

### 1. Discord Channels (Primary)

Agents share a Discord server with dedicated channels:

```
#disclawd-mission-control   — Main coordination channel
#bot-to-bot                 — Agent-to-agent discussions
#human-override             — Escalations requiring human input
#project-{name}             — Per-project workspaces
```

**Message format:**
```
[FROM: Chhotu]
[TO: Cheenu]
[TYPE: Request | Response | Handoff | Escalation]
[TASK: Current context]
[CONFIDENCE: High | Medium | Low]

<message content>
```

### 2. Clawdbot sessions_send (Direct)

For programmatic agent-to-agent messaging:

```javascript
// From Chhotu to Cheenu
sessions_send({
  sessionKey: "cheenu-session-key",
  message: "Task completed: PR #42 merged. Ready for QA."
})
```

### 3. Supabase agent_messages (Async Queue)

For persistent, trackable communication:

```sql
INSERT INTO agent_messages (from_agent, to_agent, message_type, content, metadata)
VALUES (
  'chhotu',
  'cheenu', 
  'task_notification',
  'New task assigned: Fix login bug',
  '{"task_id": "...", "priority": "high"}'
);
```

**Message types:** `chat`, `task_update`, `status`, `debate`, `vote`, `system`, `task_notification`, `ack`, `hidden_plan`

## Spawning Specialist Agents

PMs spawn specialists using their `invocation_method`:

### sessions_spawn (Most Specialists)

```javascript
sessions_spawn({
  task: "Research competitor pricing models. Write findings to RESEARCH.md",
  model: "anthropic/claude-sonnet-4-20250514",
  label: "fury-research-pricing",
  thinking: "low"
})
```

### claude_code (Developer Agents)

```javascript
// Spawn Claude Code for coding tasks
exec({
  command: 'claude --allowedTools "Bash(*)" "Edit(*)" "Write(*)" "Read(*)" "Fetch(*)" "Follow tasks/TASK-fix-auth.md"',
  background: true
})
```

## Tracking Agent Sessions

All spawned sessions are tracked in `agent_sessions`:

```sql
SELECT * FROM agent_sessions 
WHERE agent_id = 'friday-dev' 
  AND status = 'running';
```

| Column | Purpose |
|--------|---------|
| session_key | Clawdbot session identifier |
| task_id | Linked task being worked |
| status | 'running', 'completed', 'failed', 'timeout' |
| tokens_used | Token consumption tracking |
| result_summary | Outcome when completed |

## PM Dispatch Protocol

When a PM receives a task:

1. **Parse** — Extract task details from request
2. **Query** — Fetch available specialists from `agents` table
3. **Select** — Match capabilities to task type
4. **Write** — Create `tasks/TASK-{slug}.md` with full spec
5. **Assign** — Update task in Supabase
6. **Spawn** — Invoke the specialist agent
7. **Track** — Create entry in `agent_sessions`
8. **Monitor** — Check progress, handle blockers

## Human-in-the-Loop

Agents escalate to humans when:

- **3 disagreements** without resolution
- **10 turns** without human checkpoint
- **1 hour** of inactivity
- **Confidence: Low** on critical decisions
- **Explicitly blocked** status

Escalations go to `#human-override` or `waiting_human` task status.

## Anti-Sycophancy Protocol

For multi-agent decisions:

1. **Independent Generation** — Each agent forms opinion privately
2. **Reveal** — Opinions shown simultaneously
3. **Critique** — Agents raise concerns about each other's positions
4. **Debate** — Structured rounds with turn limits
5. **Consensus or Escalate** — Agreement or human decides

Detected sycophancy indicators:
- Instant high consensus
- Echo language
- Flip without reasoning
- No substantive concerns

# PM Protocol — Mission Control Agent Dispatch

**Version:** 1.2  
**Date:** February 4, 2026  
**Applies to:** Any PM agent (Chhotu, Cheenu, or future PMs)

---

## Overview

When a task needs execution in Clowd-Control, the PM follows a structured dispatch protocol. This ensures work flows through the proper agent pipeline — never done ad-hoc by the PM itself (unless no suitable specialist exists).

---

## Multi-PM Architecture

Clowd-Control supports multiple PMs operating on the same project. All PMs share:

- **Worker roster** — Same Supabase `agents` table, same workers available to everyone
- **Dispatch protocol** — Every PM follows this document identically
- **Task board** — Same sprints, same backlog, same Supabase data

### PM Capabilities
Each PM's capabilities are tracked in the `agents` table. When assigning tasks to a PM:

| PM | Capabilities | Can Spawn Workers? | Infra |
|----|-------------|-------------------|-------|
| Chhotu | project_management, coding, analysis, orchestration | Yes (Claude Code + sessions_spawn) | Yajat's Mac mini |
| Cheenu | project_management, research, coding, writing, analysis | Yes (sessions_spawn; Claude Code if local install) | Cheenu's machine |

### PM Re-Delegation Rule

**When a PM receives a task, they decide: do it myself or delegate?**

```
PM receives assigned task
  → Is it PM-level work? (planning, review, coordination)
    → YES: PM does it directly
  → Is it specialist work? (coding, QA, design, content)
    → YES: PM follows dispatch protocol (Steps 1-8) to delegate to a worker
    → Worker executes, PM monitors
  → Result flows back through the PM who dispatched it
```

**PMs should delegate by default.** The whole point of having workers is that PMs orchestrate, not execute. A PM should only do the work itself if:
- No suitable worker exists for the task type
- The task is inherently PM-level (sprint planning, reviews, stakeholder comms)
- It's faster to do it than to write the spec (< 5 min of work)

### Task Ownership vs Execution
- **assigned_to** = who is *responsible* (could be a PM)
- If the PM re-delegates, the task stays assigned to the PM, but the PM tracks which worker actually executed it
- The PM is responsible for verifying the worker's output before marking done

### Cross-PM Coordination
When multiple PMs are active on the same sprint:
- Check `assigned_to` before picking up backlog tasks — don't grab work another PM is handling
- Use `agent_messages` table for async coordination between PMs
- If both PMs are online, one should take lead on the sprint (avoid duplicate dispatches)

---

## Trigger Sources

The PM receives work requests from three sources:

| Source | How it arrives | Example |
|--------|---------------|---------|
| **Start Button** | Discord webhook to `#disclawd-mission-control` | `🚀 Start Requested — Task: Fix progress bug` |
| **Cron/Heartbeat** | PM heartbeat checks active sprints | PM finds unassigned tasks in priority order |
| **Manual** | Human tells PM directly | "Chhotu, start working on the auth feature" |

All three MUST follow the same dispatch protocol below.

---

## Dispatch Protocol

### Step 1: Parse the Task

Extract from the request:
- **Task title** and description
- **Task ID** (UUID from Supabase)
- **Task type** (development, research, design, testing, bug, documentation, etc.)
- **Priority** (P1-P4)
- **Project ID**

### Step 2: Query AgentRegistry

Fetch specialist agents from the AgentRegistry (Supabase):

```
GET /rest/v1/agents?agent_type=eq.specialist&is_active=eq.true
```

Each agent has:
```json
{
  "id": "worker-dev",
  "display_name": "Developer",
  "role": "Developer",
  "capabilities": ["coding", "debugging", "architecture"],
  "invocation_method": "claude_code",
  "invocation_config": {
    "model": "anthropic/claude-sonnet-4-5-20250514",
    "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]
  }
}
```

### Step 3: Select Best Agent

Match task type → agent capabilities:

| Task Type | Primary Agent | Fallback |
|-----------|--------------|----------|
| `development` (complex) | worker-dev (Senior Developer) | worker-dev-mid |
| `development` (standard), `bug` | worker-dev-mid (Mid Developer) | worker-dev |
| `research` | worker-customer (Customer Researcher) | worker-analyst (Product Analyst) |
| `design` | worker-design (Designer) | — |
| `testing` | worker-qa (QA Engineer) | worker-ui-qa (UI QA) |
| `documentation` | worker-research (Documentation) | worker-content (Content Writer) |
| `business`, `marketing` | worker-social (Social Media) / worker-marketing (Email) | — |
| `other` | PM evaluates and picks | — |

**Selection criteria:**
1. Match capabilities to task type
2. Check if agent is currently busy (via agent_sessions table)
3. Prefer agents with relevant recent activity on the same project

### Step 4: Create Task File

Write a detailed task specification to `tasks/TASK-{slug}.md`. For mastery-enabled agents, use the enhanced template with complexity analysis:

```markdown
# Task: {Title}

## Task ID
`{uuid}`

## Agent
- **Target:** {agent_id}
- **Model:** {from invocation_config}

## Complexity Analysis (for mastery agents)
- **Estimated Complexity:** {low|medium|high}
- **Primary Domain:** {frontend|backend|fullstack|architecture|testing}
- **Lines of Code Estimate:** {<50|50-200|>200}
- **Suggested Mastery Agent:** {agent-recommendation}

## Objective
{Clear, specific goal}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Delegation Instructions
Based on complexity and domain, consider delegating to:
- **Low complexity** → junior-dev (fast, cost-effective — Haiku)
- **Standard complexity** → mid-dev (balanced — Sonnet 4)
- **High complexity** → senior-dev (architecture, complex logic — Sonnet 4.5)
- **Frontend focus** → frontend-dev (React, UI expertise — Sonnet 4.5)
- **Backend focus** → backend-dev (API, database expertise — Sonnet 4.5)
- **Multi-component** → project-manager (task breakdown — Sonnet 4.5)

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

### Claude Code Mastery Integration

When dispatching to claude_code agents with mastery capability (like worker-dev):

1. **Include complexity analysis** in the task file using the TASK-MASTERY-TEMPLATE.md format
2. **Add delegation instructions** based on task domain and complexity
3. **Monitor for internal delegation** via session logs
4. **Update delegation tracking** when sub-delegation is detected

The multi-tier delegation chain works as follows:
**MC PM** → **worker-dev (Claude Code session)** → **mastery agent (senior-dev/junior-dev/etc)**

### Step 5: Invoke Agent

Based on `invocation_method`:

#### `sessions_spawn` (most agents)

```
sessions_spawn(
  task: "Read {task_file_path} and complete the task. Report results when done.",
  model: invocation_config.model,
  label: "{agent_id}-{task_slug}",
  thinking: invocation_config.thinking || undefined
)
```

#### `claude_code` (worker-dev)

1. Pre-trust the project in `~/.claude.json`
2. Write task to `TASK.md` in project root
3. **Assess complexity and pick mastery agent:**

| Complexity | Domain | Agent Flag |
|------------|--------|------------|
| Low (< 50 LOC, simple fix) | Any | `--agent junior-dev` |
| Medium, frontend-heavy | UI/React/CSS | `--agent frontend-dev` |
| Medium, backend-heavy | API/DB/auth | `--agent backend-dev` |
| High (> 200 LOC, architecture) | Any | `--agent senior-dev` |
| Multi-component breakdown | Any | `--agent project-manager` |

4. Spawn with the selected mastery agent:

```bash
cd {project_path}
claude --agent {mastery-agent} -p --allowedTools "Bash(*)" "Edit(*)" "Write(*)" "Read(*)" "Fetch(*)" \
  "Follow TASK.md and complete the task. Commit your changes when done."
```

> **⚠️ MANDATORY:** Every `claude_code` dispatch MUST include `--agent {mastery-agent}`. Never spawn vanilla Claude Code without an agent flag. The mastery agents are installed at `~/.claude/agents/` and provide specialized expertise that significantly improves output quality.
>
> **Available agents:** `senior-dev`, `junior-dev`, `frontend-dev`, `backend-dev`, `project-manager`, `ai-engineer`, `ml-engineer`, `data-scientist`, `data-engineer`, `product-manager`

#### `custom` (future extensibility)

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

Log to activity_log:
```sql
INSERT INTO activity_log (project_id, action, actor_id, details)
VALUES ('{project_id}', 'task_assigned', 'chhotu', 
  '{"task_id": "{task_id}", "agent_id": "{agent_id}", "method": "{invocation_method}"}');
```

### Step 7: Start Monitoring Cron

**Every dispatch MUST start a monitoring cron if one isn't already running.**

This is non-optional. Without it, spawned agents run unsupervised.

#### When to create a monitor cron:
- **Start Button pressed** → Create cron for that task
- **Full Speed mode** → Create cron for the sprint
- **Single task dispatch** → Create cron for that task
- **Cron/heartbeat picks up a task** → Create cron if not already running

#### Monitor cron behavior:
- **Frequency:** Every 5 minutes
- **Scope:** All in-progress tasks in the current sprint (or the specific task)
- **Actions per check:**
  1. Poll each agent's session (process poll for claude_code, sessions_list for sessions_spawn)
  2. If agent finished → mark task done/review in Supabase, chain to next task if Full Speed
  3. If agent failed → reassign or escalate, notify #disclawd-mission-control
  4. If agent stuck (>15 min no progress) → check logs, intervene if needed
- **Auto-disable:** When all monitored tasks are done (or sprint completes), disable the cron
- **Target:** `sessionTarget: "main"` with `wakeMode: "now"` so PM acts immediately

#### Cron naming convention:
- Sprint-level: `sprint{N}-agent-monitor`
- Single task: `task-monitor-{short-slug}`

#### Template:
```json
{
  "name": "sprint{N}-agent-monitor",
  "description": "Monitor Sprint {N} agents - auto-created by PM dispatch",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *", "tz": "America/Los_Angeles"},
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": {
    "kind": "systemEvent",
    "text": "🔄 SPRINT {N} AGENT MONITOR — Check all in-progress tasks:\n\n{list of tasks with agent, session ID, and method}\n\nFor each: poll status, update Supabase, chain next if Full Speed.\nIf all done → post summary to #disclawd-mission-control and disable this cron."
  }
}
```

### Step 8: Execution Mode Behaviors

Each mode has a specific PM behavior. These are **mandatory** — not suggestions.

#### Manual Mode
- **No cron needed.** PM waits for Start button or direct instruction.
- When Start button is pressed → dispatch one task (Steps 1-7), monitor until done, stop.
- Single-task monitoring cron: every 5 min, auto-disables when that task completes.

#### Full Speed Mode
- **5-min monitoring cron** that:
  1. Checks all in-progress agents
  2. When agent finishes → marks task done, picks next backlog task, dispatches it
  3. Chains through ALL backlog tasks in the sprint automatically
  4. Only stops on: blocker, budget limit, or no more backlog tasks
  5. When sprint is complete → post summary to #disclawd-mission-control, disable cron

> **⚠️ Zombie Detection (Mandatory):** Every monitoring cron run MUST query ALL `in_progress` tasks from Supabase. If a task has been `in_progress` for >30 min with no known active worker session, reset it to `backlog`. This catches workers that died silently.

> **⚠️ QA Gate Rule (Mandatory):** Tasks with `task_type: "testing"` or `task_type: "qa"` are ALWAYS dispatched LAST in a sprint. The PM must hold QA tasks in backlog until all other non-QA backlog tasks are done or in-progress. This ensures QA validates the final state of the sprint, not intermediate work. If a QA task is the only backlog item remaining, dispatch it.

#### Background Mode
- **30-min task processing cron** that:
  1. Checks active sprint for backlog tasks
  2. Picks highest-priority backlog task (respecting QA Gate Rule — QA tasks go last)
  3. Dispatches it to the right agent (Steps 3-6)
  4. Monitors spawned agent (sub-checks every 5 min within the 30-min window)
  5. When agent finishes → marks task done, waits for next 30-min cycle
  6. Processes ONE task per cycle (not chaining like Full Speed)
  7. When sprint is complete → post summary, disable cron

#### Mode Switch Behavior
When execution mode changes:
- **→ Manual:** Disable any active processing crons. In-progress tasks continue but no new ones are dispatched.
- **→ Full Speed:** Create 5-min monitoring cron immediately. If backlog tasks exist, start dispatching now.
- **→ Background:** Create 30-min processing cron. First run happens at next cycle (not immediately).

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
    "message": "🔥 FULL SPEED MONITOR — Sprint {N}. Check all in-progress agents, update Supabase, chain next task if any finished. Post status to channel.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{mission-control-channel-id}"
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
    "message": "⏰ BACKGROUND PROCESSOR — Sprint {N}. Pick ONE backlog task, dispatch to best agent, monitor until done. Post status to channel. If no backlog tasks, disable this cron.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{mission-control-channel-id}"
  }
}
```

> ⚠️ **NEVER use `systemEvent` + `sessionTarget: main` for monitoring crons.**
> systemEvent on main session hits the heartbeat path — if HEARTBEAT.md is empty, the cron silently does nothing.
> Always use `agentTurn` + `sessionTarget: isolated` + `deliver: true` for monitoring crons.

---

## Sprint Closing Protocol (Mandatory)

A sprint is **NOT complete** until both closing gates pass. These are mandatory — no exceptions.

### Gate 1: QA Evaluation Run

**Who:** QA agent (worker-qa or worker-ui-qa)
**When:** After all non-QA tasks are marked `done`
**What:** Run the full evaluation test suite against the sprint's deliverables

The PM must:
1. Create a QA closing task (if one doesn't already exist in the sprint):
   - **Title:** `[QA GATE] Sprint {N} — Evaluation Test Run`
   - **Type:** `testing`
   - **Priority:** P1
   - **Description:** Run all evaluation tests. Verify every completed task's acceptance criteria. Report pass/fail with evidence.
2. Dispatch to QA agent using standard dispatch protocol (Steps 3-7)
3. If QA finds bugs → create follow-up bug tasks in the **next sprint's backlog**, mark current sprint QA as `done` with notes
4. If QA passes clean → mark QA gate as ✅

### Gate 2: PM Review & Verification

**Who:** PM (Chhotu, Cheenu, or whoever is running the sprint)
**When:** After QA gate passes (or in parallel if PM wants early visibility)
**What:** PM personally reviews each completed task against its spec

The PM must:
1. For **every task** in the sprint marked `done`:
   - Pull the original task spec from `tasks/TASK-*.md` or Supabase
   - Check each acceptance criterion — was it actually implemented?
   - Verify the work matches the intent, not just the letter
   - Grade: ✅ Pass, ⚠️ Partial, ❌ Miss
2. For any ⚠️ Partial or ❌ Miss:
   - Create a follow-up task in the **next sprint's backlog** with clear description of what's missing
   - Reference the original task ID
   - Tag with `follow-up` and original sprint number
3. Write a **Sprint Closing Report** to `docs/sprint-{N}-closing.md`:
   ```markdown
   # Sprint {N} Closing Report
   
   ## Summary
   - Tasks completed: X/Y
   - QA result: {pass/fail with bug count}
   - PM review: {X pass, Y partial, Z miss}
   
   ## Task Reviews
   | Task | Title | QA | PM Review | Notes |
   |------|-------|----|-----------|-------|
   | {id} | {title} | ✅/❌ | ✅/⚠️/❌ | {notes} |
   
   ## Follow-Up Tasks Created
   - {task title} → Sprint {N+1} backlog ({reason})
   
   ## Lessons Learned
   - {What worked well}
   - {What didn't — and why}
   - {Process improvements for next sprint}
   ```
4. Post the closing summary to `#disclawd-mission-control`

### Self-Learning Rule

The PM Review is a **learning mechanism**. Over time, the PM builds pattern recognition:

- **Track recurring gaps** — If agents keep missing the same type of acceptance criteria, update the task template to be more explicit about that pattern
- **Refine agent instructions** — If worker-dev consistently misses edge cases, add "edge case checklist" to dev task templates
- **Update PM-PROTOCOL.md** — When a new anti-pattern or best practice emerges from reviews, add it to this doc
- **Log lessons in closing report** — Every sprint closing report has a "Lessons Learned" section that feeds forward

> **Sprint Victory Condition:** Both gates pass. QA evaluation ✅ AND PM review complete (all tasks graded). Only then does the PM announce sprint completion.

### Blocking vs Non-Blocking Failures

When the PM Review (Gate 2) finds issues, the PM must classify each:

**🚫 Blocking (Sprint stays open):**
- Task was fundamentally incomplete (major acceptance criteria missed)
- Core deliverable doesn't work as intended
- The gap would make the sprint's goal meaningless if shipped

**For blocking failures:**
1. Do NOT close the sprint
2. Create fix tasks **in the current sprint** (not next sprint)
3. Dispatch immediately to the appropriate worker
4. Re-run both closing gates after fixes land
5. Sprint stays open until all blocking issues are resolved

**⚠️ Non-Blocking (Sprint can close):**
- Minor polish, edge cases, nice-to-haves
- Task met intent but missed a small detail
- Cosmetic issues

**For non-blocking failures:**
1. Create follow-up tasks in the **next sprint's backlog**
2. Note them in the closing report
3. Sprint can close

> **Rule of thumb:** If you'd be embarrassed showing the sprint deliverable to the human with this gap, it's blocking.

---

## Anti-Patterns (Don't Do This)

| ❌ Wrong | ✅ Right |
|----------|---------|
| PM fixes the bug itself without checking roster | PM queries agents, finds worker-dev, spawns them |
| PM says "No agent available" without checking DB | PM queries Supabase `agents` table |
| PM checks `agents_list` (Clawdbot internal) | PM queries Supabase for Mission Control roster |
| PM skips task file, gives instructions verbally | PM writes full task spec to `tasks/TASK-*.md` |
| PM announces spawn without actual tool call | PM calls tool first, confirms with real session ID |
| PM says "I'll check on them shortly" with no mechanism | PM creates a monitoring cron before confirming dispatch |
| PM manually remembers to check agents | Monitoring cron auto-fires every 5 min until done |
| PM declares sprint done when all tasks finish | PM runs both closing gates (QA eval + PM review) first |
| PM skips review for "obvious" tasks | PM reviews every task — no exceptions |
| PM finds a gap but doesn't create follow-up | PM creates follow-up task in next sprint backlog |

---

## AgentRegistry (Current)

| ID | Name | Role | Method | Model | Tier |
|----|------|------|--------|-------|------|
| chhotu | Chhotu | Project Manager | — | opus-4.5 | 🎯 PM |
| cheenu | Cheenu | Project Manager | — | — | 🎯 PM |
| worker-dev | Developer (Senior) | Developer | claude_code | sonnet-4.5 | 💎 Senior |
| worker-dev-mid | Developer (Mid) | Developer | claude_code | sonnet-4 | 🔵 Mid |
| worker-analyst | Product Analyst | Product Analyst | sessions_spawn | sonnet-4 | 🔵 Mid |
| worker-customer | Customer Researcher | Customer Researcher | sessions_spawn | sonnet-4 | 🔵 Mid |
| worker-qa | QA Engineer | QA Engineer | sessions_spawn | sonnet-4 | 🔵 Mid |
| worker-ui-qa | UI QA Engineer | UI QA Engineer | sessions_spawn | sonnet-4 | 🔵 Mid |
| worker-content | Content Writer | Content Writer | sessions_spawn | sonnet-3.5 | 🟢 Standard |
| worker-seo | SEO Analyst | SEO Analyst | sessions_spawn | sonnet-3.5 | 🟢 Standard |
| worker-social | Social Media Manager | Social Media Manager | sessions_spawn | sonnet-3.5 | 🟢 Standard |
| worker-marketing | Email Marketing | Email Marketing | sessions_spawn | sonnet-3.5 | 🟢 Standard |
| worker-research | Researcher | Documentation | sessions_spawn | haiku-3.5 | ⚪ Budget |
| worker-design | Designer | Designer | sessions_spawn | haiku-3.5 | ⚪ Budget |

---

## Sharing This Protocol

This protocol is designed to be **portable**. Any Clawdbot instance acting as PM can follow it:

1. The **AgentRegistry** lives in **Supabase** (not local config) — shared across all PMs
2. Task files use a **standard template** in the project's `tasks/` directory
3. Invocation methods are **self-describing** — the DB tells you how to spawn each agent
4. Any PM reads this doc + queries the DB = ready to dispatch

To share with another Clawdbot PM (e.g., Cheenu):
- They read `PM-PROTOCOL.md` from the shared repo
- They query the same Supabase AgentRegistry
- They follow the same dispatch steps

---

*This is the canonical reference for PM task dispatch in Mission Control.*

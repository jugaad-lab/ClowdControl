# ClowdControl Database Schema

## Tables Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `projects` | Top-level project container with settings, ownership, budget |
| `agents` | Agent registry (PMs and specialists) with capabilities, models, skill levels |
| `sprints` | Sprint phases with acceptance criteria, status |
| `tasks` | Work items with complexity, dependencies, shadowing, review status |

### Authentication & Access

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase auth.users) |
| `project_members` | ACL for project access control |

### Agent Coordination

| Table | Purpose |
|-------|---------|
| `agent_sessions` | Tracks spawned agent sessions (running/completed/failed) |
| `agent_messages` | Inter-agent messaging with ack tracking |
| `task_handoffs` | Task assignment notifications trigger |

### Anti-Groupthink System

| Table | Purpose |
|-------|---------|
| `proposals` | Proposals for decisions requiring multi-agent input |
| `independent_opinions` | Phase 1: Each agent's independent opinion (before seeing others) |
| `critiques` | Phase 2: Cross-agent critiques and concerns |
| `debate_rounds` | Structured debate messages |
| `sycophancy_flags` | Detected groupthink indicators |

### Audit & Activity

| Table | Purpose |
|-------|---------|
| `activity_log` | All entity changes tracked |
| `pm_assignments` | PM assignment history per project |
| `task_dependencies` | Task prerequisite relationships |

## Migration Order

Run migrations in this order in Supabase SQL Editor:

1. `full-schema.sql` — Base tables (projects, agents, sprints, tasks, proposals, etc.)
2. `003_agent_sessions.sql` — Agent session tracking
3. `004_waiting_human_status.sql` — Human escalation status
4. `005_execution_mode.sql` — Execution mode settings
5. `20260202_phase4_skill_budget.sql` — Skill levels, complexity, budgets
6. `20260202_phase5_6_deps_review.sql` — Dependencies, shadowing, review
7. `20260204_auth_system.sql` — Profiles, project_members, RLS policies
8. `20260204_notification_system.sql` — Agent message acks, triggers
9. `20260204_add_discord_user_id.sql` — Discord integration
10. `20260204_fix_rls_circular.sql` — RLS policy fixes
11. `20260205_acceptance_criteria_mandatory.sql` — Acceptance criteria constraint
12. `20260205_fix_rls_remaining.sql` — More RLS fixes
13. `20260206_fix_profiles_and_grants.sql` — Final grants

## Key Columns

### agents

```sql
id TEXT PRIMARY KEY,          -- e.g., 'chhotu', 'cheenu', 'friday-dev'
display_name TEXT,
role TEXT,                    -- 'Project Manager', 'Developer', etc.
mcu_codename TEXT,            -- Fun names: 'Jarvis', 'Friday', 'Shuri'
agent_type TEXT,              -- 'pm' or 'specialist'
capabilities TEXT[],          -- ['coding', 'research', 'writing']
clawdbot_instance TEXT,       -- For PMs: which Clawdbot instance
invocation_method TEXT,       -- 'sessions_spawn' or 'claude_code'
invocation_config JSONB,      -- Model, tools, thinking level
skill_level skill_level,      -- 'junior', 'mid', 'senior', 'lead'
model TEXT,                   -- Full model ID
discord_user_id TEXT          -- For @mentions
```

### tasks

```sql
id UUID PRIMARY KEY,
project_id UUID,
sprint_id UUID,
title TEXT,
description TEXT,
task_type TEXT,               -- 'development', 'research', 'testing', etc.
acceptance_criteria TEXT[],   -- Mandatory!
status TEXT,                  -- 'backlog', 'in_progress', 'review', 'done', etc.
complexity task_complexity,   -- 'simple', 'medium', 'complex', 'critical'
assigned_to TEXT,             -- Agent ID
shadowing shadowing_mode,     -- 'none', 'recommended', 'required'
requires_review BOOLEAN,
review_status review_status,
tokens_consumed INTEGER
```

### projects

```sql
id UUID PRIMARY KEY,
name TEXT,
status TEXT,                  -- 'planning', 'active', 'paused', 'completed'
owner_id UUID,                -- Auth user who owns it
visibility TEXT,              -- 'public', 'private', 'team'
token_budget INTEGER,
tokens_used INTEGER,
settings JSONB                -- execution_mode, sprint_approval, etc.
```

## Row Level Security

- **Enabled on:** projects, tasks, sprints, activity_log, proposals, profiles, project_members
- **NOT enabled on:** agents, agent_sessions, task_handoffs, agent_messages (bots need unrestricted access)

## Realtime

Enable realtime for live updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE sycophancy_flags;
```

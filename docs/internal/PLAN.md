# 🎯 Mission Control — Master Plan

**Last Updated:** Feb 1, 2026 (22:45 PST)
**Status:** Phase 3 Complete, Phase 4 Next

---

## ✅ Completed

### Phase 1: Foundation
| Task | Status | Notes |
|------|--------|-------|
| Supabase project created (`disclawd-ops`) | ✅ Done | |
| Database schema deployed | ✅ Done | All 12 tables |
| 11 agents seeded | ✅ Done | 2 PMs + 9 specialists |
| First project created | ✅ Done | "Mission Control" |
| Basic Next.js dashboard | ✅ Done | Project list + detail |
| Kanban board (drag-drop) | ✅ Done | 5 status columns |
| Supabase client library | ✅ Done | Typed helpers |
| Real-time subscriptions | ✅ Done | Task updates |
| Dark/light mode toggle | ✅ Done | |
| PM tool research | ✅ Done | Linear/Jira/Asana analysis |

### Phase 2: Professional PM Features ✅
| Task | Status | Notes |
|------|--------|-------|
| List View (sortable table) | ✅ Done | Built by Claude Code |
| Command Palette (Cmd+K) | ✅ Done | |
| Quick Filters | ✅ Done | |
| Task Side Panel | ✅ Done | |
| Inline Editing | ✅ Done | |
| Project Progress Bar | ✅ Done | |
| Sprint Planning View | ✅ Done | SprintCard + CreateSprintModal |
| Backlog View | ✅ Done | 15KB component |
| Sprint Burndown Chart | ✅ Done | recharts |
| Velocity Chart | ✅ Done | |
| Sprint Goals Display | ✅ Done | |

*~56KB new React code built in Sprint 2.1 + 2.2*

### Phase 3: Anti-Groupthink Protocol ✅
| Task | Status | Notes |
|------|--------|-------|
| Proposal Creation UI | ✅ Done | |
| Independent Opinion Capture | ✅ Done | |
| Forced Critique Flow | ✅ Done | |
| Debate Round Tracking | ✅ Done | |
| Sycophancy Detection | ✅ Done | lib/sycophancy.ts |
| Escalation Flow | ✅ Done | |

*8 UI components (1,301 lines) + 3 routes (937 lines) + helpers (520 lines)*

---

## 🔄 Next Up — Phase 4: Agent Intelligence & Cost Control

### 4A: Skill Levels & Model Routing

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Add `skill_level` enum to agents (junior/mid/senior/lead) | P0 | 🔲 Todo |
| 2 | Add `model` column to agents | P0 | 🔲 Todo |
| 3 | Assign levels to all 11 agents | P0 | 🔲 Todo |
| 4 | Add `complexity` field to tasks (simple/medium/complex/critical) | P0 | 🔲 Todo |
| 5 | Skill Level Badge UI (agents list + detail) | P1 | 🔲 Todo |
| 6 | Complexity Selector UI (task create/edit) | P1 | 🔲 Todo |
| 7 | Recommended Agent Display (based on complexity match) | P1 | 🔲 Todo |

**How Model Selection Works:**
```
Task Created (complexity: complex)
    ↓
PM queries agents WHERE skill_level >= 'senior'
    ↓
PM spawns agent via sessions_spawn(task, model: agent.model)
    ↓
Agent runs on configured model (sonnet/opus/etc)
```

**Agent Assignments:**
| Agent | Role | Skill Level | Model |
|-------|------|-------------|-------|
| Chhotu | PM Lead | lead | anthropic/claude-opus-4 |
| Cheenu | PM | senior | anthropic/claude-opus-4 |
| Vision | Architect | lead | anthropic/claude-opus-4 |
| Friday | Engineer | senior | anthropic/claude-sonnet-4 |
| Shuri | Analyst | senior | anthropic/claude-sonnet-4 |
| Fury | Security | senior | anthropic/claude-opus-4 |
| Wong | Specialist | mid | anthropic/claude-sonnet-4 |
| Pepper | Ops | mid | anthropic/claude-sonnet-4 |
| Wanda | Creative | mid | anthropic/claude-sonnet-4 |
| Quill | Writer | mid | anthropic/claude-sonnet-4 |
| Loki | Chaos/Test | junior | anthropic/claude-haiku-3 |

### 4B: Token & Resource Budgeting

| # | Task | Priority | Status |
|---|------|----------|--------|
| 8 | Add `token_budget` and `tokens_used` to projects | P0 | 🔲 Todo |
| 9 | Add `tokens_consumed` to tasks (track per-task usage) | P1 | 🔲 Todo |
| 10 | Budget Progress Bar on project page | P1 | 🔲 Todo |
| 11 | Budget Alerts (80%, 95%, 100% thresholds) | P1 | 🔲 Todo |
| 12 | Token Usage Chart in Velocity View | P2 | 🔲 Todo |
| 13 | Cost Calculator (tokens × model rate) | P2 | 🔲 Todo |

**Model Pricing Reference:**
| Model | Input/1M | Output/1M |
|-------|----------|-----------|
| Haiku | $0.25 | $1.25 |
| Sonnet | $3 | $15 |
| Opus | $15 | $75 |

**Acceptance Criteria (Phase 4):**
- [ ] agents table has skill_level + model columns
- [ ] tasks table has complexity field
- [ ] projects table has token_budget + tokens_used
- [ ] UI shows skill badges on agents
- [ ] UI shows complexity selector on tasks
- [ ] UI shows budget progress on projects
- [ ] Velocity view includes token chart

---

## 📋 Planned — Phase 5: Dependencies & Visualization

| # | Task | Priority | Status |
|---|------|----------|--------|
| 14 | **Task Dependencies** — blocked_by/blocks relationships | P1 | 🔲 Todo |
| 15 | **Dependency Graph View** — Visual node graph | P1 | 🔲 Todo |
| 16 | **Gantt/Timeline View** — Tasks on timeline with deps | P1 | 🔲 Todo |
| 17 | **Critical Path Highlighting** — Show longest chain | P1 | 🔲 Todo |
| 18 | **Calendar View** — Due dates visualization | P2 | 🔲 Todo |
| 19 | **Roadmap View** — Multi-project timeline | P2 | 🔲 Todo |

### Human Shadowing Mode

| # | Task | Priority | Status |
|---|------|----------|--------|
| 20 | Add `shadowing` field to tasks (none/recommended/required) | P1 | 🔲 Todo |
| 21 | Shadowing Badge UI on task cards | P1 | 🔲 Todo |
| 22 | Alert humans when required-shadowing task starts | P1 | 🔲 Todo |
| 23 | Live task execution log for shadowed tasks | P2 | 🔲 Todo |

**Acceptance Criteria (Phase 5):**
- [ ] Tasks can have blocked_by relationships
- [ ] Dependency graph renders with interactive nodes
- [ ] Gantt view shows task bars with dependency arrows
- [ ] Critical path tasks are highlighted
- [ ] Shadowing mode alerts humans appropriately

---

## 📋 Planned — Phase 6: Quality & Review

### Peer Review Workflow

| # | Task | Priority | Status |
|---|------|----------|--------|
| 24 | Add `requires_review` flag (auto-set if complexity >= complex) | P1 | 🔲 Todo |
| 25 | Add `reviewer_id` field to tasks | P1 | 🔲 Todo |
| 26 | Review Queue View (tasks pending review) | P1 | 🔲 Todo |
| 27 | Review Status Badge (pending/approved/changes_requested) | P1 | 🔲 Todo |

### Conflict Resolution Dashboard

| # | Task | Priority | Status |
|---|------|----------|--------|
| 28 | Debate History View (all PM debates) | P1 | 🔲 Todo |
| 29 | Outcome Tagging (manual: worked/didn't work) | P2 | 🔲 Todo |
| 30 | PM Track Record Display | P2 | 🔲 Todo |
| 31 | Interactive Human Opinion Request | P2 | 🔲 Todo |

**Acceptance Criteria (Phase 6):**
- [ ] Complex tasks auto-flag for review
- [ ] Review queue shows pending reviews
- [ ] Debate history viewable with outcomes
- [ ] Humans can tag debate outcomes

---

## 📋 Planned — Phase 7: Agent Integration

| # | Task | Priority | Status |
|---|------|----------|--------|
| 32 | **Clawdbot → Supabase Client** — Read/write from bots | P1 | 🔲 Todo |
| 33 | **PM Heartbeat Cron** — 30-min project check-ins | P1 | 🔲 Todo |
| 34 | **Worker Spawning with Model** — Pass model from agent config | P1 | 🔲 Todo |
| 35 | **Activity Logging** — Auto-log all agent actions | P1 | 🔲 Todo |
| 36 | **Discord Notifications** — Key events to channel | P2 | 🔲 Todo |
| 37 | **Escalation Flow** — Junior stuck → escalate to senior | P2 | 🔲 Todo |

---

## 📋 Backlog — Future Enhancements

| Task | Priority | Notes |
|------|----------|-------|
| **Discord Server Template** | P2 | Export after completion for easy replication |
| GitHub Copilot as reviewer | P3 | External integration, defer |
| Auto-correctness tracking for debates | P3 | Needs outcome data |
| Custom fields per project | P3 | |
| Goals/OKRs tracking | P3 | |
| AI task summaries | P3 | |
| Automation rules (if-this-then-that) | P3 | |
| Time tracking (estimates vs actuals) | P3 | |
| Mobile responsive polish | P3 | |
| Export to CSV/PDF | P3 | |

---

## 🗓️ Timeline Overview

```
Week 1 (Done):     Foundation — DB, basic dashboard, research
Week 2 (Done):     Phase 2 + 3 — All PM features + Anti-groupthink (crushed it!)
Week 3 (Current):  Phase 4 — Agent skill levels, model routing, token budgeting
Week 4:            Phase 5 — Dependencies, Gantt, human shadowing
Week 5:            Phase 6 — Peer review, conflict resolution dashboard
Week 6:            Phase 7 — Agent integration, crons, notifications
Week 7:            Polish + Discord Template
```

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Projects created | 5+ | 1 |
| Tasks managed | 50+ | 5 |
| Sprints completed | 3+ | 0 |
| Agent actions logged | 100+ | 0 |
| Sycophancy flags reviewed | Track | N/A |

---

## 🔧 Technical Stack

| Layer | Technology |
|-------|------------|
| Database | Supabase (PostgreSQL) |
| Frontend | Next.js 16 + React 19 |
| Styling | Tailwind CSS |
| Components | shadcn/ui (to add) |
| Command Palette | cmdk |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Real-time | Supabase Realtime |
| Hosting | Vercel (planned) |

---

## 📁 Project Structure

```
~/workspace/projects/mission-control/
├── PLAN.md                    # This file
├── .env                       # Supabase credentials
├── supabase/
│   └── schema.sql            # Database schema
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Dashboard home
│   │   │   └── projects/[id]/ # Project detail
│   │   └── lib/
│   │       ├── supabase.ts   # DB client
│   │       └── hooks.ts      # React hooks
│   └── package.json
└── research/
    └── PM-TOOL-ANALYSIS.md   # PM tool research
```

---

## ⚡ Immediate Next Action

**Phase 4:** Add Agent Skill Levels & Task Routing

1. Add `skill_level` and `model` columns to agents table (Supabase migration)
2. Assign skill levels to all 11 agents
3. Add `complexity` field to tasks table
4. Build UI to display agent skill levels
5. Implement routing logic: task complexity → agent skill match

---

*This plan is the single source of truth for Mission Control development.*

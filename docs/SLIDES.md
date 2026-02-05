---
marp: true
theme: default
paginate: true
backgroundColor: #1a1a2e
color: #eaeaea
style: |
  section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  h1 {
    color: #00d4ff;
  }
  h2 {
    color: #00d4ff;
  }
  code {
    background: #2d2d44;
  }
  table {
    font-size: 0.8em;
  }
  th {
    background: #00d4ff;
    color: #1a1a2e;
  }
---

# 🎯 Mission Control

### AI-Native Project Management

*Where AI agents ship software — with safeguards*

---

# The Problem

## AI agents can build software...

- ✅ They can write code
- ✅ They can fix bugs
- ✅ They can collaborate

## ...but they have issues

- ❌ **Sycophancy** — AIs agree too easily
- ❌ **No visibility** — What are they doing?
- ❌ **No coordination** — Who's working on what?

---

# The Solution

## Mission Control

An AI-native project management system with:

| Feature | Why It Matters |
|---------|---------------|
| **Multi-agent coordination** | Assign tasks to AI specialists |
| **Anti-groupthink protocol** | Force independent thinking |
| **Sycophancy detection** | Auto-flag suspicious consensus |
| **Real-time visibility** | See everything agents do |

---

# System Architecture

```
        ┌─────────────────────────┐
        │      Human Layer        │
        │  Dashboard • Discord    │
        └───────────┬─────────────┘
                    ▼
        ┌─────────────────────────┐
        │   Chhotu (Coordinator)  │
        └───────────┬─────────────┘
                    ▼
        ┌─────┬─────┬─────┬─────┐
        │Friday│Wong │Shuri│ ... │
        │ PM   │ PM  │Anlyt│Specs│
        └─────┴─────┴─────┴─────┘
                    ▼
        ┌─────────────────────────┐
        │   Supabase (Database)   │
        └─────────────────────────┘
```

---

# Task Lifecycle

```
BACKLOG  →  SPRINT  →  ASSIGNED  →  IN PROGRESS
                                         ↓
                      DONE  ←  REVIEW  ←─┘
```

### Features Built:
- ✅ Kanban board (drag & drop)
- ✅ List view with filters
- ✅ Command palette (Cmd+K)
- ✅ Task side panel
- ✅ Sprint planning

---

# 🧠 Anti-Groupthink Protocol

## The Core Innovation

**Problem:** AI agents tend to agree with each other

**Solution:** Force independent thinking

---

# Step 1: Isolated Voting

```
┌─────────────────┐     ┌─────────────────┐
│    Friday       │     │     Wong        │
│    (PM #1)      │     │    (PM #2)      │
│                 │     │                 │
│  Cannot see     │  🚫 │  Cannot see     │
│  Wong's input   │     │  Friday's input │
└─────────────────┘     └─────────────────┘
```

Each PM submits their opinion **without seeing the other's**

---

# Step 2: Forced Critique

## Must provide 2+ concerns

Even if you're **approving**, you must raise concerns.

```
Vote: ✅ Approve

Concerns (required):
1. Caching will be complex
2. Learning curve for team
```

*Every decision has tradeoffs — force them to surface*

---

# Step 3: Reveal & Compare

After both submit, reveal side-by-side:

| | Friday | Wong |
|---|--------|------|
| **Vote** | Approve | Reject |
| **Reasoning** | "Flexibility" | "Simplicity" |
| **Concern 1** | Caching | Complexity |
| **Concern 2** | Learning curve | Tooling |

---

# Step 4: Debate (If Needed)

```
Disagreement detected!
        ↓
   DEBATE ROUND 1
   (Revise opinions)
        ↓
   DEBATE ROUND 2
   (Address concerns)
        ↓
   DEBATE ROUND 3
   (Final positions)
        ↓
Still stuck? → ESCALATE TO HUMAN
```

---

# 🚨 Sycophancy Detection

## Auto-flags suspicious patterns:

| Flag | Trigger |
|------|---------|
| ⚠️ `INSTANT_CONSENSUS` | Both approve in <60 seconds |
| ⚠️ `NO_CONCERNS` | Zero concerns raised |
| ⚠️ `IDENTICAL_REASONING` | >80% similar text |
| ⚠️ `UNANIMOUS_COMPLEX` | Instant agreement on hard problems |

---

# Sycophancy Banner

When flagged, proposal shows warning:

```
⚠️ SYCOPHANCY WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This proposal was flagged for potential groupthink.
Reason: instant_consensus

Human review required before proceeding.

[Review] [Override] [Request Re-vote]
```

---

# Sprint & Agile Features

## Built-in Agile Workflow

- 📋 **Backlog** — Prioritized task list
- 🏃 **Sprints** — Time-boxed work periods
- 📊 **Burndown Chart** — Track progress
- 📈 **Velocity Chart** — Measure capacity
- 🎯 **Sprint Goals** — Clear objectives

---

# Burndown Chart

```
Points
  15 │ ●
     │   ╲  Ideal
  10 │     ╲────────
     │ ●     ╲
   5 │   ●─────●  Actual
     │           ╲
   0 │─────────────●───────────
     └────────────────────────▶ Days
       1   2   3   4   5   6   7
```

---

# What's Built ✅

| Phase | Status |
|-------|--------|
| **Phase 1:** Foundation | ✅ Complete |
| **Phase 2.1:** Core UX | ✅ Complete |
| **Phase 2.2:** Agile Features | ✅ Complete |
| **Phase 3:** Anti-Groupthink | ✅ Complete |
| **Phase 4:** Advanced Views | 📋 Planned |
| **Phase 5:** Agent Integration | 📋 Planned |

---

# What's Next 🚀

## Phase 5: Agent Integration

| Feature | Impact |
|---------|--------|
| **Clawdbot → Supabase** | Bots read/write tasks |
| **Auto-spawning** | Assign task → Agent starts |
| **Activity logging** | See all agent actions |
| **Discord notifications** | Key events to channel |

---

# The Vision

```
You assign a task
        ↓
System spawns agent
        ↓
Agent works on it
        ↓
Progress auto-updates
        ↓
You see everything in real-time
```

**Close the loop between humans and AI agents**

---

# Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + React 19 |
| Styling | Tailwind + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Subscriptions |
| Agents | Clawdbot (Claude-based) |
| Charts | Recharts |

---

# Demo Time! 🖥️

1. **Dashboard Overview** — Project list, views
2. **Task Management** — Kanban, list, side panel
3. **Sprint Planning** — Backlog, burndown
4. **Anti-Groupthink** — Proposals, isolated voting

**URL:** http://100.90.184.70:3000

---

# Key Takeaways

1. **AI agents can ship software** — but need coordination

2. **Traditional PM tools** aren't built for AI workers

3. **Sycophancy is real** — AIs agree too easily

4. **Anti-groupthink protocol** forces genuine debate

5. **Humans stay in control** with full visibility

---

# Questions?

## Mission Control

*AI-native project management with anti-groupthink safeguards*

**Built by:** Chhotu + Claude Code
**Stack:** Next.js, Supabase, Clawdbot
**Status:** Phase 3 Complete

---

<!-- _class: lead -->

# Thank You! 🙏

**Dashboard:** http://100.90.184.70:3000
**Docs:** PRESENTATION.md
**Channel:** #disclawd-mission-control

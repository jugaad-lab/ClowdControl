# [TARGET] Mission Control — Presentation Guide

## Executive Summary
**Mission Control** is an AI-native project management system where multiple AI agents collaborate to ship software — with built-in safeguards against AI groupthink and sycophancy.

---

## [BUILD] System Architecture

```
+-----------------------------------------------------------------+
|                         HUMAN LAYER                             |
|  +--------------+    +--------------+    +--------------+      |
|  |   Dashboard  |    |   Discord    |    |    Slack     |      |
|  |   (Next.js)  |    |   Channel    |    |   (Future)   |      |
|  +------+-------+    +------+-------+    +--------------+      |
+---------+-------------------+----------------------------------+
          |                   |
          v                   v
+-----------------------------------------------------------------+
|                      COORDINATION LAYER                         |
|                                                                 |
|  +---------------------------------------------------------+   |
|  |                    Chhotu (Coordinator)                  |   |
|  |  • Receives task assignments                            |   |
|  |  • Spawns specialist agents                             |   |
|  |  • Monitors progress                                    |   |
|  |  • Updates status                                       |   |
|  +---------------------------------------------------------+   |
|                              |                                  |
|         +--------------------+--------------------+            |
|         v                    v                    v            |
|  +------------+      +------------+       +------------+       |
|  |  Friday    |      |   Wong     |       |   Shuri    |       |
|  | (PM #1)    |      |  (PM #2)   |       | (Analyst)  |       |
|  +------------+      +------------+       +------------+       |
|         |                    |                    |            |
|         +--------------------+--------------------+            |
|                              v                                  |
|  +---------------------------------------------------------+   |
|  |              SPECIALIST AGENTS                           |   |
|  |  Vision(SEO) • Loki(Content) • Wanda(Design) • etc.     |   |
|  +---------------------------------------------------------+   |
+-----------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------+
|                        DATA LAYER                               |
|  +---------------------------------------------------------+   |
|  |                    Supabase (PostgreSQL)                 |   |
|  |  • Projects, Tasks, Sprints                             |   |
|  |  • Proposals, Opinions, Debates                         |   |
|  |  • Activity Logs                                        |   |
|  |  • Real-time Subscriptions                              |   |
|  +---------------------------------------------------------+   |
+-----------------------------------------------------------------+
```

---

## [TASKS] Flow 1: Task Lifecycle

```
+--------------+
|  Human/PM    |
| Creates Task |
+------+-------+
       |
       v
+--------------+     +--------------+
|   BACKLOG    |---->|   SPRINT     |
|  (Unsorted)  |     |  (Planned)   |
+--------------+     +------+-------+
                            |
                            v
                     +--------------+
                     |  ASSIGNED    |
                     |  to Agent    |
                     +------+-------+
                            |
            +---------------+---------------+
            v               v               v
     +------------+  +------------+  +------------+
     | IN PROGRESS|  |  BLOCKED   |  |   REVIEW   |
     |  (Working) |  |  (Stuck)   |  |  (PR Open) |
     +-----+------+  +------------+  +-----+------+
           |                               |
           +---------------+---------------+
                           v
                    +--------------+
                    |     DONE     |
                    |  (Shipped!)  |
                    +--------------+
```

**Demo Points:**
- Show Kanban board with drag-drop between columns
- Show List View with filters and sorting
- Click task -> Side panel opens with details
- Cmd+K -> Command palette for quick actions

---

## [BRAIN] Flow 2: Anti-Groupthink Protocol

**The Problem:** AI agents tend to agree with each other (sycophancy), leading to poor decisions.

**The Solution:** Forced independent thinking + mandatory critique.

```
+-----------------------------------------------------------------+
|                    PROPOSAL CREATED                             |
|            "Should we use GraphQL or REST?"                     |
+-----------------------------------------------------------------+
                              |
                              v
+-----------------------------------------------------------------+
|                  ISOLATED OPINION PHASE                         |
|  +-----------------+              +-----------------+          |
|  |    Friday       |              |     Wong        |          |
|  |   (PM #1)       |              |    (PM #2)      |          |
|  |                 |   ISOLATED   |                 |          |
|  |  Cannot see     |<------------>|  Cannot see     |          |
|  |  Wong's input   |              |  Friday's input |          |
|  |                 |              |                 |          |
|  | Vote: Approve   |              | Vote: Reject    |          |
|  | Concerns:       |              | Concerns:       |          |
|  | • Caching       |              | • Complexity    |          |
|  | • Learning curve|              | • Tooling       |          |
|  +-----------------+              +-----------------+          |
|                                                                 |
|  [WARN] MUST provide 2+ concerns even if approving!                |
+-----------------------------------------------------------------+
                              |
                              v
+-----------------------------------------------------------------+
|                      REVEAL PHASE                               |
|                                                                 |
|  +---------------------------------------------------------+   |
|  |              Side-by-Side Comparison                     |   |
|  |  Friday: Approve          |  Wong: Reject               |   |
|  |  "GraphQL flexibility"    |  "REST is simpler"          |   |
|  +---------------------------------------------------------+   |
|                                                                 |
|  +---------------------------------------------------------+   |
|  |              Concerns Matrix                             |   |
|  |  Concern          | Friday | Wong |                      |   |
|  |  -----------------+--------+------|                      |   |
|  |  Caching issues   |   [x]    |      |                      |   |
|  |  Learning curve   |   [x]    |      |                      |   |
|  |  Complexity       |        |  [x]   |                      |   |
|  |  Tooling gaps     |        |  [x]   |                      |   |
|  +---------------------------------------------------------+   |
+-----------------------------------------------------------------+
                              |
              +---------------+---------------+
              v                               v
+----------------------+        +----------------------+
|   CONSENSUS REACHED  |        |    DISAGREEMENT      |
|   (Both agree)       |        |    (Debate needed)   |
+----------------------+        +----------+-----------+
                                           |
                                           v
                           +---------------------------+
                           |      DEBATE ROUNDS        |
                           |      (Max 3 rounds)       |
                           |                           |
                           |  Round 1: Revise opinions |
                           |  Round 2: Address concerns|
                           |  Round 3: Final positions |
                           +-------------+-------------+
                                         |
                         +---------------+---------------+
                         v                               v
              +------------------+            +------------------+
              |    RESOLVED      |            |    ESCALATED     |
              |  (Agreement)     |            |   (To Human)     |
              +------------------+            +------------------+
```

**Demo Points:**
- Show proposal creation modal
- Explain isolated input (can't see other opinions)
- Show 2+ concerns requirement
- Show reveal view with side-by-side comparison
- Show sycophancy banner (auto-detection)

---

## [ALERT] Flow 3: Sycophancy Detection

```
+-----------------------------------------------------------------+
|                   AUTOMATIC FLAGS TRIGGERED                     |
+-----------------------------------------------------------------+

    [WARN] Flag: INSTANT_CONSENSUS
    +---------------------------------------------------------+
    | Both PMs approved within 60 seconds                     |
    | -> Suspiciously fast for complex decision                |
    +---------------------------------------------------------+

    [WARN] Flag: NO_CONCERNS
    +---------------------------------------------------------+
    | Zero concerns raised across all opinions                |
    | -> Every decision has tradeoffs                          |
    +---------------------------------------------------------+

    [WARN] Flag: IDENTICAL_REASONING
    +---------------------------------------------------------+
    | Reasoning text is >80% similar                          |
    | -> Agents may be echoing each other                      |
    +---------------------------------------------------------+

    [WARN] Flag: UNANIMOUS_COMPLEX
    +---------------------------------------------------------+
    | Instant unanimous agreement on complex topic            |
    | -> Complex decisions should have debate                  |
    +---------------------------------------------------------+

                              |
                              v
+-----------------------------------------------------------------+
|                                                                 |
|  [WARN] SYCOPHANCY WARNING                                         |
|  ===========================================================  |
|  This proposal was flagged for potential groupthink.           |
|  Reason: instant_consensus                                     |
|                                                                 |
|  Human review required before proceeding.                      |
|                                                                 |
|  [Review] [Override] [Request Re-vote]                         |
|                                                                 |
+-----------------------------------------------------------------+
```

**Demo Points:**
- Show the sycophancy banner component
- Explain why this matters (AI safety)
- Show escalation queue for human review

---

## [CHART] Flow 4: Sprint & Agile

```
+-----------------------------------------------------------------+
|                      SPRINT PLANNING                            |
|                                                                 |
|  +-----------------+         +-----------------------------+   |
|  |    BACKLOG      |         |      SPRINT 2.2             |   |
|  |                 |         |   Feb 1 - Feb 14            |   |
|  |  □ Task A (3pt) | ------> |                             |   |
|  |  □ Task B (5pt) |  drag   |   ☑ Task A (3pt)           |   |
|  |  □ Task C (2pt) |         |   ☑ Task B (5pt)           |   |
|  |  □ Task D (8pt) |         |                             |   |
|  |                 |         |   Capacity: 15pt            |   |
|  |                 |         |   Committed: 8pt            |   |
|  +-----------------+         +-----------------------------+   |
+-----------------------------------------------------------------+

+-----------------------------------------------------------------+
|                    BURNDOWN CHART                               |
|                                                                 |
|  Points |                                                       |
|    15   | *                                                     |
|         |   \  Ideal                                           |
|    10   |     \--------                                        |
|         | *     \                                              |
|     5   |   *-----*  Actual                                    |
|         |           \                                          |
|     0   |-------------*-------------------------               |
|         +--------------------------------------> Days          |
|           1   2   3   4   5   6   7   8   9  10                |
+-----------------------------------------------------------------+

+-----------------------------------------------------------------+
|                    VELOCITY CHART                               |
|                                                                 |
|  Points |                                                       |
|    20   |                         +---+                        |
|         |             +---+       |   |                        |
|    15   |   +---+     |   |       |   |  ------ Avg: 16       |
|         |   |   |     |   |       |   |                        |
|    10   |   |   |     |   |       |   |                        |
|         |   |   |     |   |       |   |                        |
|     0   |---+---+-----+---+-------+---+---->                   |
|         Sprint 1  Sprint 2  Sprint 3                           |
+-----------------------------------------------------------------+
```

**Demo Points:**
- Show sprint planning page
- Drag tasks from backlog to sprint
- Show burndown chart (tracks progress)
- Show velocity chart (team capacity)
- Show sprint goals display

---

## [TARGET] Key Talking Points

### 1. Why This Matters
- **AI agents can ship software** — but need coordination
- **Traditional PM tools** aren't designed for AI workers
- **Sycophancy is a real problem** — AIs agree too easily
- **Humans need visibility** — can't just trust AI decisions

### 2. What's Different
| Traditional PM | Mission Control |
|----------------|-----------------|
| Human assignees | AI agent assignees |
| Manual status updates | Auto-updates from agent activity |
| No decision audit | Full proposal/debate trail |
| Trust by default | Verify with anti-groupthink |

### 3. The Tech Stack
- **Frontend:** Next.js 16, React 19, Tailwind, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Agents:** Clawdbot (Claude-based)
- **Charts:** Recharts

### 4. What's Built (Today)
- [DONE] Project/Task management (Kanban + List views)
- [DONE] Sprint planning with burndown/velocity
- [DONE] Anti-groupthink proposal system
- [DONE] Sycophancy detection
- [DONE] Real-time updates
- [WAIT] Agent integration (Phase 5)

### 5. What's Next
1. **Agent Integration** — Bots can read/write tasks
2. **Auto-spawning** — Assign task -> agent starts working
3. **Activity logging** — See what every agent did
4. **Discord notifications** — Key events posted to channel
5. **Cloudflare hosting** — Access from anywhere

---

## 🖥️ Demo Script

### Scene 1: Dashboard Overview (2 min)
1. Open dashboard at `http://100.90.184.70:3000`
2. Show project list
3. Click into "Mission Control" project
4. Toggle between Kanban and List views
5. Use Cmd+K to show command palette
6. Filter by status/assignee

### Scene 2: Task Management (2 min)
1. Click a task -> side panel opens
2. Show task details, comments, activity
3. Drag task between columns
4. Show inline editing

### Scene 3: Sprint Planning (2 min)
1. Navigate to Sprints page
2. Show sprint cards with goals
3. Open backlog view
4. Drag task to sprint
5. Show burndown and velocity charts

### Scene 4: Anti-Groupthink (3 min)
1. Navigate to Proposals
2. Create new proposal
3. Explain isolated voting
4. Show 2+ concerns requirement
5. Show reveal view with comparison
6. Show sycophancy detection banner
7. Explain escalation flow

### Scene 5: Future Vision (1 min)
1. Explain Phase 5 integration
2. "Assign task -> Agent auto-starts"
3. "Everything tracked, nothing hidden"

---

## 📱 Screenshots to Capture
1. Dashboard home with project cards
2. Kanban board with tasks
3. List view with filters active
4. Task side panel
5. Command palette open
6. Sprint planning page
7. Burndown chart
8. Velocity chart
9. Proposal creation modal
10. Opinion submission form (show concerns requirement)
11. Reveal view with side-by-side
12. Sycophancy warning banner

---

*Created: Feb 1, 2026 | Mission Control v1.0*

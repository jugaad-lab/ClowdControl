# Multi-Agent Collaboration Analysis Report

**Date:** February 4, 2026  
**Author:** Chhotu (PM)  
**Purpose:** Comprehensive gap analysis for multi-agent collaboration with Cheenu, prioritized task recommendations for Sprint 11+

---

## 1. Current State — What Works Today

### ✅ Shared Infrastructure
- **Supabase backend** — single source of truth for projects, tasks, sprints, agents
- **13 workers** in roster — all role-based, shared between PMs
- **PM-PROTOCOL v1.2** — portable, any PM can follow the same dispatch protocol
- **AgentComms tables** — `task_handoffs` + `agent_messages` exist, trigger fires on INSERT

### ✅ Proven Capabilities
- **Cross-agent handoff** — Chhotu ↔ Cheenu round-trip proven (10 handoffs, all completed)
- **3-layer notification** — DB trigger (Layer 1), mandatory ack (Layer 2), watchdog (Layer 3)
- **Worker dispatch** — Both PMs can dispatch to shared worker pool
- **Mastery agents** — Installed at `~/.claude/agents/`, wired into dispatch protocol
- **Sprint lifecycle** — Create → dispatch → monitor → QA → PM Review → close (Sprint 10 proved this)

### ✅ Documentation
- PM-PROTOCOL.md — dispatch, monitoring, closing gates, multi-PM rules
- LESSONS-LEARNED.md — 10+ real-world failure patterns documented
- TRIBES-DESIGN.md — future vision for cross-Clawdbot collaboration
- AUTH-PLAN.md — detailed Supabase Auth + RLS plan

---

## 2. Gaps — What's Broken or Missing

### 🔴 Critical (Blocks publishing / multi-agent autonomy)

#### Gap 1: No Authentication
- **Impact:** Anyone can see all projects. DpuDebugAgent visible to Nag/Cheenu.
- **Current:** Zero auth. Dashboard is wide open.
- **Fix:** Sprint 11 Auth tasks (6 tasks, ~18 hours). Schema + RLS + login UI + middleware.
- **Blocks:** Publishing, project privacy, user-specific views.

#### Gap 2: Notification Routing Broken
- **Impact:** All project notifications go to #disclawd-mission-control regardless of project.
- **Current:** Webhook hardcoded to one channel. `notify_channel` field exists but unused. Bot API routing attempt broke Integration Infra (reverted).
- **Fix:** Properly implement channel routing — webhook must read `notify_channel` from project settings. Need to handle: webhook-per-channel OR bot API with correct token scoping.
- **Blocks:** Multi-project isolation, Cheenu's projects cluttering our channel.

#### Gap 3: No Push Notifications to Agents
- **Impact:** AgentComms messages sit in Supabase until polled. 4 messages currently unread/unacked.
- **Current:** Polling-only. Agent must check `agent_messages WHERE to_agent = X AND read = false`. No guaranteed delivery time.
- **Fix:** One of: (a) Supabase Realtime subscription, (b) Webhook callback to receiving Clawdbot, (c) Discord @mention as notification channel.
- **Blocks:** Real-time cross-PM task delegation. Cheenu can't be triggered instantly.

#### Gap 4: Cheenu Can't Spawn Claude Code Workers
- **Impact:** Cheenu can `sessions_spawn` but can't use Claude Code (needs local install + RAM).
- **Current:** Claude Code only runs on Yajat's Mac mini. Cheenu's machine status unknown.
- **Fix:** Either (a) install Claude Code on Cheenu's machine, or (b) use AgentComms handoff to request Chhotu spawn Claude Code on their behalf.
- **Blocks:** Cheenu dispatching development workers independently.

### 🟡 Important (Degrades experience, not blocking)

#### Gap 5: No Agent Discord IDs for @mentions
- **Impact:** Notifications can't @mention the right PM.
- **Current:** `agents` table has no `discord_user_id` field.
- **Fix:** Add field, populate for Chhotu + Cheenu + Yajat. Notifications include @mention.

#### Gap 6: Worker Profiles Missing Acceptance Criteria
- **Impact:** PM Review found multiple tasks with `acceptance_criteria: null`. Workers can't self-verify.
- **Current:** 27/27 Sprint 10 tasks had null acceptance criteria in Supabase.
- **Fix:** Make acceptance_criteria mandatory on task creation. PM dispatch protocol should refuse to create tasks without them.

#### Gap 7: No Budget Enforcement
- **Impact:** Workers can burn unlimited tokens with no guardrails.
- **Current:** Budget tracking exists (cost calculator, predictions) but no enforcement — nothing stops a worker from exceeding budget.
- **Fix:** Add pre-dispatch budget check. If sprint is over budget, require human approval.

#### Gap 8: Cron Cleanup Needed
- **Impact:** 30+ crons running, many are one-shot (Feb 1, Feb 2, Feb 3) that will never fire again.
- **Current:** Old dream-team-check crons, overnight sprint crons, prediction-wars cron all still enabled.
- **Fix:** Audit and disable/delete expired crons. Add auto-expiry for one-shot crons.

### 🟢 Nice to Have (Future sprints)

#### Gap 9: No Tribes Implementation
- Design doc exists (TRIBES-DESIGN.md) but zero code.
- Requires: shared skill registry, trust framework, cross-Clawdbot messaging.
- Estimated: 2-3 sprints of work.

#### Gap 10: No Audit Log for Auth Actions
- Who accessed what, when. Important for security but not MVP.

#### Gap 11: No OAuth (Google/GitHub Login)
- Email/password is fine for 3 users. OAuth needed at scale.

---

## 3. Prioritized Task Recommendations

### Sprint 11 — Must Ship (Publishing Deadline)

| # | Task | Priority | Type | Depends On | Est Hours |
|---|------|----------|------|-----------|-----------|
| 1 | Auth: Schema migration (profiles, project_members, owner_id, visibility) | P1 | dev | — | 2 |
| 2 | Auth: RLS policies for all tables | P1 | dev | #1 | 3 |
| 3 | Auth: Dashboard login UI (LoginPage, AuthProvider, ProtectedRoute) | P1 | dev | #1 | 4 |
| 4 | Auth: Next.js middleware for session refresh + route protection | P1 | dev | #3 | 2 |
| 5 | Auth: Migration script (create accounts, set ownership) | P1 | dev | #1, #2 | 1 |
| 6 | Auth: UserMenu + logout | P2 | dev | #3 | 1 |
| 7 | Auth: Project settings (visibility + members) | P2 | dev | #1, #3 | 3 |
| 8 | Auth QA: Verify RLS works per role | P1 | test | #1-#5 | 2 |
| 9 | Fix notification routing (notify_channel per project) | P1 | dev | — | 3 |
| 10 | Add discord_user_id to agents + @mention in notifications | P2 | dev | #9 | 1 |
| 11 | Cron cleanup — disable expired one-shot crons | P2 | ops | — | 0.5 |
| 12 | Make acceptance_criteria mandatory on task creation | P2 | dev | — | 1 |

**Sprint 11 Total: ~23.5 hours**

### Sprint 12 — Multi-Agent Autonomy

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | AgentComms push notifications (Supabase Realtime or webhook) | P1 | Enables real-time cross-PM triggering |
| 2 | Cross-Clawdbot task assignment protocol | P1 | Already in Sprint 11 backlog |
| 3 | Budget enforcement (pre-dispatch check) | P2 | Prevents runaway token spend |
| 4 | MC QA validation suite (onboarding health check) | P2 | Already in Sprint 11 backlog |
| 5 | Skill security audit checklist | P2 | Already in Sprint 11 backlog |

### Sprint 13+ — Tribes & Scale

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Tribes MVP — shared skills, resources, trust | P1 | From TRIBES-DESIGN.md |
| 2 | Supabase expansion (queues, messaging, blob) | P1 | Infrastructure for Tribes |
| 3 | OAuth login (Google/GitHub) | P2 | Scale beyond 3 users |
| 4 | Audit log for auth actions | P3 | Security hardening |

---

## 4. Dependency Graph

```
Sprint 11 (Publishing):
  Auth Schema (#1) ──→ RLS (#2) ──→ Migration (#5) ──→ QA (#8)
       │                                                    ↑
       └──→ Login UI (#3) ──→ Middleware (#4) ──→ UserMenu (#6)
                    │
                    └──→ Project Settings (#7)
  
  Notify Routing (#9) ──→ @Mentions (#10)
  
  Cron Cleanup (#11)  [independent]
  Acceptance Criteria (#12)  [independent]

Sprint 12 (Autonomy):
  Push Notifications ──→ Cross-Clawdbot Assignment
  Budget Enforcement  [independent]
  QA Suite  [independent]
```

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth takes longer than estimated | Medium | High | Start with schema + RLS first, UI can be basic |
| Notification routing breaks again | High | Medium | Test in staging channel first, not production |
| Cheenu blocked without Claude Code | Medium | High | Fall back to sessions_spawn for dev tasks |
| RAM pressure kills workers (16GB Mac mini) | High | Medium | Close browsers, prefer sessions_spawn over Claude Code |
| RLS policies lock out agents | Medium | High | Service role key bypasses RLS — agents unaffected |
| Tribes scope creep | High | Medium | Defer to Sprint 13+, focus on auth first |

---

## 6. Recommendations

1. **Sprint 11 focus: Auth + Notification Routing.** Everything else is secondary. Publishing deadline means users need to see only their projects.

2. **Don't attempt Tribes in Sprint 11.** The design doc is great but it's 2-3 sprints of work. Auth is the MVP gate.

3. **Use Discord as the notification bridge** until AgentComms push is built. It's reliable, both bots are connected, and @mentions work today.

4. **Prefer sessions_spawn over Claude Code** for worker dispatch. Saves RAM, avoids SIGKILL, runs server-side. Only use Claude Code for tasks that genuinely need filesystem access.

5. **Clean up crons immediately.** 30+ crons running, half are expired. Each one burns context on heartbeat cycles.

6. **Make acceptance_criteria non-nullable.** Sprint 10 had 27/27 tasks with null criteria. Workers can't self-verify, PM Review becomes harder.

---

*Report generated by Chhotu (PM) — February 4, 2026*

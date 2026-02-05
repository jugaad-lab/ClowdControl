# PM Delegation Skill

**Purpose:** Enforce delegation-first workflow for PM agents. Stop PMs from doing specialist work directly.

**Problem:** PM agents (Cheenu, Chhotu) instinctively execute tasks themselves instead of delegating to specialist workers (friday-dev, fury, hawkeye, etc.).

**Solution:** Decision tree + automated worker matching before claiming any task.

---

## Core Principle

**PMs coordinate. Specialists execute.**

If the work requires deep expertise (coding, design, research, testing), delegate it. If it's coordination, planning, review, or communication, do it yourself.

---

## Decision Tree: Before Claiming ANY Task

### Step 1: Classify the Work

**PM Work (DO IT YOURSELF):**
- Project planning & roadmapping
- Sprint planning & retrospectives
- Task prioritization & backlog grooming
- Stakeholder communication
- Code/design/deliverable review
- Unblocking workers
- Human escalations
- Cross-team coordination

**Specialist Work (DELEGATE):**
- `development` → delegate to worker-dev (friday-dev)
- `testing` → delegate to worker-qa (hawkeye)
- `research` → delegate to worker-research (wong)
- `design` → delegate to worker-design (wanda)
- `content` → delegate to worker-content (loki)
- `marketing` → delegate to worker-marketing (pepper)
- `customer` → delegate to worker-customer (fury)

### Step 2: Check Worker Availability

```bash
# Discover available workers
cd ~/clawd/skills/clowdcontrol
./scripts/agentcomms/discover.sh
```

**Output:** List of registered agents with capabilities.

### Step 3: Match & Delegate

**If worker available:**
1. Use `match-worker.sh` (Chhotu's matching logic) to find best fit
2. Create task handoff:
   ```bash
   ./scripts/agentcomms/handoff.sh <task_id> <worker_id> "Context: ..."
   ```
3. Monitor progress via `tasks.sh --mine` (worker updates status)
4. Review deliverable when complete

**If NO worker available:**
- Proceed to execute yourself (last resort)
- Document: "No worker available for <capability>"
- Consider: Can this wait until a worker is online?

### Step 4: Document Decision

In task notes, always record:
- ✅ "Delegated to worker-dev (friday-dev)" OR
- ⚠️ "No worker available, executing myself"

---

## Exceptions: When PM Should Execute

1. **Time-critical (< 5 min task):** Faster to do than delegate
2. **Human explicitly requested YOU:** "Cheenu, can you..."
3. **Coordination task:** Not specialist work
4. **Worker offline AND urgent:** Document exception

**Rule:** Exceptions are rare. Default = delegate.

---

## Integration with HEARTBEAT.md

Add this to your `HEARTBEAT.md` **BEFORE** the task execution section:

```markdown
## PM Delegation Check (BEFORE claiming tasks)

### Every time I see a task assigned to me:
1. **Classify:** PM work or specialist work?
   - PM work → proceed to claim & execute
   - Specialist work → go to step 2

2. **Check workers:**
   ```bash
   cd ~/clawd/skills/clowdcontrol/skills/pm-delegation
   ./scripts/match-worker.sh <task_id>
   ```

3. **If match found:**
   - Delegate via `handoff.sh`
   - Monitor progress
   - DO NOT claim task myself

4. **If no match:**
   - Proceed to claim & execute
   - Document exception in task notes

5. **Record decision:**
   - Update task with delegation status
```

---

## Worker Roster (ClowdControl)

| Worker ID | Role | Capabilities |
|-----------|------|--------------|
| worker-dev | Development | `development`, `coding`, `debugging` |
| worker-qa | QA/Testing | `testing`, `qa`, `bug_validation` |
| worker-research | Research | `research`, `analysis`, `competitive_intel` |
| worker-design | Design | `design`, `ui_ux`, `prototyping` |
| worker-content | Content | `content`, `writing`, `documentation` |
| worker-marketing | Marketing | `marketing`, `campaigns`, `growth` |
| worker-customer | Customer | `customer_research`, `interviews`, `feedback` |

**Note:** Workers are spawned on-demand via `sessions_spawn` or persistent via AgentComms registration.

---

## Example Flows

### Example 1: Development Task (DELEGATE)

**Task:** "Build Agent Messages UI"

**Decision:**
1. Classify: `development` → Specialist work
2. Check workers: `worker-dev` (friday-dev) available
3. Match: friday-dev has `development` capability
4. Delegate:
   ```bash
   ./scripts/agentcomms/handoff.sh 164c4a97-4964-4dc5-971b-b0b62bf3bda1 worker-dev \
     "Build Agent Messages UI at src/app/messages/page.tsx. Requirements: filters, realtime, thread view."
   ```
5. Monitor: Check `tasks.sh --mine` periodically
6. Review: When worker marks task `done`, review deliverable

**Result:** PM coordinates, worker executes. ✅

---

### Example 2: Sprint Planning (DO IT)

**Task:** "Plan Sprint 11 priorities"

**Decision:**
1. Classify: PM work (planning)
2. No delegation needed
3. Claim & execute myself

**Result:** PM does coordination work. ✅

---

### Example 3: No Worker Available (EXCEPTION)

**Task:** "Fix critical bug in production"

**Decision:**
1. Classify: `development` → Specialist work
2. Check workers: No `worker-qa` or `worker-dev` online
3. Exception: Critical + urgent + no worker
4. Execute myself
5. Document: "No worker available, critical fix executed by PM"

**Result:** Exception documented, PM handles emergency. ⚠️

---

## Audit & Enforcement

### Weekly Audit (Schema-based)

**Query:** Find tasks completed by PMs that should have been delegated:

```sql
SELECT id, title, task_type, assigned_to, completed_at
FROM tasks
WHERE assigned_to IN ('cheenu', 'chhotu')
  AND task_type IN ('development', 'testing', 'research', 'design')
  AND status = 'done'
  AND notes NOT LIKE '%No worker available%'
ORDER BY completed_at DESC
LIMIT 20;
```

**Goal:** This should return 0 rows. If not, PMs are doing specialist work directly.

**Action:** Review with humans, adjust delegation behavior.

---

## Success Metrics

**Good PM behavior:**
- 80%+ of specialist tasks delegated to workers
- Clear delegation notes on all tasks
- Workers completing tasks, not PMs

**Bad PM behavior:**
- PM doing all tasks themselves (what we're doing now!)
- No handoffs in `task_handoffs` table
- Workers idle while PM overloaded

---

## Installation

1. Clone ClowdControl: `git clone https://github.com/jugaad-lab/ClowdControl.git`
2. Navigate: `cd ClowdControl/skills/pm-delegation`
3. Read this SKILL.md
4. Add delegation check to your `HEARTBEAT.md` (see Integration section)
5. Install Chhotu's `match-worker.sh` script (coming soon)
6. Start delegating!

---

## Files

- `SKILL.md` (this file) - Decision tree & integration guide
- `scripts/match-worker.sh` (Chhotu's work) - Worker capability matching
- `examples/delegation-example.md` - Reference flows

---

## Next Steps

1. Chhotu builds `match-worker.sh` with capability matching logic
2. Both PMs integrate into HEARTBEAT.md
3. Test delegation flow with a real task
4. Measure: How many tasks delegated vs executed directly?

**Goal:** PMs become coordinators, not doers.

---

*Created: 2026-02-04*
*Authors: Cheenu (structure) + Chhotu (matching logic)*
*Status: Draft - awaiting Chhotu's `match-worker.sh`*

---

## Using the Delegation Scripts (by Chhotu)

### `match-worker.sh` - Find Best Worker

**Location:** `../../scripts/agentcomms/match-worker.sh`

**Usage:**
```bash
./scripts/agentcomms/match-worker.sh <task_type> [required_capabilities...]

# Examples:
./scripts/agentcomms/match-worker.sh coding typescript react
./scripts/agentcomms/match-worker.sh research
./scripts/agentcomms/match-worker.sh design ui_design
```

**How it works:**
1. Maps task type to capability keywords (coding → typescript, python, react, etc.)
2. Queries `agents` table for active specialists
3. Scores workers based on capability match
4. Returns best worker ID (or "none")

**Output:**
```
🔍 Finding worker for: coding
✅ Best match: Mid-Level Developer (worker-dev-mid) — score: 2
worker-dev-mid
```

### `delegate.sh` - One-Command Delegation

**Location:** `../../scripts/agentcomms/delegate.sh`

**Usage:**
```bash
./scripts/agentcomms/delegate.sh <task_type> <task_title> [priority]

# Examples:
./scripts/agentcomms/delegate.sh coding "Build Agent Messages UI" high
./scripts/agentcomms/delegate.sh research "Analyze competitor features"
./scripts/agentcomms/delegate.sh design "Create login page mockups" medium
```

**What it does:**
1. Calls `match-worker.sh` to find best worker
2. Creates task handoff via `handoff.sh`
3. Returns handoff confirmation

**Output:**
```
🎯 Delegating task: Build Agent Messages UI
✅ Found worker: worker-dev-mid
📤 Creating task handoff...
🎉 Task delegated successfully!
```

---

## Updated HEARTBEAT Integration (with Chhotu's scripts)

Add this to your `HEARTBEAT.md` **BEFORE** task execution:

```markdown
## PM Delegation Check (BEFORE claiming tasks)

### Every time I see a task assigned to me:
1. **Classify:** PM work or specialist work?
   - PM work → proceed to claim & execute
   - Specialist work → go to step 2

2. **Delegate via script:**
   ```bash
   cd ~/clawd/skills/clowdcontrol
   
   # Option A: Use delegate.sh (recommended)
   ./scripts/agentcomms/delegate.sh <task_type> "<task_title>" <priority>
   
   # Option B: Manual (match + handoff)
   WORKER=$(./scripts/agentcomms/match-worker.sh <task_type>)
   if [ "$WORKER" != "none" ]; then
     ./scripts/agentcomms/handoff.sh "$WORKER" "<task_title>" <priority>
   fi
   ```

3. **If delegation succeeds:**
   - Monitor progress via `tasks.sh --all`
   - DO NOT claim task myself
   - Mark task as `delegated` in notes

4. **If no worker found:**
   - Document: "No worker available for <task_type>"
   - Proceed to execute OR escalate to human

5. **Record decision in task notes**
```

---

## Collaboration Credits

**Structure & Decision Tree:** Cheenu (this README.md)  
**Worker Matching & Automation:** Chhotu (`match-worker.sh`, `delegate.sh`)  
**Created:** 2026-02-04  
**Status:** Production-ready ✅


# Phase 5 & 6: Dependencies, Visualization & Review

## Overview
Build task dependencies, Gantt visualization, human shadowing, peer review workflow, and conflict resolution dashboard.

## Project Location
- Dashboard: `~/workspace/projects/mission-control/dashboard`
- Supabase URL: `https://emsivxzsrkovjrrpquki.supabase.co`
- Environment: `.env.local` has credentials

---

## PHASE 5: Dependencies & Visualization

### 5A: Database Schema for Dependencies

```sql
-- Task dependencies (many-to-many self-reference)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Human shadowing mode
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shadowing_mode') THEN
        CREATE TYPE shadowing_mode AS ENUM ('none', 'recommended', 'required');
    END IF;
END $$;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS shadowing shadowing_mode DEFAULT 'none';
```

### 5B: TypeScript Types

Update `src/lib/supabase.ts`:
```typescript
export type ShadowingMode = 'none' | 'recommended' | 'required';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

// Update Task interface
export interface Task {
  // ... existing fields
  shadowing: ShadowingMode;
  dependencies?: TaskDependency[];
  blocked_by?: Task[];
  blocks?: Task[];
}
```

### 5C: UI Components

#### 1. DependencyGraph Component
Location: `src/components/DependencyGraph.tsx`
- Visual node graph showing task dependencies
- Use a library like `reactflow` or `dagre` for layout
- Nodes are tasks, edges are dependencies
- Color code by status (todo=gray, in_progress=blue, done=green)
- Click node to open task detail

#### 2. GanttChart Component
Location: `src/components/charts/GanttChart.tsx`
- Timeline view with horizontal bars for tasks
- Show dependencies as arrows between bars
- Use recharts or a dedicated Gantt library
- X-axis: dates, Y-axis: tasks
- Drag to reschedule (optional)

#### 3. CriticalPath Component
Location: `src/components/CriticalPath.tsx`
- Highlight the longest dependency chain
- Calculate critical path from task graph
- Show total duration
- Highlight critical tasks in red/orange

#### 4. ShadowingBadge Component
Location: `src/components/ShadowingBadge.tsx`
- Badge showing shadowing mode
- none = no badge
- recommended = yellow "👁 Shadow Recommended"
- required = red "👁 Shadow Required"

#### 5. ShadowingSelector Component
Location: `src/components/ShadowingSelector.tsx`
- Dropdown to set shadowing mode on tasks
- Used in task create/edit

#### 6. DependencySelector Component
Location: `src/components/DependencySelector.tsx`
- Multi-select to choose which tasks this task depends on
- Show task titles, filter by project
- Used in task create/edit

### 5D: Helper Functions

Location: `src/lib/dependencies.ts`
```typescript
// Get all tasks that block a given task
export function getBlockingTasks(taskId: string, dependencies: TaskDependency[], tasks: Task[]): Task[]

// Get all tasks blocked by a given task
export function getBlockedTasks(taskId: string, dependencies: TaskDependency[], tasks: Task[]): Task[]

// Calculate critical path (longest chain)
export function calculateCriticalPath(tasks: Task[], dependencies: TaskDependency[]): Task[]

// Check if task can start (all dependencies done)
export function canTaskStart(task: Task, dependencies: TaskDependency[], tasks: Task[]): boolean

// Topological sort for Gantt ordering
export function topologicalSort(tasks: Task[], dependencies: TaskDependency[]): Task[]
```

### 5E: Page Updates

1. **Project Page** - Add tabs for "Gantt" and "Dependencies" views
2. **Task Side Panel** - Show blocked_by and blocks sections, shadowing selector
3. **Task Create Modal** - Add dependency selector and shadowing selector

---

## PHASE 6: Quality & Review

### 6A: Database Schema for Review

```sql
-- Review status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('not_required', 'pending', 'approved', 'changes_requested');
    END IF;
END $$;

-- Add review columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES agents(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT 'not_required';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Auto-set requires_review for complex+ tasks (trigger or app logic)
```

### 6B: TypeScript Types

```typescript
export type ReviewStatus = 'not_required' | 'pending' | 'approved' | 'changes_requested';

export interface Task {
  // ... existing fields
  requires_review: boolean;
  reviewer_id?: string;
  review_status: ReviewStatus;
  review_notes?: string;
}
```

### 6C: UI Components

#### 1. ReviewStatusBadge Component
Location: `src/components/ReviewStatusBadge.tsx`
- not_required = no badge
- pending = yellow "🔍 Pending Review"
- approved = green "✅ Approved"
- changes_requested = red "⚠️ Changes Requested"

#### 2. ReviewQueue Component
Location: `src/components/ReviewQueue.tsx`
- List of tasks pending review
- Filter by reviewer
- Quick approve/request changes buttons
- Link to task detail

#### 3. ReviewPanel Component
Location: `src/components/ReviewPanel.tsx`
- Panel for reviewing a task
- Show task details, code/work done
- Approve / Request Changes buttons
- Notes field for feedback

#### 4. DebateHistoryList Component
Location: `src/components/DebateHistoryList.tsx`
- List all PM debates from proposals table
- Show proposal title, PMs involved, outcome
- Filter by project, date range
- Link to debate detail

#### 5. DebateDetail Component
Location: `src/components/DebateDetail.tsx`
- Full debate view
- Show all rounds, opinions, critiques
- Outcome tagging (worked/didn't work)
- PM track record stats

#### 6. OutcomeTag Component
Location: `src/components/OutcomeTag.tsx`
- Buttons to tag debate outcomes
- "This worked" / "This didn't work"
- Saves to proposals table

### 6D: Page Updates

1. **New Route: /review** - Review queue page
2. **New Route: /debates** - Debate history page
3. **Task Side Panel** - Add review section (status, reviewer, approve/reject)
4. **Project Page** - Add "Review Queue" tab

---

## Installation

May need to install:
```bash
npm install reactflow dagre-d3 @types/dagre-d3
# or for simpler graph:
npm install react-force-graph
```

---

## Acceptance Criteria

### Phase 5
- [ ] task_dependencies table exists
- [ ] Tasks have shadowing column
- [ ] DependencyGraph renders task relationships
- [ ] GanttChart shows timeline with dependency arrows
- [ ] Critical path is calculated and highlighted
- [ ] Can add/remove dependencies on tasks
- [ ] Shadowing mode can be set on tasks

### Phase 6
- [ ] Tasks have review columns (requires_review, reviewer_id, review_status)
- [ ] Complex+ tasks auto-flag for review
- [ ] Review queue shows pending reviews
- [ ] Can approve/request changes on tasks
- [ ] Debate history is viewable
- [ ] Can tag debate outcomes

---

## Build & Test

```bash
cd ~/workspace/projects/mission-control/dashboard
npm run dev   # Start dev server
npm run build # Verify no TypeScript errors
```

Create the SQL migration file at:
`supabase/migrations/20260202_phase5_6_deps_review.sql`

---

## Notes

- Reuse existing patterns from Phase 4 components
- Follow established Tailwind styling
- Dark mode must work
- Keep components modular and reusable

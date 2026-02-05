# 🎯 Sprint 2.2: Agile Features

## Context
Sprint 2.1 is complete. Now build agile/sprint management features.

**Supabase schema already has:**
- `sprints` table (id, project_id, name, number, status, planned_start, planned_end)
- `tasks` table has `sprint_id` foreign key

## Your Mission: 5 Features

### 1. Sprint Planning View
- New page or tab: `/projects/[id]/sprints`
- Show all sprints for a project as cards/columns
- Each sprint shows: name, date range, task count, status
- Can create new sprint (modal with name, start/end dates)
- Can drag tasks between sprints

**Files:** `src/app/projects/[id]/sprints/page.tsx`, `src/components/SprintCard.tsx`

### 2. Backlog View
- Shows tasks with `sprint_id = null` (unassigned to sprint)
- Sortable by priority
- Can drag tasks FROM backlog TO a sprint
- Filter by type/assignee

**Files:** `src/components/BacklogView.tsx`

### 3. Sprint Burndown Chart
- For active sprint, show: ideal line vs actual completion
- X-axis: days in sprint
- Y-axis: remaining tasks (or points if we add story points)
- Use a charting library (recharts is common with Next.js)

**Files:** `src/components/charts/BurndownChart.tsx`

### 4. Velocity Chart  
- Bar chart showing tasks completed per sprint
- Last 3 sprints comparison
- Show average velocity line

**Files:** `src/components/charts/VelocityChart.tsx`

### 5. Sprint Goals Display
- On project page, show current sprint's goal/summary
- Editable sprint description field
- Progress indicator for current sprint

**Update:** `src/app/projects/[id]/page.tsx`

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- **recharts** for charts (`npm install recharts`)
- Supabase client already configured

## Sprint Table Schema
```sql
sprints (
  id UUID,
  project_id UUID,
  name TEXT,
  number INTEGER,
  status TEXT, -- planned, active, review, completed
  planned_start DATE,
  planned_end DATE,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  acceptance_criteria JSONB
)
```

## Build Order
1. Sprint Planning View (foundation)
2. Backlog View (drag source)
3. Sprint Burndown Chart (visualization)
4. Velocity Chart (analytics)
5. Sprint Goals Display (polish)

**Start with #1, test it works, then continue.**

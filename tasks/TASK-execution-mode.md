# Task: Add Project Execution Mode Setting

## Agent
- **Target:** worker-dev
- **Profile:** `agents/worker-dev.md`
- **Model:** sonnet4

## Project
- **Project:** Mission Control
- **Project ID:** 949d00d5-9072-4353-a0e9-174468978598
- **Sprint:** Sprint 9 - Agent Profiles & Automation

## Objective
Add execution mode settings to projects so users can control how the PM drives work.

## Context
Mission Control now has real tasks and sprints. Users need to control pacing:
- Manual: user triggers each task/sprint
- Full Speed: PM chains through automatically
- Background: PM works via heartbeat cron

## Requirements

### 1. Database Migration (`supabase/migrations/005_execution_mode.sql`)

Update the project `settings` JSONB to include:
```json
{
  "execution_mode": "manual",      // "manual" | "full_speed" | "background"
  "sprint_approval": "required",   // "required" | "auto"
  "budget_limit_per_sprint": null  // number or null (tokens)
}
```

No schema change needed — settings is already JSONB. Just update existing projects with defaults.

### 2. Project Settings UI

On the project detail page, add a Settings section (or gear icon that opens a panel) with:

- **Execution Mode** dropdown:
  - 🟢 Manual — "PM waits for your go-ahead"
  - 🔥 Full Speed — "PM chains through all tasks"
  - ⏰ Background — "PM works via heartbeat"
  
- **Sprint Approval** toggle:
  - Required — "Review before next sprint"
  - Auto — "Advance automatically"

- **Budget Limit** input:
  - Tokens per sprint (optional)

Save button that updates project settings via PATCH.

### 3. "Start Next Task" Button

On the project detail page, add a prominent button:
- **▶️ Start Next Task** — visible in Manual mode
- When clicked: creates an entry in `activity_log` with action `"start_task_requested"`
- This signals to the PM (via real-time subscription or heartbeat) to pick up work

Also add:
- **⏭️ Continue Sprint** — starts next unstarted task in current sprint
- **⏩ Next Sprint** — when current sprint is done, advance to next

### 4. API Endpoint

`POST /api/projects/[id]/start` — Triggers PM to start next task
- Finds highest priority backlog task in active sprint
- Sets its status to `assigned`
- Logs activity
- Returns the task that was queued

### 5. Update Supabase helpers

Add to `lib/supabase.ts`:
```typescript
export async function getProjectSettings(projectId: string): Promise<ProjectSettings>
export async function updateProjectSettings(projectId: string, settings: Partial<ProjectSettings>): Promise<void>
```

## Acceptance Criteria
- [ ] Projects have execution_mode in settings (default: manual)
- [ ] Project page shows execution mode selector
- [ ] "Start Next Task" button visible in manual mode
- [ ] Clicking button creates activity_log entry
- [ ] API endpoint `/api/projects/[id]/start` works
- [ ] Settings save correctly via UI

## Files to Create/Modify

### Create:
- `supabase/migrations/005_execution_mode.sql`
- `dashboard/src/app/api/projects/[id]/start/route.ts`
- `dashboard/src/components/ProjectSettings.tsx`

### Modify:
- `dashboard/src/app/projects/[id]/page.tsx` — Add settings + start button
- `dashboard/src/lib/supabase.ts` — Add settings helpers

## Out of Scope
- Actual PM automation (cron triggers) — that's PM behavior, not UI
- Full Speed / Background mode execution logic — just the UI setting for now
- Budget enforcement — just the setting

## Notes
- Keep it simple — settings panel can be minimal
- The button is the key UX element for Manual mode
- Use existing project.settings JSONB, no new columns needed

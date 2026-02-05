# Task: Connect Start Button & Execution Mode to PM

## Agent
- **Target:** worker-dev
- **Profile:** `agents/worker-dev.md`
- **Model:** sonnet4

## Project
- **Project:** Mission Control
- **Project ID:** 949d00d5-9072-4353-a0e9-174468978598
- **Sprint:** Sprint 9 - Agent Profiles & Automation

## Objective
Wire the ▶️ Start button and execution mode settings to actually notify the PM (Chhotu) via Discord so work begins immediately.

## Context
Currently the Start button just changes task status to "assigned" but nobody picks it up. The execution mode setting is UI-only. Both need to send real notifications to the PM.

## Requirements

### 1. Discord Webhook Integration

Create a server-side utility that sends messages to a Discord channel.

**File:** `dashboard/src/lib/discord-notify.ts`

```typescript
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function notifyPM(message: string) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('DISCORD_WEBHOOK_URL not set, skipping notification');
    return;
  }
  
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });
}
```

### 2. Update Start Button API (`/api/projects/[id]/start`)

After assigning the task, send a Discord message:

```
🚀 **Start Requested**
**Task:** {task title}
**Project:** {project name}
**Task ID:** `{task_id}`
**Assigned to:** {agent_id}
**Priority:** P{priority}

PM: Please create task file and spawn the assigned agent.
```

### 3. Update Project Settings Save

When execution mode changes, notify PM:

**Manual → Full Speed:**
```
🔥 **Execution Mode Changed: Full Speed**
**Project:** {project name}
PM: Chain through all backlog tasks automatically. Only stop on blockers or budget limits.
```

**Any → Background:**
```
⏰ **Execution Mode Changed: Background**  
**Project:** {project name}
PM: Set up heartbeat cron to process tasks every 30 minutes.
```

**Any → Manual:**
```
🟢 **Execution Mode Changed: Manual**
**Project:** {project name}
PM: Wait for user to click Start before processing tasks.
```

### 4. Add Webhook URL to Environment

Add to `.env.local`:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

For now, if no webhook is configured, fall back to just logging. We can configure the actual webhook URL later.

### 5. Update Settings API

Create or update `POST /api/projects/[id]/settings` to:
- Save settings to Supabase
- Send Discord notification on mode change
- Log activity

## Files to Create/Modify

### Create:
- `dashboard/src/lib/discord-notify.ts` — Webhook utility

### Modify:
- `dashboard/src/app/api/projects/[id]/start/route.ts` — Add Discord notification
- `dashboard/src/components/ProjectSettings.tsx` — Trigger notification on mode change
- `dashboard/.env.local` — Add DISCORD_WEBHOOK_URL placeholder

## Acceptance Criteria
- [ ] Clicking ▶️ Start sends a Discord message with task details
- [ ] Changing execution mode sends a Discord notification
- [ ] Messages include enough context for PM to act
- [ ] Graceful fallback when webhook URL not configured
- [ ] Activity log entries created for all actions

## Out of Scope
- PM auto-execution logic (PM handles that behaviorally)
- Webhook URL setup (user configures separately)
- Full Speed / Background automation logic

## Notes
- The Discord channel is #disclawd-mission-control (ID: 1467611351751987263)
- PM (Chhotu) monitors this channel and will act on notifications
- This bridges the UI → PM gap without complex automation

# Infrastructure Expansion Plan

**Task:** Expand Supabase infrastructure — queues, messaging, blob storage
**Status:** In Progress
**Started:** 2026-02-05

## Current State

### ✅ Already Implemented
- `agent_messages` table — async messaging between agents
- Message types: chat, task_update, status, debate, vote, system, task_notification, ack, hidden_plan
- Thread support via `thread_id` and `reply_to`
- Indexes for efficient querying

### ❌ Needs Implementation

#### 1. Storage Buckets
- [ ] Create `artifacts` bucket for shared files
- [ ] Create `agent-outputs` bucket for task outputs
- [ ] RLS policies for agent-specific access
- [ ] Size limits and retention policies

#### 2. Realtime Subscriptions
- [ ] Enable Realtime for `task_handoffs`
- [ ] Enable Realtime for `agent_messages`
- [ ] Enable Realtime for `agent_presence`
- [ ] Document subscription patterns

#### 3. Queue Enhancements
- [ ] Add priority queue support
- [ ] Dead letter queue for failed messages
- [ ] Message TTL/expiration
- [ ] Batch message processing

## Implementation Order

1. **Storage (Day 1)** — Most immediately useful
2. **Realtime (Day 2)** — Enables live updates
3. **Queue enhancements (Day 3)** — Nice-to-have

## SQL for Storage Setup

```sql
-- Create artifacts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', false);

-- RLS: Agents can read/write their own artifacts
CREATE POLICY "Agents can manage their artifacts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'artifacts' AND
  (storage.foldername(name))[1] = current_setting('app.current_agent', true)
);
```

## Next Steps
1. Run storage bucket creation via Supabase dashboard or SQL
2. Test upload/download from agent scripts
3. Enable Realtime on key tables

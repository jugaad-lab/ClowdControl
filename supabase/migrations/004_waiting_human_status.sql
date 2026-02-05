-- Migration: Add waiting_human task status
-- Enables human escalation workflow for blocked tasks

-- Update tasks status check constraint to include 'waiting_human'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('backlog', 'assigned', 'in_progress', 'blocked', 'waiting_human', 'review', 'done', 'cancelled'));

-- Add index for efficient querying of human attention tasks
CREATE INDEX IF NOT EXISTS idx_tasks_human_attention 
ON tasks(status) 
WHERE status IN ('waiting_human', 'blocked');

-- Add comment for documentation
COMMENT ON CONSTRAINT tasks_status_check ON tasks IS 
'Valid task statuses including waiting_human for human escalation workflow';
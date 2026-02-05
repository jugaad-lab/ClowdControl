-- 3-Layer Agent Notification System
-- Layer 1: Auto-notification trigger on task_handoffs INSERT
-- Layer 2: Ack tracking on agent_messages

-- Add ack fields to agent_messages
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS acked BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS acked_at TIMESTAMPTZ;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS ack_response TEXT;

-- Add message_type value for notifications and acks
-- (existing check allows: chat, task_update, status, debate, vote, system)
-- We need to add: task_notification, ack, hidden_plan
ALTER TABLE agent_messages DROP CONSTRAINT IF EXISTS agent_messages_message_type_check;
ALTER TABLE agent_messages ADD CONSTRAINT agent_messages_message_type_check 
  CHECK (message_type IN ('chat', 'task_update', 'status', 'debate', 'vote', 'system', 'task_notification', 'ack', 'hidden_plan'));

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_agent_on_task_handoff()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when to_agent is set (skip unassigned tasks)
  IF NEW.to_agent IS NOT NULL THEN
    INSERT INTO agent_messages (
      from_agent,
      to_agent,
      message_type,
      content,
      metadata
    ) VALUES (
      NEW.from_agent,
      NEW.to_agent,
      'task_notification',
      'New task assigned: ' || NEW.title || ' (priority: ' || COALESCE(NEW.priority, 'medium') || ')',
      jsonb_build_object(
        'task_handoff_id', NEW.id,
        'task_title', NEW.title,
        'task_priority', COALESCE(NEW.priority, 'medium'),
        'task_status', NEW.status,
        'auto_generated', true
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS task_handoff_notify ON task_handoffs;
CREATE TRIGGER task_handoff_notify
  AFTER INSERT ON task_handoffs
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_task_handoff();

-- Also fire on reassignment (when to_agent changes)
CREATE OR REPLACE FUNCTION notify_agent_on_task_reassign()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.to_agent IS DISTINCT FROM OLD.to_agent AND NEW.to_agent IS NOT NULL THEN
    INSERT INTO agent_messages (
      from_agent,
      to_agent,
      message_type,
      content,
      metadata
    ) VALUES (
      COALESCE(NEW.from_agent, 'system'),
      NEW.to_agent,
      'task_notification',
      'Task reassigned to you: ' || NEW.title,
      jsonb_build_object(
        'task_handoff_id', NEW.id,
        'task_title', NEW.title,
        'previous_agent', OLD.to_agent,
        'auto_generated', true
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_handoff_reassign_notify ON task_handoffs;
CREATE TRIGGER task_handoff_reassign_notify
  AFTER UPDATE ON task_handoffs
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_task_reassign();

-- Index for watchdog queries
CREATE INDEX IF NOT EXISTS idx_messages_unacked ON agent_messages(acked, created_at) WHERE acked = FALSE;
CREATE INDEX IF NOT EXISTS idx_agents_heartbeat ON agents(last_heartbeat) WHERE last_heartbeat IS NOT NULL;

-- AgentComms Tables for Mission Control
-- Run against Supabase SQL editor

-- 1. Agent Registry (extends existing agents table with comms fields)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'busy', 'offline')),
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS comms_endpoint TEXT,
ADD COLUMN IF NOT EXISTS skills_offered JSONB DEFAULT '[]'::jsonb;

-- 2. Task Handoffs
CREATE TABLE IF NOT EXISTS task_handoffs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_agent TEXT NOT NULL REFERENCES agents(id),
    to_agent TEXT REFERENCES agents(id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'in_progress', 'done', 'failed', 'cancelled')),
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agent Messages (async comms)
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_agent TEXT NOT NULL REFERENCES agents(id),
    to_agent TEXT NOT NULL REFERENCES agents(id),
    message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'task_update', 'status', 'debate', 'vote', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE task_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - allow all operations via anon key for now (tighten later)
CREATE POLICY "Allow all on task_handoffs" ON task_handoffs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_messages" ON agent_messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_handoffs_to_agent ON task_handoffs(to_agent, status);
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON task_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_messages_to_agent ON agent_messages(to_agent, read);
CREATE INDEX IF NOT EXISTS idx_messages_from_agent ON agent_messages(from_agent);

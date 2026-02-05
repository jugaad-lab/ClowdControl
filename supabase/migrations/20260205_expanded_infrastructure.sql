-- ============================================
-- EXPANDED INFRASTRUCTURE
-- Task queues, agent messaging, blob storage
-- Sprint 11: Tribes & Infrastructure Expansion
-- ============================================

-- ============================================
-- 1. TASK QUEUES (for cross-agent dispatch)
-- ============================================

-- Task handoffs (async task queue between agents)
CREATE TABLE IF NOT EXISTS task_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who's involved
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'in_progress', 'completed', 'failed', 'cancelled')),
    
    -- Context
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    context JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Result
    result TEXT,
    result_data JSONB
);

CREATE INDEX idx_handoffs_to_agent ON task_handoffs(to_agent, status);
CREATE INDEX idx_handoffs_from_agent ON task_handoffs(from_agent);
CREATE INDEX idx_handoffs_status ON task_handoffs(status, created_at);
CREATE INDEX idx_handoffs_project ON task_handoffs(project_id);

-- ============================================
-- 2. AGENT MESSAGING (persistent comms)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    from_agent TEXT NOT NULL,
    to_agent TEXT,  -- NULL = broadcast
    
    -- Message content
    message_type TEXT NOT NULL CHECK (message_type IN (
        'chat', 'task_update', 'status', 'debate', 'vote', 
        'system', 'task_notification', 'ack', 'hidden_plan'
    )),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Threading
    thread_id UUID REFERENCES agent_messages(id),
    reply_to UUID REFERENCES agent_messages(id),
    
    -- Context
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    channel TEXT,  -- Discord channel ID if applicable
    
    -- Acknowledgment tracking
    acked BOOLEAN DEFAULT FALSE,
    acked_at TIMESTAMPTZ,
    ack_response TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_to_agent ON agent_messages(to_agent, created_at DESC);
CREATE INDEX idx_messages_from_agent ON agent_messages(from_agent, created_at DESC);
CREATE INDEX idx_messages_thread ON agent_messages(thread_id);
CREATE INDEX idx_messages_unacked ON agent_messages(to_agent, acked) WHERE acked = FALSE;
CREATE INDEX idx_messages_project ON agent_messages(project_id);

-- ============================================
-- 3. SHARED ARTIFACTS (blob references)
-- ============================================

-- Note: Actual files stored in Supabase Storage
-- This table tracks metadata and sharing permissions

CREATE TABLE IF NOT EXISTS shared_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What it is
    name TEXT NOT NULL,
    description TEXT,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN (
        'document', 'code', 'image', 'data', 'config', 'log', 'other'
    )),
    
    -- Storage location
    storage_bucket TEXT DEFAULT 'artifacts',
    storage_path TEXT NOT NULL,  -- Path in Supabase Storage
    mime_type TEXT,
    size_bytes BIGINT,
    
    -- Ownership
    created_by TEXT NOT NULL,  -- Agent ID
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Sharing
    visibility TEXT DEFAULT 'project' CHECK (visibility IN ('private', 'project', 'tribe', 'public')),
    shared_with TEXT[] DEFAULT '{}',  -- Agent IDs
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES shared_artifacts(id),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project ON shared_artifacts(project_id);
CREATE INDEX idx_artifacts_created_by ON shared_artifacts(created_by);
CREATE INDEX idx_artifacts_type ON shared_artifacts(artifact_type);
CREATE INDEX idx_artifacts_visibility ON shared_artifacts(visibility);

-- ============================================
-- 4. AGENT PRESENCE (for realtime)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_presence (
    agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
    status_message TEXT,
    
    -- Current activity
    current_task_id UUID REFERENCES tasks(id),
    current_project_id UUID REFERENCES projects(id),
    
    -- Timing
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    -- Capabilities currently available
    available_for TEXT[] DEFAULT '{}'  -- e.g., ['coding', 'research']
);

-- ============================================
-- 5. NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS agent_notification_prefs (
    agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Channels
    discord_dm BOOLEAN DEFAULT TRUE,
    discord_channel BOOLEAN DEFAULT TRUE,
    webhook_url TEXT,
    
    -- What to notify
    notify_on_task_assign BOOLEAN DEFAULT TRUE,
    notify_on_message BOOLEAN DEFAULT TRUE,
    notify_on_mention BOOLEAN DEFAULT TRUE,
    notify_on_deadline BOOLEAN DEFAULT TRUE,
    
    -- Quiet hours (UTC)
    quiet_start TIME,
    quiet_end TIME,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update presence on heartbeat
CREATE OR REPLACE FUNCTION update_agent_presence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agent_presence (agent_id, last_heartbeat, status)
    VALUES (NEW.id, NOW(), 'online')
    ON CONFLICT (agent_id) DO UPDATE
    SET last_heartbeat = NOW(),
        status = CASE 
            WHEN agent_presence.status = 'offline' THEN 'online'
            ELSE agent_presence.status
        END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mark agents offline if no heartbeat in 5 minutes
CREATE OR REPLACE FUNCTION mark_offline_agents()
RETURNS void AS $$
BEGIN
    UPDATE agent_presence
    SET status = 'offline'
    WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
    AND status != 'offline';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
-- Run in Supabase Dashboard > Database > Replication
-- Or uncomment these:

-- ALTER PUBLICATION supabase_realtime ADD TABLE task_handoffs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE agent_presence;

-- ============================================
-- 8. STORAGE BUCKET (run in Supabase Dashboard)
-- ============================================

-- Create 'artifacts' bucket for shared files:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('artifacts', 'artifacts', false);

-- ============================================
-- GRANTS (for agent access)
-- ============================================

GRANT ALL ON task_handoffs TO authenticated, anon;
GRANT ALL ON agent_messages TO authenticated, anon;
GRANT ALL ON shared_artifacts TO authenticated, anon;
GRANT ALL ON agent_presence TO authenticated, anon;
GRANT ALL ON agent_notification_prefs TO authenticated, anon;

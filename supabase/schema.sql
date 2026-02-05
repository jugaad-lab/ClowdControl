-- ============================================
-- MISSION CONTROL SCHEMA v1.0
-- Deploy to Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Projects (top-level container)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
    
    -- Ownership
    owner_type TEXT NOT NULL CHECK (owner_type IN ('human', 'agent', 'team')),
    owner_ids TEXT[] NOT NULL,
    
    -- PM Assignment
    current_pm_id TEXT,
    pm_assigned_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    
    -- Settings
    settings JSONB DEFAULT '{
        "require_dual_pm_consensus": false,
        "max_debate_rounds": 3,
        "auto_flag_instant_consensus": true,
        "notify_channel": null
    }'::jsonb
);

-- Agent Registry
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    
    -- MCU Theme
    mcu_codename TEXT,
    
    -- Agent Type
    agent_type TEXT NOT NULL CHECK (agent_type IN ('pm', 'specialist')),
    
    -- Capabilities
    capabilities TEXT[] DEFAULT '{}',
    
    -- For PM agents
    clawdbot_instance TEXT,
    
    -- For specialist agents
    invocation_method TEXT CHECK (invocation_method IN ('sessions_spawn', 'claude_code', 'custom')),
    invocation_config JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprints
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    
    -- Acceptance Criteria (detailed!)
    acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'review', 'completed')),
    
    -- Timing (optional)
    planned_start DATE,
    planned_end DATE,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, number)
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT DEFAULT 'development' CHECK (task_type IN (
        'development', 'research', 'design', 'testing', 
        'documentation', 'business', 'marketing', 'other'
    )),
    
    acceptance_criteria TEXT[],
    
    status TEXT DEFAULT 'backlog' CHECK (status IN (
        'backlog', 'assigned', 'in_progress', 'blocked', 'review', 'done', 'cancelled'
    )),
    
    -- Assignment
    assigned_to TEXT REFERENCES agents(id),
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ,
    
    -- Dependencies
    depends_on UUID[],
    blocks UUID[],
    
    -- Ordering
    priority INTEGER DEFAULT 0,
    order_in_sprint INTEGER,
    
    -- Timing
    deadline TIMESTAMPTZ,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    
    -- Metadata
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- ANTI-GROUPTHINK TABLES
-- ============================================

-- Proposals
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    proposal_type TEXT NOT NULL CHECK (proposal_type IN (
        'task_creation', 'sprint_plan', 'architecture_decision', 
        'resource_allocation', 'priority_change', 'other'
    )),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    
    proposed_by TEXT REFERENCES agents(id),
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open', 'debating', 'consensus', 'escalated', 'approved', 'rejected'
    )),
    
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    final_decision JSONB
);

-- Independent Opinions (Phase 1)
CREATE TABLE independent_opinions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    
    agent_id TEXT REFERENCES agents(id),
    
    opinion JSONB NOT NULL,
    confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
    
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    saw_other_opinions_at TIMESTAMPTZ,
    
    UNIQUE(proposal_id, agent_id)
);

-- Critiques (Phase 2)
CREATE TABLE critiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    
    critic_agent_id TEXT REFERENCES agents(id),
    target_agent_id TEXT REFERENCES agents(id),
    
    concerns TEXT[] NOT NULL,
    suggestions TEXT[],
    
    agrees_after_concerns BOOLEAN,
    agreement_reasoning TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debate Rounds
CREATE TABLE debate_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    
    round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
    agent_id TEXT REFERENCES agents(id),
    
    position TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    
    confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(proposal_id, round_number, agent_id)
);

-- Sycophancy Flags
CREATE TABLE sycophancy_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    
    indicator_type TEXT NOT NULL CHECK (indicator_type IN (
        'instant_high_consensus',
        'echo_language',
        'flip_without_reasoning',
        'no_substantive_concerns',
        'copied_conclusion'
    )),
    
    details JSONB,
    
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    was_false_positive BOOLEAN,
    resolution_notes TEXT
);

-- ============================================
-- ACTIVITY & AUDIT
-- ============================================

-- Activity Log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    
    agent_id TEXT,
    human_id TEXT,
    
    details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PM Assignments
CREATE TABLE pm_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id),
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    tasks_completed INTEGER DEFAULT 0,
    sprints_completed INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_agent ON activity_log(agent_id);
CREATE INDEX idx_activity_time ON activity_log(created_at DESC);
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_sycophancy_proposal ON sycophancy_flags(proposal_id);
CREATE INDEX idx_sprints_project ON sprints(project_id);

-- ============================================
-- SEED DATA: Agent Registry
-- ============================================

-- PM Agents
INSERT INTO agents (id, display_name, role, mcu_codename, agent_type, capabilities, clawdbot_instance) VALUES
('chhotu', 'Chhotu', 'Project Manager', 'Jarvis', 'pm', 
 ARRAY['project_management', 'research', 'coding', 'writing', 'analysis'], 
 'chhotu-mac-mini'),
('cheenu', 'Cheenu', 'Project Manager', 'Friday', 'pm', 
 ARRAY['project_management', 'research', 'coding', 'writing', 'analysis'], 
 'cheenu-ec2');

-- Specialist Agents
-- Model tiers:
--   - Opus 4.5: PM agents (complex reasoning)
--   - Sonnet 4: Developers, complex specialists
--   - Sonnet 3.5: General specialists (analysis, research, writing)
--   - Haiku 3.5: Low-level tasks (documentation, simple queries)
INSERT INTO agents (id, display_name, role, mcu_codename, agent_type, capabilities, invocation_method, invocation_config) VALUES
('shuri', 'Shuri', 'Product Analyst', 'Shuri', 'specialist', 
 ARRAY['analysis', 'testing', 'user_research'], 
 'sessions_spawn', '{"model": "anthropic/claude-sonnet-4-20250514", "thinking": "low"}'::jsonb),
 
('fury', 'Fury', 'Customer Researcher', 'Fury', 'specialist', 
 ARRAY['research', 'interviews', 'competitive_analysis'], 
 'sessions_spawn', '{"model": "anthropic/claude-sonnet-4-20250514", "thinking": "low"}'::jsonb),
 
('vision', 'Vision', 'SEO Analyst', 'Vision', 'specialist', 
 ARRAY['seo', 'analytics', 'content_strategy'], 
 'sessions_spawn', '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb),
 
('loki', 'Loki', 'Content Writer', 'Loki', 'specialist', 
 ARRAY['writing', 'copywriting', 'storytelling'], 
 'sessions_spawn', '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb),
 
('quill', 'Quill', 'Social Media Manager', 'Quill', 'specialist', 
 ARRAY['social_media', 'community', 'engagement'], 
 'sessions_spawn', '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb),
 
('wanda', 'Wanda', 'UI/UX Designer', 'Wanda', 'specialist', 
 ARRAY['ui_design', 'ux', 'visual_design'], 
 'sessions_spawn', '{"model": "anthropic/claude-haiku-3-5-latest"}'::jsonb),
 
('pepper', 'Pepper', 'Email Marketing', 'Pepper', 'specialist', 
 ARRAY['email', 'marketing', 'automation'], 
 'sessions_spawn', '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb),
 
('friday-dev', 'Friday', 'Developer', 'Friday', 'specialist', 
 ARRAY['coding', 'debugging', 'architecture'], 
 'claude_code', '{"model": "anthropic/claude-sonnet-4-5-20250514", "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]}'::jsonb),
 
('wong', 'Wong', 'Documentation', 'Wong', 'specialist', 
 ARRAY['documentation', 'technical_writing', 'knowledge_management'], 
 'sessions_spawn', '{"model": "anthropic/claude-haiku-3-5-latest"}'::jsonb),

('hawkeye', 'Hawkeye', 'QA Engineer', 'Hawkeye', 'specialist', 
 ARRAY['testing', 'bug_hunting', 'test_planning', 'regression_testing', 'api_testing'], 
 'sessions_spawn', '{"model": "anthropic/claude-sonnet-4-20250514", "thinking": "low"}'::jsonb),

('antman', 'Ant-Man', 'UI QA Engineer', 'Ant-Man', 'specialist', 
 ARRAY['ui_testing', 'browser_automation', 'visual_regression', 'accessibility_testing', 'e2e_testing'], 
 'sessions_spawn', '{"model": "anthropic/claude-sonnet-4-20250514", "tools": ["browser"], "thinking": "low"}'::jsonb);

-- ============================================
-- ENABLE REAL-TIME
-- ============================================

-- Note: Run these in Supabase Dashboard > Database > Replication
-- Or use the Supabase CLI

-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
-- ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE sycophancy_flags;

-- ============================================
-- DONE! ✅
-- ============================================

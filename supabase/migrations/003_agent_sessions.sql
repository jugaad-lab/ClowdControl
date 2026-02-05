-- Add agent_sessions table for tracking spawned agent sessions
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id),
  session_key TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result_summary TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient querying by agent_id and status
CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_started_at ON agent_sessions(started_at);

-- Enable RLS (Row Level Security)
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (for MVP - can be tightened later)
CREATE POLICY "Enable all access on agent_sessions" ON agent_sessions
  FOR ALL USING (true);
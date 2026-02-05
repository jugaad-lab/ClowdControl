-- Migration: Token Budgeting System
-- Sprint 11 - Clowd-Control
-- Adds project-level token budgets and consumption tracking

-- Add budget columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_tokens INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tokens_consumed INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_alert_threshold NUMERIC(3,2) DEFAULT 0.80;

-- Add comment
COMMENT ON COLUMN projects.budget_tokens IS 'Total token budget for the project (0 = unlimited)';
COMMENT ON COLUMN projects.tokens_consumed IS 'Running total of tokens consumed across all tasks';
COMMENT ON COLUMN projects.budget_alert_threshold IS 'Threshold (0-1) at which to alert PM about budget usage';

-- Function to update project token consumption from tasks
CREATE OR REPLACE FUNCTION update_project_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project's tokens_consumed based on sum of task tokens
    UPDATE projects 
    SET tokens_consumed = (
        SELECT COALESCE(SUM(tokens_consumed), 0) 
        FROM tasks 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update project tokens when task tokens change
DROP TRIGGER IF EXISTS trigger_update_project_tokens ON tasks;
CREATE TRIGGER trigger_update_project_tokens
    AFTER INSERT OR UPDATE OF tokens_consumed OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_tokens();

-- View for budget status (useful for dashboards and alerts)
CREATE OR REPLACE VIEW project_budget_status AS
SELECT 
    p.id,
    p.name,
    p.budget_tokens,
    p.tokens_consumed,
    p.budget_alert_threshold,
    p.current_pm_id,
    CASE 
        WHEN p.budget_tokens = 0 THEN 0
        ELSE ROUND((p.tokens_consumed::NUMERIC / p.budget_tokens) * 100, 1)
    END as usage_percent,
    CASE 
        WHEN p.budget_tokens = 0 THEN 'unlimited'
        WHEN p.tokens_consumed >= p.budget_tokens THEN 'exceeded'
        WHEN p.tokens_consumed::NUMERIC / p.budget_tokens >= p.budget_alert_threshold THEN 'warning'
        ELSE 'ok'
    END as budget_status
FROM projects p
WHERE p.status = 'active';

-- Grant access to the view
GRANT SELECT ON project_budget_status TO anon, authenticated;

-- Migration: Add execution mode settings to projects
-- This updates the existing settings JSONB column with execution mode defaults

-- Update all existing projects to have execution mode defaults
UPDATE projects 
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
    'execution_mode', 'manual',
    'sprint_approval', 'required',
    'budget_limit_per_sprint', null
)
WHERE settings->>'execution_mode' IS NULL;

-- Add index on settings for better performance when querying execution modes
CREATE INDEX IF NOT EXISTS idx_projects_execution_mode 
ON projects USING GIN ((settings->>'execution_mode'));

-- Add comment for documentation
COMMENT ON COLUMN projects.settings IS 'JSONB settings including execution_mode (manual|full_speed|background), sprint_approval (required|auto), budget_limit_per_sprint (number|null)';
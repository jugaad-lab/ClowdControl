-- Make acceptance_criteria mandatory for new tasks
-- Created: 2026-02-05

-- First, update any existing tasks with null acceptance_criteria to have a default empty array
UPDATE tasks 
SET acceptance_criteria = '[]'::json
WHERE acceptance_criteria IS NULL;

-- Now add NOT NULL constraint to acceptance_criteria column
ALTER TABLE tasks 
ALTER COLUMN acceptance_criteria SET NOT NULL;

-- Add a default value for the column to ensure new tasks always have at least an empty array
ALTER TABLE tasks 
ALTER COLUMN acceptance_criteria SET DEFAULT '[]'::json;
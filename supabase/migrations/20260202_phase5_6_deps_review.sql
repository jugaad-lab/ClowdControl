-- Phase 5 & 6: Dependencies, Visualization & Review
-- Created: 2026-02-02

-- ============================================
-- PHASE 5: Task Dependencies & Shadowing
-- ============================================

-- Task dependencies (many-to-many self-reference)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  -- Prevent self-reference
  CHECK (task_id != depends_on_task_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Human shadowing mode enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shadowing_mode') THEN
        CREATE TYPE shadowing_mode AS ENUM ('none', 'recommended', 'required');
    END IF;
END $$;

-- Add shadowing column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS shadowing shadowing_mode DEFAULT 'none';

-- ============================================
-- PHASE 6: Review Workflow
-- ============================================

-- Review status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('not_required', 'pending', 'approved', 'changes_requested');
    END IF;
END $$;

-- Add review columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES agents(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT 'not_required';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add outcome tracking to proposals for debate history
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_worked BOOLEAN;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_tagged_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_tagged_by TEXT;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
DECLARE
    cycle_found BOOLEAN := FALSE;
BEGIN
    -- Use recursive CTE to detect cycles
    WITH RECURSIVE dep_chain AS (
        SELECT depends_on_task_id as task_id, 1 as depth
        FROM task_dependencies
        WHERE task_id = NEW.depends_on_task_id

        UNION ALL

        SELECT td.depends_on_task_id, dc.depth + 1
        FROM task_dependencies td
        JOIN dep_chain dc ON td.task_id = dc.task_id
        WHERE dc.depth < 100 -- Prevent infinite loops
    )
    SELECT EXISTS (
        SELECT 1 FROM dep_chain WHERE task_id = NEW.task_id
    ) INTO cycle_found;

    IF cycle_found THEN
        RAISE EXCEPTION 'Circular dependency detected';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular dependencies
DROP TRIGGER IF EXISTS prevent_circular_dependencies ON task_dependencies;
CREATE TRIGGER prevent_circular_dependencies
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION check_circular_dependency();

-- Auto-set requires_review for complex+ tasks
CREATE OR REPLACE FUNCTION auto_set_review_required()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.complexity IN ('complex', 'critical') THEN
        NEW.requires_review := TRUE;
        IF NEW.review_status = 'not_required' OR NEW.review_status IS NULL THEN
            NEW.review_status := 'pending';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_review_for_complex_tasks ON tasks;
CREATE TRIGGER auto_review_for_complex_tasks
    BEFORE INSERT OR UPDATE OF complexity ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_review_required();

-- Index for review queue queries
CREATE INDEX IF NOT EXISTS idx_tasks_review_status ON tasks(review_status) WHERE requires_review = true;
CREATE INDEX IF NOT EXISTS idx_tasks_reviewer ON tasks(reviewer_id) WHERE reviewer_id IS NOT NULL;

-- Fix remaining table policies for tasks, sprints, activity_log, proposals

-- ============ TASKS ============
DROP POLICY IF EXISTS "users_view_tasks" ON tasks;
DROP POLICY IF EXISTS "members_modify_tasks" ON tasks;
DROP POLICY IF EXISTS "members_update_tasks" ON tasks;
DROP POLICY IF EXISTS "members_delete_tasks" ON tasks;

CREATE POLICY "users_view_tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "members_modify_tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

CREATE POLICY "members_update_tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

CREATE POLICY "members_delete_tasks" ON tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

-- ============ SPRINTS ============
DROP POLICY IF EXISTS "users_view_sprints" ON sprints;
DROP POLICY IF EXISTS "members_modify_sprints" ON sprints;
DROP POLICY IF EXISTS "members_update_sprints" ON sprints;
DROP POLICY IF EXISTS "members_delete_sprints" ON sprints;

CREATE POLICY "users_view_sprints" ON sprints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sprints.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "members_modify_sprints" ON sprints
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

CREATE POLICY "members_update_sprints" ON sprints
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

CREATE POLICY "members_delete_sprints" ON sprints
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

-- ============ ACTIVITY LOG ============
DROP POLICY IF EXISTS "users_view_activity" ON activity_log;
DROP POLICY IF EXISTS "members_insert_activity" ON activity_log;

CREATE POLICY "users_view_activity" ON activity_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "anyone_insert_activity" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============ PROPOSALS ============
DROP POLICY IF EXISTS "users_view_proposals" ON proposals;
DROP POLICY IF EXISTS "members_modify_proposals" ON proposals;
DROP POLICY IF EXISTS "members_update_proposals" ON proposals;

CREATE POLICY "users_view_proposals" ON proposals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = proposals.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "members_modify_proposals" ON proposals
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = proposals.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

CREATE POLICY "members_update_proposals" ON proposals
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = proposals.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'member'))
  );

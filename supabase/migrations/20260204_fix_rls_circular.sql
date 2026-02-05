-- Fix circular RLS dependency: projects ↔ project_members
-- The original policies had projects querying project_members and
-- project_members querying projects → infinite loop → empty results

-- 1. Fix project_members (no back-reference to projects)
DROP POLICY IF EXISTS "members_viewable" ON project_members;
CREATE POLICY "members_viewable" ON project_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_manage_members" ON project_members;
CREATE POLICY "admins_manage_members" ON project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 2. Recreate projects policies (safe to reference project_members now)
DROP POLICY IF EXISTS "allow_all_authenticated" ON projects;
DROP POLICY IF EXISTS "users_view_projects" ON projects;
DROP POLICY IF EXISTS "admins_modify_projects" ON projects;

CREATE POLICY "users_view_projects" ON projects
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_modify_projects" ON projects
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

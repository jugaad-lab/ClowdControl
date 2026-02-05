-- ============================================
-- Auth System Migration
-- Sprint 11 — Profiles, Project Members, RLS
-- ============================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. New Tables
-- ============================================

-- profiles — extends Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- project_members — access control list
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================
-- 2. Schema Changes to projects
-- ============================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team'));

-- ============================================
-- 3. Auto-create profile trigger
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. Enable RLS
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- DO NOT enable RLS on: agents, agent_sessions, task_handoffs, agent_messages

-- ============================================
-- 5. RLS Policies — Projects
-- ============================================

DROP POLICY IF EXISTS "users_view_projects" ON projects;
CREATE POLICY "users_view_projects" ON projects FOR SELECT USING (
  owner_id = auth.uid()
  OR visibility = 'public'
  OR EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = projects.id
    AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_modify_projects" ON projects;
CREATE POLICY "admins_modify_projects" ON projects FOR ALL USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- ============================================
-- 6. RLS Policies — Tasks
-- ============================================

DROP POLICY IF EXISTS "users_view_tasks" ON tasks;
CREATE POLICY "users_view_tasks" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = tasks.project_id
    AND (p.owner_id = auth.uid() OR p.visibility = 'public' OR pm.user_id IS NOT NULL)
  )
);

DROP POLICY IF EXISTS "members_modify_tasks" ON tasks;
CREATE POLICY "members_modify_tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_update_tasks" ON tasks;
CREATE POLICY "members_update_tasks" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_delete_tasks" ON tasks;
CREATE POLICY "members_delete_tasks" ON tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============================================
-- 7. RLS Policies — Sprints
-- ============================================

DROP POLICY IF EXISTS "users_view_sprints" ON sprints;
CREATE POLICY "users_view_sprints" ON sprints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = sprints.project_id
    AND (p.owner_id = auth.uid() OR p.visibility = 'public' OR pm.user_id IS NOT NULL)
  )
);

DROP POLICY IF EXISTS "members_modify_sprints" ON sprints;
CREATE POLICY "members_modify_sprints" ON sprints FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = sprints.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_update_sprints" ON sprints;
CREATE POLICY "members_update_sprints" ON sprints FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = sprints.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_delete_sprints" ON sprints;
CREATE POLICY "members_delete_sprints" ON sprints FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = sprints.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============================================
-- 8. RLS Policies — Activity Log
-- ============================================

DROP POLICY IF EXISTS "users_view_activity" ON activity_log;
CREATE POLICY "users_view_activity" ON activity_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id::text = activity_log.entity_id
    AND (p.owner_id = auth.uid() OR p.visibility = 'public' OR pm.user_id IS NOT NULL)
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_insert_activity" ON activity_log;
CREATE POLICY "members_insert_activity" ON activity_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'member'))
);

-- ============================================
-- 9. RLS Policies — Proposals
-- ============================================

DROP POLICY IF EXISTS "users_view_proposals" ON proposals;
CREATE POLICY "users_view_proposals" ON proposals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = proposals.project_id
    AND (p.owner_id = auth.uid() OR p.visibility = 'public' OR pm.user_id IS NOT NULL)
  )
);

DROP POLICY IF EXISTS "members_modify_proposals" ON proposals;
CREATE POLICY "members_modify_proposals" ON proposals FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = proposals.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "members_update_proposals" ON proposals;
CREATE POLICY "members_update_proposals" ON proposals FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = proposals.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============================================
-- 10. RLS Policies — Profiles
-- ============================================

DROP POLICY IF EXISTS "profiles_viewable" ON profiles;
CREATE POLICY "profiles_viewable" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- ============================================
-- 11. RLS Policies — Project Members
-- ============================================

DROP POLICY IF EXISTS "members_viewable" ON project_members;
CREATE POLICY "members_viewable" ON project_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members.project_id
    AND (p.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = auth.uid()
    ))
  )
);

DROP POLICY IF EXISTS "admins_manage_members" ON project_members;
CREATE POLICY "admins_manage_members" ON project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============================================
-- 12. Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);

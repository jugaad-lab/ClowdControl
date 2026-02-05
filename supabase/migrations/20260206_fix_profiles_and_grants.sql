-- Ensure profiles policies exist and work
DROP POLICY IF EXISTS "profiles_viewable" ON profiles;
CREATE POLICY "profiles_viewable" ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Also ensure agents table is accessible (no RLS, but needs grants)
-- agents should NOT have RLS since bots need unrestricted access
-- But authenticated dashboard users need to read agents too
GRANT SELECT ON agents TO authenticated, anon;
GRANT SELECT ON agent_sessions TO authenticated, anon;

-- Ensure independent_opinions, critiques, debate_rounds, sycophancy_flags accessible
GRANT SELECT ON independent_opinions TO authenticated, anon;
GRANT SELECT ON critiques TO authenticated, anon;
GRANT SELECT ON debate_rounds TO authenticated, anon;
GRANT SELECT ON sycophancy_flags TO authenticated, anon;
GRANT SELECT ON pm_assignments TO authenticated, anon;
GRANT SELECT ON task_dependencies TO authenticated, anon;

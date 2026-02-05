# TASK: Auth System — Sprint 11, P1

Build the complete authentication system for Clowd-Control. This includes Supabase schema migration, dashboard login/auth flow, and role-based access control.

## Architecture

```
Dashboard (humans) → Supabase Auth (anon key + JWT) → RLS enforced ✅
PM agents (bots)   → Service role key                → RLS bypassed ✅
```

- **Yajat** = admin (sees all, does all)
- **Cheenu** = member (sees team projects only)
- **Nag** = viewer (read-only on team projects)
- **Chhotu bot** = service role key (bypasses RLS)
- **Cheenu bot** = Supabase Auth account (member, scoped to his projects)

## Part 1: Supabase Migration

Create file: `supabase/migrations/20260204_auth_system.sql`

### New Tables

**`profiles`** — extends Supabase Auth users:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Auto-create via trigger on auth.users insert:
```sql
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**`project_members`** — access control list:
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### Schema Changes to `projects`

Add columns:
```sql
ALTER TABLE projects ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team'));
```

### RLS Policies

Enable RLS on: `projects`, `tasks`, `sprints`, `activity_log`, `proposals`, `profiles`, `project_members`

**DO NOT enable RLS on:** `agents`, `agent_sessions`, `task_handoffs`, `agent_messages` (these are agent-to-agent comms, need to stay open for service role)

**Projects policy:**
```sql
-- Users can see projects they own, are members of, or that are public
CREATE POLICY "users_view_projects" ON projects FOR SELECT USING (
  owner_id = auth.uid()
  OR visibility = 'public'
  OR EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = projects.id 
    AND pm.user_id = auth.uid()
  )
);

-- Only owner/admin can modify projects
CREATE POLICY "admins_modify_projects" ON projects FOR ALL USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

**Tasks policy:**
```sql
-- Users can see tasks in projects they have access to
CREATE POLICY "users_view_tasks" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = tasks.project_id
    AND (p.owner_id = auth.uid() OR p.visibility = 'public' OR pm.user_id IS NOT NULL)
  )
);

-- Only members/admins can modify tasks (not viewers)
CREATE POLICY "members_modify_tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "members_update_tasks" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "members_delete_tasks" ON tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'member')
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
```

Apply similar patterns for `sprints`, `activity_log`, `proposals`.

**Profiles policy:**
```sql
-- Users can view any profile
CREATE POLICY "profiles_viewable" ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
```

**Project Members policy:**
```sql
-- Users can see memberships for projects they have access to
CREATE POLICY "members_viewable" ON project_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members.project_id
    AND (p.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = auth.uid()
    ))
  )
);

-- Only admins can manage memberships
CREATE POLICY "admins_manage_members" ON project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
```

## Part 2: Dashboard Auth (Next.js)

### Install dependencies
```bash
cd dashboard
npm install @supabase/ssr
```

### Create auth utilities

**`src/lib/supabase-server.ts`** — Server-side Supabase client with cookie handling:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

**`src/lib/supabase-browser.ts`** — Browser-side Supabase client:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/auth.ts`** — Auth context and hooks:
```typescript
// AuthProvider context
// useAuth() hook returning { user, profile, role, signIn, signOut, loading }
// Profile type: { id, email, display_name, role, avatar_url }
```

### Create middleware

**`src/middleware.ts`** — Protect routes, redirect to login if not authenticated:
```typescript
// Check auth on every route except /login, /auth/callback, /_next, /favicon.ico
// If no session → redirect to /login
// If session exists → continue
```

### Create pages

**`src/app/login/page.tsx`** — Login page:
- Email + password form
- Clean, minimal design matching existing dark theme
- Error handling
- Redirect to `/` after login

**`src/app/auth/callback/route.ts`** — Auth callback for email confirmation:
```typescript
// Handle Supabase auth callback (email confirmation, OAuth)
```

### Update layout

**`src/app/layout.tsx`** — Wrap with AuthProvider:
```typescript
// Add AuthProvider around children
// Show user avatar/name in top-right corner
// Add sign-out button
```

### Role-based UI

Update existing components to check user role:

1. **Hide "Create Task" button for viewers**
2. **Hide "Edit Sprint" button for viewers**
3. **Hide "Report Bug" button for viewers**
4. **Hide "Change Execution Mode" for viewers**
5. **Hide project settings page for non-owners**

Pattern:
```tsx
const { role } = useAuth();
// role comes from project_members for the current project, 
// or from profiles.role as fallback

{(role === 'admin' || role === 'member') && (
  <Button>Create Task</Button>
)}
```

### Update existing supabase.ts

The existing `src/lib/supabase.ts` uses a bare `createClient`. Update it to:
- Keep the existing helper functions (they're used everywhere)
- BUT update the client initialization to use the auth-aware client when in browser context
- Server-side API routes should keep using the anon key client (they'll get the user's session via cookies)

## Part 3: User Header Component

Create **`src/components/UserMenu.tsx`**:
- Show user avatar (or initials) + display_name
- Dropdown with: Profile, Sign Out
- Show role badge (admin/member/viewer)

Add to layout, top-right corner.

## Important Notes

1. **Don't break existing functionality** — the dashboard should still work after migration. All existing API routes use the anon key which won't have RLS until we enable it AND create auth accounts.

2. **Migration order matters:**
   - Create tables first
   - Add columns
   - Create trigger
   - Enable RLS
   - Add policies
   - Set existing data (owner_id, visibility, memberships) AFTER auth accounts exist

3. **The SQL migration should be idempotent** — use `IF NOT EXISTS` and `CREATE OR REPLACE` where possible.

4. **Keep the existing `supabase` export in supabase.ts working** — lots of components import it directly.

5. **The dark theme** — login page and user menu should match the existing dark theme (bg-gray-950, etc.)

6. **Don't create actual Supabase Auth accounts in the migration** — that needs to be done via Supabase Dashboard or API separately. The migration just sets up the schema.

## Files to Create/Modify

### Create:
- `supabase/migrations/20260204_auth_system.sql`
- `dashboard/src/lib/supabase-server.ts`
- `dashboard/src/lib/supabase-browser.ts`
- `dashboard/src/lib/auth.ts`
- `dashboard/src/middleware.ts`
- `dashboard/src/app/login/page.tsx`
- `dashboard/src/app/auth/callback/route.ts`
- `dashboard/src/components/UserMenu.tsx`

### Modify:
- `dashboard/src/lib/supabase.ts` — update client to be auth-aware
- `dashboard/src/app/layout.tsx` — add AuthProvider + UserMenu
- `dashboard/package.json` — add @supabase/ssr dependency

### Optionally modify (role-based UI):
- Components with "Create Task", "Edit Sprint", "Report Bug", execution mode buttons — add role checks

## Definition of Done

1. ✅ SQL migration file created with all tables, columns, trigger, RLS policies
2. ✅ Dashboard has a working login page
3. ✅ Auth middleware redirects unauthenticated users to login
4. ✅ AuthProvider wraps the app, useAuth() hook available
5. ✅ UserMenu shows in top-right with sign-out
6. ✅ Viewer role hides create/edit/delete buttons
7. ✅ `npm run build` passes without errors
8. ✅ Existing functionality not broken (projects, tasks, sprints pages still load)

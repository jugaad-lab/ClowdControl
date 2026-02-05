import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'not-set';

  // Server-side auth client with cookies
  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });
  
  const { data: { user } } = await authClient.auth.getUser();

  // Check what auth.uid() returns in SQL context
  const { data: uidCheck, error: uidError } = await authClient.rpc('auth_uid_check').maybeSingle();
  
  // Try raw query - does SELECT work at all?
  const { data: rawProjects, error: rawError } = await authClient
    .from('projects')
    .select('name, owner_id, visibility')
    .limit(10);

  // Service role: check owner_id values
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: ownerCheck } = await serviceClient
    .from('projects')
    .select('name, owner_id, visibility')
    .limit(3);

  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    uidCheck,
    uidError: uidError?.message ?? null,
    rawProjects,
    rawError: rawError?.message ?? null,
    ownerCheck,
    ownerIdMatch: ownerCheck?.[0]?.owner_id === user?.id,
  });
}

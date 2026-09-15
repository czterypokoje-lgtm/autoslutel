import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';

export const dynamic = 'force-dynamic';

/**
 * The CRM accounts that can be linked to a monteur record.
 *
 * Listing auth users needs the service-role key — there is no session-scoped
 * way to read auth.users. That is safe here only because the office check above
 * runs first and this returns nothing but an id, an e-mail and a role. Never
 * widen it: this is the one place in the CRM where a request escapes RLS.
 */
export async function GET() {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ users: [] });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    console.error('Could not list CRM users:', error.message);
    return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 });
  }

  const users = data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role as string | undefined) ?? null,
    }))
    .filter((u) => u.email && u.role === 'monteur')
    .sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store' } });
}

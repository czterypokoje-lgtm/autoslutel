import { getCrmUser } from '@/lib/crmSession';
import { mintOwnerApproval } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Mints a 2-minute approval token for the signed-in OWNER. Off unless
 * JOBROOM_MINT_ENABLED=on. The identity is the CRM session (verified by
 * Supabase Auth), never a field in the body, and the server re-computes what is
 * approved from the stored row. The token is returned once and never logged.
 * Posting it to /api/ops/jobroom/approvals is a separate step.
 */
export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!user) return Response.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (user.role !== 'owner') return Response.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const result = await mintOwnerApproval(createSupabaseAdminClient(), body, {
    enabled: process.env.JOBROOM_MINT_ENABLED === 'on',
    secret: process.env.JOBROOM_APPROVAL_SECRET,
  });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

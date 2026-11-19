import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The server sent this lead a message the owner approved. Marks it contacted
 * so it leaves the unanswered list. Only a lead still at `new` with no first
 * contact changes: an earlier call keeps its own time, and nothing else moves.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { leadId?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  if (!UUID.test(leadId)) return NextResponse.json({ error: 'Ongeldige lead' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .update({ status: 'contacted', first_contact_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('status', 'new')
    .is('first_contact_at', null)
    .select('id');

  if (error) {
    console.error('ops lead-contacted failed:', error.message);
    return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 });
  }
  await logOps(supabase, 'lead.contacted', { leadId, changed: data?.length ?? 0 });
  return NextResponse.json({ changed: data?.length ?? 0 });
}

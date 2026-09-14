import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Change one invoice's status — concept, verzonden or betaald.
 *
 * The only thing this route writes. Anyone who can see the invoice at all
 * (RLS on sales_invoices, same policy for read and write) may move its
 * status: a monteur who hands over a job and gets paid on the spot needs to
 * mark it betaald from the van, not wait for the office.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['concept', 'verzonden', 'betaald']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!user.role) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig factuur-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  if (typeof body.status !== 'string' || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('sales_invoices')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: `Opslaan mislukt: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

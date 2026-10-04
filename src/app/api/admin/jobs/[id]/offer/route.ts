import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { offerJobToTechnicians } from '@/lib/offerJob';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The "Stuur naar monteurs" button.
 *
 * All of the thinking lives in offerJobToTechnicians, because /nieuw in the
 * Telegram bot does exactly the same thing and the two must not drift — a
 * technician quoted his own rate down one path and asked for a price down the
 * other would be a bug nobody could see from either side.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldige klus' }, { status: 400 });

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const result = await offerJobToTechnicians(supabase, id);
  if (!result.ok) {
    /* "Already open with everyone" and "nobody has Telegram" are both the
       office's situation to fix, not server faults. */
    const theirs = /al open|Telegram gekoppeld|afgerond/.test(result.error ?? '');
    return NextResponse.json({ error: result.error }, { status: theirs ? 409 : 500 });
  }

  return NextResponse.json({ ok: true, sent: result.sent, technicians: result.technicians });
}

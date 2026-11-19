import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Leads belonging to a phone number.
 *
 * Exists for one reason: a job planned without picking a lead carries no
 * lead_id, and the click id that paid for the customer lives on the lead. 39
 * of 65 finished jobs are in that state, which is most of why ad attribution
 * sits where it does — the click happened, the form was filled in, and then
 * the two halves were never introduced.
 *
 * The office already types the customer's number into the planning form. This
 * is what turns that number into the missing link.
 *
 * Matched on the last nine digits. A Dutch number reaches the CRM as
 * 06 12 34 56 78, 0612345678, +31612345678 or 0031612345678 depending on who
 * typed it and where; the tail is the part that is the same in all of them.
 */

/** The comparable tail of a phone number, or null when there is not enough of one. */
function tail(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
}

export async function GET(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const asked = new URL(request.url).searchParams.get('phone') ?? '';
  const wanted = tail(asked);
  if (!wanted) return NextResponse.json({ leads: [] });

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  /*
   * Filtered in JS on the tail rather than in the query. Postgres cannot use
   * an index for "ends with" anyway, the table is small, and the alternative
   * is four ilike patterns that still miss the fifth way someone wrote it.
   */
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, phone, phone_e164, service, created_at, gclid, wbraid, gbraid, msclkid')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Lead lookup by phone failed:', error.message);
    return NextResponse.json({ error: 'Zoeken mislukt' }, { status: 500 });
  }

  const leads = (data ?? [])
    .filter((lead) => {
      const a = tail(lead.phone_e164 ?? '');
      const b = tail(lead.phone ?? '');
      return a === wanted || b === wanted;
    })
    .slice(0, 5)
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      service: lead.service,
      created_at: lead.created_at,
      /* Whether linking this lead would actually recover an ad click. The
         office does not need the id itself, only whether there is one. */
      hasClickId: Boolean(lead.gclid || lead.wbraid || lead.gbraid || lead.msclkid),
    }));

  return NextResponse.json({ leads }, { headers: { 'Cache-Control': 'no-store' } });
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse, after } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';
import { validLeadToken } from '@/lib/leadToken';
import { notifyLeadDetails } from '@/lib/leadNotify';

/*
 * Follow-up answers for a lead the hero wizard already saved.
 *
 * The wizard saves the lead as soon as it has a phone number (step 2), so a
 * visitor who stops there is still a lead. The questions after that only
 * sharpen the quote; their answers land here, on the same row, guarded by the
 * token /api/leads handed out with the id.
 */
export const dynamic = 'force-dynamic';

const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(request: Request) {
  const limit = await rateLimit(`lead-details:${getClientIp(request)}`, 20, 3600);
  if (!limit.ok) return tooManyRequests(3600);

  const body = await request.json().catch(() => null);
  const id = text(body?.id, 64);
  const token = text(body?.token, 64);
  if (!id || !token || !validLeadToken(id, token)) {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const update: Record<string, unknown> = {};
  const service = text(body?.service, 120);
  if (service) update.service = service;
  const quoted = Number(body?.quotedPrice);
  if (Number.isFinite(quoted) && quoted > 0 && quoted < 10000) update.quoted_price = quoted;
  if (!Object.keys(update).length) return NextResponse.json({ success: true });

  const supabase = createClient(url, key);
  const columns = 'id, name, phone, brand, model, year, service, quoted_price';
  const { data: before } = await supabase.from('leads').select(columns).eq('id', id).maybeSingle();

  const { data: lead, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select(columns)
    .maybeSingle();
  if (error) {
    console.error('lead details update failed', error.code);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  /* Only on a real change: the wizard can resend the same answer after Back. */
  const price = (row: { quoted_price: unknown } | null) =>
    row?.quoted_price == null ? null : Number(row.quoted_price);
  if (lead && (lead.service !== before?.service || price(lead) !== price(before))) {
    after(() =>
      notifyLeadDetails({ ...lead, quoted_price: price(lead) }).catch((notifyError) =>
        console.error('[leads] details alert failed', id, notifyError)
      )
    );
  }
  return NextResponse.json({ success: true });
}

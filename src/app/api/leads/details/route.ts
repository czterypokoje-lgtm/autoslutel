import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';
import { validLeadToken } from '@/lib/leadToken';

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
  /* What the customer typed themselves (migration 0076). Carried here rather
     than on /api/leads so that a database without the column yet costs us a
     note, never the lead. */
  const note = text(body?.note, 500);
  if (note) update.note = note;
  /* A photo of the key, uploaded after the lead was already saved at step 2.
     photo_url has existed since the first schema, so this one needs no
     migration — only a route that will write it. */
  const photoUrl = text(body?.photoUrl, 500);
  if (photoUrl) update.photo_url = photoUrl;
  const price = Number(body?.quotedPrice);
  if (Number.isFinite(price) && price > 0 && price < 10000) update.quoted_price = price;
  if (!Object.keys(update).length) return NextResponse.json({ success: true });

  const { error } = await createClient(url, key).from('leads').update(update).eq('id', id);
  if (error) {
    console.error('lead details update failed', error.code);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

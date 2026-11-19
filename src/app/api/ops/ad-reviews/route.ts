import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { recordChatPhones } from '@/lib/attributionData';

export const dynamic = 'force-dynamic';

const REF = /^[A-Z0-9]{4}$/;
const clip = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

/**
 * The assistant's suggestions. Only its own columns are written, so a person's
 * decision is never overwritten by a later run.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { reviews?: unknown } | null;
  const raw = Array.isArray(body?.reviews) ? body.reviews : null;
  if (!raw || raw.length > 500) return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });

  const rows = [];
  /* The number behind each code, when the server sends it: see migration 0088. */
  const phones: { ref: string; phone: string }[] = [];
  for (const item of raw) {
    const r = (item ?? {}) as Record<string, unknown>;
    if (typeof r.ref !== 'string' || !REF.test(r.ref)) {
      return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 });
    }
    if (typeof r.phone === 'string' && r.phone.trim()) phones.push({ ref: r.ref, phone: r.phone.slice(0, 32) });
    rows.push({
      ref: r.ref,
      phone_end: clip(r.phoneEnd, 4),
      chat_at: clip(r.at, 32),
      ai_result: clip(r.aiResult, 20),
      car: clip(r.car, 120),
      price_note: clip(r.price, 120),
    });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('whatsapp_ad_reviews').upsert(rows, { onConflict: 'ref' });
  if (error) {
    console.error('ops ad reviews write failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  /*
   * Which number sent which code, so the daily Google file can use the code.
   * A failure here must not lose the reviews that were just saved: it is
   * reported as a flag and logged, and the server can send the numbers again.
   */
  const linked = phones.length ? await recordChatPhones(supabase, phones) : null;
  if (linked?.error) console.error('ops ad reviews phone link failed:', linked.error);

  await logOps(supabase, 'ad_reviews.write', {
    count: rows.length,
    ...(linked
      ? { phones: phones.length, phones_set: linked.set, phones_same: linked.same, phones_conflict: linked.conflict, phones_skipped: linked.skipped, phones_failed: Boolean(linked.error) }
      : {}),
  });
  return NextResponse.json({
    saved: rows.length,
    ...(linked ? { phones_linked: linked.set, phones_failed: Boolean(linked.error) } : {}),
  });
}

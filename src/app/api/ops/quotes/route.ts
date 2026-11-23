import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  normalizeQuoteInput,
  linkByPhone,
  insertProposed,
  insertKey,
  type LeadQuoteInsertRow,
  type LinkState,
} from '@/lib/leadQuotes';

export const dynamic = 'force-dynamic';

/**
 * docs/lead-quotes.md §3.2 — the server's own quotes, one row proposed per
 * chat. Every row is written as `status='proposed'`; a human in
 * /admin/offertes confirms or rejects before it ever reaches a report.
 *
 * Per-row, never all-or-nothing: one bad row in a batch of 200 must not sink
 * the other 199, so this always answers 200 with a result per row — the
 * envelope itself (not an array, or over 200 rows) is the only 400, same as
 * auth is the only other non-200.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { quotes?: unknown } | null;
  const raw = Array.isArray(body?.quotes) ? body.quotes : null;
  if (!raw || raw.length > 200) {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  type Classified = { kind: 'rejected'; reason: string } | { kind: 'insert'; link: LinkState; key: string };
  const classified: Classified[] = [];
  const toInsert: LeadQuoteInsertRow[] = [];

  for (const item of raw) {
    const normalized = normalizeQuoteInput(item);
    if (!normalized.ok) {
      classified.push({ kind: 'rejected', reason: normalized.reason });
      continue;
    }
    const row = normalized.row;
    const link = await linkByPhone(supabase, row.phone);
    toInsert.push({
      phone_e: row.phone,
      lead_id: link.state === 'linked' ? link.lead_id : null,
      link_state: link.state,
      channel: row.channel,
      make: row.make,
      model: row.model,
      year: row.year,
      scenario: row.scenario,
      quoted_price: row.price,
      quoted_at: row.quotedAt,
      outcome: row.outcome,
      lost_reason: row.lostReason,
      status: 'proposed',
      source: 'server',
      evidence_ref: row.evidenceRef,
      evidence_quote: row.evidenceQuote,
      confidence: row.confidence,
    });
    classified.push({ kind: 'insert', link: link.state, key: insertKey('server', row.evidenceRef, row.price) });
  }

  const { inserted, error } = await insertProposed(supabase, toInsert);
  if (error) console.error('ops quotes insert failed:', error);

  const results = classified.map((c) => {
    if (c.kind === 'rejected') return `rejected:${c.reason}`;
    if (error) return 'rejected:db_error';
    return inserted.has(c.key) ? c.link : 'duplicate';
  });

  const counts: Record<string, number> = {};
  for (const r of results) counts[r] = (counts[r] ?? 0) + 1;

  await logOps(supabase, 'quotes.write', counts);
  return NextResponse.json({ results, counts });
}

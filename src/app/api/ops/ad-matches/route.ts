import { NextResponse } from 'next/server';
import { amsterdamDate, checkOps, logOps } from '@/lib/opsAuth';
import { matchChats, summarizeMatches, type ChatRef, type ClickRow, type JobRow } from '@/lib/opsAdMatches';
import { buildAdReportPdf } from '@/lib/opsAdReportPdf';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_CHATS = 500;
const REF = /^[A-Z0-9]{4}$/;

function readChats(body: unknown): ChatRef[] | null {
  const raw = (body as { chats?: unknown })?.chats;
  if (!Array.isArray(raw) || raw.length > MAX_CHATS) return null;
  const chats: ChatRef[] = [];
  for (const item of raw) {
    const { ref, phone, at } = (item ?? {}) as Record<string, unknown>;
    if (typeof ref !== 'string' || !REF.test(ref)) return null;
    if (typeof phone !== 'string' || typeof at !== 'string') return null;
    chats.push({ ref, phone: phone.slice(0, 32), at: at.slice(0, 32) });
  }
  return chats;
}

/**
 * Compares chats with clicks and jobs. Read only: nothing is claimed or sent to
 * Google here. `?format=pdf` returns the owner's daily report instead of JSON.
 * A POST only because the chat list is too long and too personal for a URL.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const chats = readChats(await request.json().catch(() => null));
  if (!chats) return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const [clicks, jobs, leads] = await Promise.all([
    supabase
      .from('call_clicks')
      .select('ref, gclid, wbraid, gbraid, claimed_by_job_id')
      .in('ref', chats.length ? chats.map((c) => c.ref) : ['----']),
    supabase
      .from('jobs')
      .select('id, status, customer_phone, final_price')
      .gte('created_at', new Date(Date.now() - 180 * 86_400_000).toISOString())
      .limit(5000),
    supabase
      .from('leads')
      .select('phone, phone_e164, status')
      .gte('created_at', new Date(Date.now() - 180 * 86_400_000).toISOString())
      .limit(5000),
  ]);

  const failed = clicks.error ?? jobs.error ?? leads.error;
  if (failed) {
    console.error('ops ad matches read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const matches = matchChats(chats, (clicks.data ?? []) as ClickRow[], (jobs.data ?? []) as JobRow[]);
  await logOps(supabase, 'ad_matches.read', { chats: chats.length });

  if (new URL(request.url).searchParams.get('format') === 'pdf') {
    const pdf = await buildAdReportPdf(matches, summarizeMatches(matches).counts, amsterdamDate());
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' },
    });
  }

  /* Counts only: why chats do or don't reach a job, without listing anyone. */
  const key = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '').slice(-9);
  const jobRows = (jobs.data ?? []) as JobRow[];
  const leadRows = leads.data ?? [];
  const leadKeys = new Set(leadRows.flatMap((l) => [key(l.phone), key(l.phone_e164)]).filter(Boolean));
  const diagnostics = {
    jobs: jobRows.length,
    jobsWithPhone: jobRows.filter((j) => key(j.customer_phone)).length,
    jobsFinished: jobRows.filter((j) => j.status === 'afgerond').length,
    leads: leadRows.length,
    chatsWithLead: chats.filter((c) => leadKeys.has(key(c.phone))).length,
  };
  return NextResponse.json({ ...summarizeMatches(matches), diagnostics, matches });
}

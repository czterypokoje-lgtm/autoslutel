import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_DAYS = 31;

type Turn = { role: 'agent' | 'user'; message: string };

/* Only these three metadata keys leave the CRM; the rest may hold personal data. */
function pickMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  return { handover: m.handover ?? null, last_outcome: m.last_outcome ?? null, callback_form: m.callback_form ?? null };
}

function pickTurns(transcript: unknown): Turn[] {
  if (!Array.isArray(transcript)) return [];
  const turns: Turn[] = [];
  for (const t of transcript) {
    const item = t as { role?: unknown; message?: unknown } | null;
    if (typeof item?.message !== 'string' || !item.message) continue;
    turns.push({ role: item.role === 'agent' ? 'agent' : 'user', message: item.message });
  }
  return turns;
}

/** The weekly review reads recent conversations to find what customers asked. */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const since = new Date(params.get('since') ?? '');
  if (Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: 'since moet een ISO-datum zijn' }, { status: 400 });
  }
  if (since.getTime() < Date.now() - MAX_DAYS * 86_400_000) {
    return NextResponse.json({ error: `since mag maximaal ${MAX_DAYS} dagen terug` }, { status: 400 });
  }
  const asked = Number.parseInt(params.get('limit') ?? '', 10);
  const limit = Number.isFinite(asked) ? Math.min(Math.max(asked, 1), 500) : 200;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('id, conversation_id, channel, created_at, outcome, summary, metadata, transcript')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('ops conversations read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const conversations = (data ?? []).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    channel: row.channel,
    created_at: row.created_at,
    outcome: row.outcome,
    summary: row.summary,
    metadata: pickMetadata(row.metadata),
    turns: pickTurns(row.transcript),
  }));

  await logOps(supabase, 'conversations.read', { count: conversations.length });
  return NextResponse.json({ conversations });
}

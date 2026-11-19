import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { decide, type KnowledgeRow } from '@/lib/agentKnowledge';

export const dynamic = 'force-dynamic';

/**
 * Records the owner's answer. The review job relays what the owner said; the
 * only way a row becomes a fact an agent may state.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const key = typeof body?.key === 'string' ? body.key.trim().slice(0, 120) : '';
  if (!key) return NextResponse.json({ error: 'key ontbreekt' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('agent_knowledge')
    .select('key, topic, question, answer, rule, status, asked_count, last_asked_at, example, source, approved_at')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error('ops knowledge decide read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Onbekende regel' }, { status: 404 });

  const next = decide(data as KnowledgeRow, body ?? {});
  if (typeof next === 'string') return NextResponse.json({ error: next }, { status: 400 });

  const { error: saveError } = await supabase
    .from('agent_knowledge')
    .update({
      answer: next.answer,
      rule: next.rule,
      status: next.status,
      approved_at: next.approved_at,
      source: next.source,
      updated_at: next.updated_at,
    })
    .eq('key', key);
  if (saveError) {
    console.error('ops knowledge decide save failed:', saveError.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  /* Key and decision only, never the answer text. */
  await logOps(supabase, 'knowledge.decide', { key, decision: next.status });
  return NextResponse.json({ ok: true, item: next });
}

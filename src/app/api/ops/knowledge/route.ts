import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { applyGaps, type Gap, type KnowledgeRow } from '@/lib/agentKnowledge';

export const dynamic = 'force-dynamic';

const STATUSES = ['confirmed', 'proposed', 'unknown', 'retired'];
const MAX_GAPS = 50;

/** The weekly review reads the table to see what is confirmed and what is open. */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const asked = new URL(request.url).searchParams.get('status');
  const wanted = asked
    ? asked.split(',').map((s) => s.trim()).filter((s) => STATUSES.includes(s))
    : STATUSES.filter((s) => s !== 'retired');
  if (!wanted.length) return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('agent_knowledge')
    .select('key, topic, question, answer, rule, status, asked_count, last_asked_at, example, source, updated_at')
    .in('status', wanted)
    .order('asked_count', { ascending: false })
    .limit(1000);
  if (error) {
    console.error('ops knowledge read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

/**
 * The review job reports topics where an agent had no answer. This only counts
 * and flags: it never writes an answer, and never confirms anything.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { gaps?: unknown } | null;
  if (!Array.isArray(body?.gaps) || body.gaps.length === 0 || body.gaps.length > MAX_GAPS) {
    return NextResponse.json({ error: `gaps moet 1 tot ${MAX_GAPS} items bevatten` }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('agent_knowledge').select('key, topic, status, asked_count').limit(1000);
  if (error) {
    console.error('ops knowledge gaps read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const { updates, upserts } = applyGaps((data ?? []) as KnowledgeRow[], body.gaps as Gap[]);

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from('agent_knowledge')
      .update({ asked_count: u.asked_count, last_asked_at: u.last_asked_at, updated_at: new Date().toISOString() })
      .eq('key', u.key);
    if (updateError) {
      console.error('ops knowledge bump failed:', updateError.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
  }
  if (upserts.length) {
    const { error: upsertError } = await supabase.from('agent_knowledge').upsert(upserts, { onConflict: 'key' });
    if (upsertError) {
      console.error('ops knowledge create failed:', upsertError.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
  }

  const result = { bumped: updates.length, created: upserts.length };
  await logOps(supabase, 'knowledge.gaps', result);
  return NextResponse.json(result);
}

import { NextResponse } from 'next/server';
import { checkAnyAgent } from '@/lib/agentAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { TOPICS, forAgent, isTopic, type KnowledgeRow } from '@/lib/agentKnowledge';

export const dynamic = 'force-dynamic';

/**
 * What the agents may say, read at answer time.
 *
 * Only confirmed rows come back as facts. Open rows of the same topic come back
 * as "unknown" so the agent knows not to improvise an answer to them.
 */
export async function GET(request: Request) {
  const auth = checkAnyAgent(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const topic = url.searchParams.get('topic')?.trim() || null;
  if (topic && !isTopic(topic)) {
    return NextResponse.json({ error: `topic moet een van deze zijn: ${TOPICS.join(', ')}` }, { status: 400 });
  }
  const q = url.searchParams.get('q')?.slice(0, 200) ?? null;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('agent_knowledge')
    .select('key, topic, question, answer, rule, status, asked_count, last_asked_at, example, source, approved_at')
    .in('status', ['confirmed', 'proposed', 'unknown']);
  if (topic) query = query.eq('topic', topic);
  const { data, error } = await query.order('key').limit(500);
  if (error) {
    console.error('agent knowledge read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  return NextResponse.json(forAgent((data ?? []) as KnowledgeRow[], { topic, q }));
}

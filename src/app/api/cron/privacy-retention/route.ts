import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { RETENTION_DAYS, purgeRules } from '@/lib/privacyRetention';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Nightly (vercel.json): delete AI-agent conversations past their retention
 * period (src/lib/privacyRetention.ts). The privacy policy promises these
 * periods; without this job nothing was ever deleted.
 *
 * Only agent_conversations. Inbox threads that came out of a conversation
 * (a return, a handover) belong to the customer file and follow its period.
 * Bearer CRON_SECRET, like the other crons; answers 404 on the KeyForCars
 * install (src/proxy.ts), which keeps its own conversations.
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  const named = Object.keys(RETENTION_DAYS);
  const deleted: Record<string, number> = {};
  for (const rule of purgeRules(new Date())) {
    let query = db.from('agent_conversations').delete({ count: 'exact' }).lt('created_at', rule.before);
    query = rule.channels ? query.in('channel', rule.channels) : query.not('channel', 'in', `(${named.join(',')})`);
    const { count, error } = await query;
    const label = rule.channels?.join('+') ?? 'other';
    if (error) {
      console.error(`[privacy-retention] ${label}:`, error.message);
      return NextResponse.json({ error: error.message, deleted }, { status: 500 });
    }
    deleted[label] = count ?? 0;
  }
  return NextResponse.json({ deleted });
}

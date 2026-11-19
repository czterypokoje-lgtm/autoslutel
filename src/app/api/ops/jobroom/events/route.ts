import { recordEvent, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** One row per message in or out. A repeated provider message id is a no-op. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.event', (db, body) => recordEvent(db, body));
}

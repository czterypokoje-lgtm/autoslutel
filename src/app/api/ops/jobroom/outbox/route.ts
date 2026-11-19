import { listOutbox, proposeOutbox, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Proposes one message. Shadow: stored as `proposed`, never sent. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.outbox.propose', (db, body) =>
    proposeOutbox(db, body)
  );
}

/** The queue, newest first. `?state=` filters; `?limit=` up to 200. */
export async function GET(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.outbox.list', (db, input) => {
    const params = (input as URL).searchParams;
    return listOutbox(db, params.get('state'), Number(params.get('limit') ?? 50) || 50);
  });
}

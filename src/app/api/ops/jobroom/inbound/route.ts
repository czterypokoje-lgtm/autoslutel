import { recordInbound, runOps, transportOk } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * A message arrived. Saves the sender as a contact (a known number keeps its
 * role) and logs the raw message before anything reads it. Records only.
 */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.inbound', (db, body, req) =>
    transportOk(req) ? recordInbound(db, body) : Promise.resolve({ status: 403, body: { error: 'Geen transporttoegang' } }));
}

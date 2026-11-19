import { openJobRoom, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Opens (or returns) the job room for a lead or job. Shadow: records only. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.open', (db, body) => openJobRoom(db, body));
}

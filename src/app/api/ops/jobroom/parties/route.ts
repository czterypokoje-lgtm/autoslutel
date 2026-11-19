import { addParty, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Adds a person to a job (a technician who is offered it, an assistant). The role must fit the contact. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.party.add', (db, body) => addParty(db, body));
}

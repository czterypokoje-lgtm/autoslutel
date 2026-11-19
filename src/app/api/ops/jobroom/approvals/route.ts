import { approvalSummary, decideApproval, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** The owner's summary: what waits, and what has waited over 15 minutes. */
export async function GET(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.approval.summary', (db) => approvalSummary(db));
}

/**
 * Releases or refuses one exact row. The body is a signed approval token from
 * the verified approval channel (JOBROOM_APPROVAL_SECRET); the ops token alone
 * approves nothing. Shadow: nothing is sent.
 */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.approval', (db, body) =>
    decideApproval(db, body)
  );
}

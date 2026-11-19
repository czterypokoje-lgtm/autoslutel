import { proposeInvoice, runOps, verifyInvoice } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Proposes sending one invoice to the job's customer. Goes through the outbox
 * as a tier 2 row that a person approves. Shadow: nothing is sent, Moneybird is
 * not called.
 */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.invoice.propose', (db, body) =>
    proposeInvoice(db, body)
  );
}

/** `?outboxId=`: is the invoice still the one that was approved? Checked right before attaching. */
export async function GET(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.invoice.verify', (db, input) =>
    verifyInvoice(db, (input as URL).searchParams.get('outboxId'))
  );
}

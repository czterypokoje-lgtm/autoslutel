import { NextResponse } from 'next/server';
import { offerJobToTechnicians } from '@/lib/offerJob';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Puts an existing job out to the technicians. The message holds no customer details. */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { jobId?: unknown } | null;
  const jobId = typeof body?.jobId === 'string' ? body.jobId : '';
  if (!UUID.test(jobId)) return NextResponse.json({ error: 'Ongeldige klus' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const outcome = await offerJobToTechnicians(supabase, jobId);
  await logOps(supabase, 'job.offer', { jobId, sent: outcome.sent });

  if (!outcome.ok) return NextResponse.json({ error: outcome.error ?? 'Versturen mislukt' }, { status: 400 });
  return NextResponse.json({ sent: outcome.sent, technicians: outcome.technicians });
}

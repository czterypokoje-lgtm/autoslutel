import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { summarizeBids, type BidJob, type BidRow } from '@/lib/opsBids';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Bids waiting for a decision. Read only, and without customer details. */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const { data: bids, error } = await supabase
    .from('job_offers')
    .select('id, job_id, bid_price, bid_date, bid_start, bid_end, technicians (name)')
    .is('response', null)
    .not('bid_price', 'is', null)
    .order('bid_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('ops bids read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const ids = [...new Set((bids ?? []).map((b) => b.job_id))];
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('id, status, city, car_make, car_model, car_year, service_type')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

  if (jobError) {
    console.error('ops bid jobs read failed:', jobError.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  await logOps(supabase, 'bids.read', { count: bids?.length ?? 0 });
  return NextResponse.json({
    bids: summarizeBids((bids ?? []) as unknown as BidRow[], (jobs ?? []) as BidJob[]),
  });
}

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notifyNewClickFraud } from '@/lib/clickFraudNotify';

export const dynamic = 'force-dynamic';

/**
 * Nightly: report addresses that newly count as click fraud, and prune
 * ad_visits past 90 days.
 *
 * Both jobs in one run on purpose. The prune is a privacy commitment — those
 * rows hold visitors' IP addresses — and a commitment that depends on
 * somebody remembering to add a second schedule is not a commitment.
 *
 * Same auth as /api/cron/sync-marketing: a bearer secret, and a 503 rather
 * than an open endpoint when the secret is unset. Fail closed — an unguarded
 * route here would let anyone drain the evidence table.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await notifyNewClickFraud(createSupabaseAdminClient());

    /*
     * `delivered: false` with addresses in `newly` is a real failure, not a
     * quiet night: somebody has been judged and nobody was told. It is
     * reported as 200 with the flag rather than a 500, so the cron does not
     * retry and re-send, but it is visible in the response and the logs.
     */
    return NextResponse.json({
      ok: true,
      newFraudAddresses: result.newly.length,
      addresses: result.newly,
      delivered: result.delivered,
      prunedRows: result.pruned,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/klikfraude]', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

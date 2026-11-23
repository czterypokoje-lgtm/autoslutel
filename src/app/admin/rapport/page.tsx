import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate } from '@/lib/crmJobs';
import { readReport, parseSpan } from './reportData';
import ReportView from './ReportView';

export const dynamic = 'force-dynamic';

/**
 * Prestaties: the one report to follow the business by week, month,
 * quarter or year — totals against the period before, the trend inside the
 * period, and what every technician did and earned.
 */
export default async function RapportPage({ searchParams }: { searchParams: Promise<{ p?: string; d?: string }> }) {
  await requireOfficeUser('/admin/rapport');
  const sp = await searchParams;
  const span = parseSpan(sp.p);
  const anchor = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : isoDate(new Date());

  const supabase = await createSupabaseServerClient();
  const d = await readReport(supabase, span, anchor);
  return <ReportView d={d} anchor={anchor} />;
}


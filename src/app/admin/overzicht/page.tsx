import { requireCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import OfficeOverview from './OfficeOverview';
import MonteurOverview from './MonteurOverview';
import { parsePeriod } from './dashboardData';
import KfcDashboard, { parseKfcPeriod } from './KfcDashboard';
import { IS_KEYFORCARS } from '@/config/install';

export const dynamic = 'force-dynamic';

/**
 * The homepage. One route for both roles — the office sees the business,
 * a monteur sees their day — so "go home" (the sidebar logo, or this link
 * in the nav) always means the same place regardless of who's signed in.
 */
export default async function OverzichtPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; webshop?: string }>;
}) {
  const user = await requireCrmUser('/admin/overzicht');

  const { periode, webshop } = await searchParams;
  // KeyForCars: the web-shop owner's dashboard; the locksmith office view does not apply.
  if (IS_KEYFORCARS) return <KfcDashboard period={parseKfcPeriod(webshop)} />;
  if (user.role && OFFICE_ROLES.includes(user.role)) {
    return <OfficeOverview period={parsePeriod(periode)} />;
  }

  return <MonteurOverview user={user} period={parsePeriod(periode)} />;
}

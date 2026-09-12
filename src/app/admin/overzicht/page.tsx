import { requireCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import OfficeOverview from './OfficeOverview';
import MonteurOverview from './MonteurOverview';

export const dynamic = 'force-dynamic';

/**
 * The homepage. One route for both roles — the office sees the business,
 * a monteur sees their day — so "go home" (the sidebar logo, or this link
 * in the nav) always means the same place regardless of who's signed in.
 */
export default async function OverzichtPage() {
  const user = await requireCrmUser('/admin/overzicht');

  if (user.role && OFFICE_ROLES.includes(user.role)) {
    return <OfficeOverview />;
  }

  return <MonteurOverview user={user} />;
}

import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND, IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { listStaff, ROLE_INFO, STAFF_ROLES, type StaffMember } from '@/lib/kfcStaff';
import StaffManager from './StaffManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Medewerkers | ${BRAND.name}` };

/**
 * Staff and roles. Office can read the list; only the owner changes it.
 * Warehouse installs only: that is where magazijn and inpak exist.
 */
export default async function MedewerkersPage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireOfficeUser('/admin/instellingen/medewerkers');
  let staff: StaffMember[] = [];
  let error = '';
  try {
    staff = await listStaff();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Medewerkers konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Medewerkers en rollen</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Wie mag inloggen en wat ziet die persoon. Alleen de eigenaar nodigt uit, wijzigt rollen of zet een account uit.</PreviewText>
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <StaffManager
        staff={staff}
        me={user.id}
        canManage={user.role === 'owner'}
        roles={STAFF_ROLES.map((role) => ({ role, ...ROLE_INFO[role] }))}
        monteurNote={!IS_KEYFORCARS}
      />
    </>
  );
}

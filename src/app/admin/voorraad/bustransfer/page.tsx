import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VanTransferForm from './VanTransferForm';

export const dynamic = 'force-dynamic';

export default async function VanTransferPage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/voorraad/bustransfer');
  const db = createSupabaseAdminClient();
  const [techs, bins] = await Promise.all([
    db.from('technicians').select('id, name, active').order('name'),
    db.from('kfc_locations').select('id, shelf, box').eq('warehouse', 'main').eq('kind', 'shelf').is('technician_id', null).order('shelf').order('box'),
  ]);
  if (techs.error || bins.error) throw new Error('Locaties konden niet worden geladen.');
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/rapport/voorraad" className="text-sm underline">Voorraadstand</Link>
      <Card>
        <CardHeader>
          <CardTitle>Voorraad verplaatsen</CardTitle>
          <CardDescription>Verplaats artikelen tussen het hoofdmagazijn en een servicebus.</CardDescription>
        </CardHeader>
        <CardContent><VanTransferForm technicians={techs.data} bins={bins.data} /></CardContent>
      </Card>
    </div>
  );
}

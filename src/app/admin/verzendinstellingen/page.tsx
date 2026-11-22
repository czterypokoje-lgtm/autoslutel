import { notFound } from 'next/navigation';
import { WAREHOUSE } from '@/config/install';
import { sendcloudConfigured } from '@/lib/kfcShipping';
import { postnlConfigured, postnlMissing, postnlSandbox } from '@/lib/kfcPostnl';
import { PreviewText } from '../PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { shippingTestEnabled } from '@/lib/kfcShippingTest';
import { CarrierSetup } from '../verzending/CarrierSetup';

export default async function ShippingSettingsPage() {
  if (!WAREHOUSE) notFound();
  await requireOfficeUser('/admin/verzendinstellingen');
  const missing = postnlMissing();
  return <div className="grid gap-5">
    {shippingTestEnabled ? <CarrierSetup /> : <h1 className="text-2xl font-semibold"><PreviewText>Verzendinstellingen</PreviewText></h1>}
    <section className="grid gap-1 rounded-lg border p-4">
      <h2 className="font-semibold">PostNL</h2>
      <p className="text-sm"><PreviewText>{postnlConfigured()
        ? (postnlSandbox() ? 'PostNL ingesteld op de testserver: labels zijn niet geldig' : 'PostNL ingesteld: verzendlabels komen van PostNL')
        : 'PostNL is nog niet ingesteld'}</PreviewText></p>
      {missing.length > 0 && <p className="text-destructive text-sm">Ontbreekt: {missing.join(' · ')}</p>}
      <p className="text-muted-foreground text-xs">POSTNL_API_KEY · POSTNL_CUSTOMER_CODE · POSTNL_CUSTOMER_NUMBER · POSTNL_SENDER_STREET · POSTNL_SENDER_ZIPCODE · POSTNL_SENDER_CITY</p>
    </section>
    <section className="grid gap-1 rounded-lg border p-4">
      <h2 className="font-semibold">Sendcloud</h2>
      <p className="text-sm"><PreviewText>{sendcloudConfigured() ? 'Sendcloud-sleutels ingesteld' : 'Sendcloud-sleutels ontbreken'}</PreviewText></p>
      <p className="text-muted-foreground text-xs">SENDCLOUD_PUBLIC_KEY · SENDCLOUD_SECRET_KEY</p>
    </section>
  </div>;
}

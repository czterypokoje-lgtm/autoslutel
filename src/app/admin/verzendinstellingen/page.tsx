import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { sendcloudConfigured } from '@/lib/kfcShipping';
import { PreviewText } from '../PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { shippingTestEnabled } from '@/lib/kfcShippingTest';
import { CarrierSetup } from '../verzending/CarrierSetup';

export default async function ShippingSettingsPage() {
  if (!IS_KEYFORCARS) notFound();
  await requireOfficeUser('/admin/verzendinstellingen');
  return <div className="grid gap-5">
    {shippingTestEnabled ? <CarrierSetup /> : <h1 className="text-2xl font-semibold"><PreviewText>Verzendinstellingen</PreviewText></h1>}
    <section className="grid gap-1 rounded-lg border p-4">
      <h2 className="font-semibold">Sendcloud</h2>
      <p className="text-sm"><PreviewText>{sendcloudConfigured() ? 'Sendcloud-sleutels ingesteld' : 'Sendcloud-sleutels ontbreken'}</PreviewText></p>
      <p className="text-muted-foreground text-xs">SENDCLOUD_PUBLIC_KEY · SENDCLOUD_SECRET_KEY</p>
    </section>
  </div>;
}

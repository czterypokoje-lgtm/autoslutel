import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { listSuppliers, type Supplier, type SupplierBalance } from '@/lib/kfcSuppliers';
import Leveranciers from './Leveranciers';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Leveranciers | ${BRAND.name}` };

/**
 * Supplier accounts (crediteuren): who we buy from, what we owe them, what is
 * on order. Office only: balances and prices.
 */
export default async function LeveranciersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/leveranciers');
  const params = await searchParams;
  let rows: (Supplier & SupplierBalance)[] = [];
  let error = '';
  try {
    rows = await listSuppliers();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Leveranciers konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Leveranciers</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>Crediteuren: openstaande inkoopfacturen, vervallen bedragen en wat er in bestelling staat.</PreviewText></p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : <Leveranciers rows={rows} initialQuery={params.q?.slice(0, 80) ?? ''} initialFilter={params.filter ?? 'active'} />}
    </>
  );
}

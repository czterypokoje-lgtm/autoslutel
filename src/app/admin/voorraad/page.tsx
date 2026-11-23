import { requireOfficeUser, requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { BRAND, WAREHOUSE } from '@/config/install';
import KeyForCarsStock from './KeyForCarsStock';
import VanStockPage from './VanStock';
import { stockCatalog } from '@/lib/stockCatalog';
import { inventoryView } from './inventoryViews';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Voorraad | ${BRAND.name}` };

/**
 * /admin/voorraad.
 *
 * With CRM_WAREHOUSE=1 this is the stock ledger: articles, product finder, reorder proposal, reports and
 * journal; warehouse and picker roles work here too and prices are stripped
 * server-side. Autosleutel24's own store-and-vans stock lives on at
 * /admin/voorraad/bussen (and here, while the ledger is off).
 */
export default async function VoorraadPage({ searchParams }: { searchParams: Promise<{ demo?: string; view?: string }> }) {
  if (CRM_PREVIEW || WAREHOUSE) {
    const user = await requireWarehouseUser('/admin/voorraad');
    const params = await searchParams;
    const demo = params.demo === '1';
    const view = inventoryView(params.view);
    return <KeyForCarsStock canEditPrice={seesPrices(user) && !demo && !CRM_PREVIEW} key={`${demo}/${view}`} initialCatalog={stockCatalog.slice(0, view === 'products' ? 12 : 1)} demo={demo} canLinkInvoice={!CRM_PREVIEW && !demo} view={view} />;
  }
  await requireOfficeUser('/admin/voorraad');
  return <VanStockPage />;
}

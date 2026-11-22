import { BRAND } from '@/config/install';
import VanStockPage from '../VanStock';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Magazijn en bussen | ${BRAND.name}` };

/** Autosleutel24's store-and-vans stock, at its own address once the warehouse ledger takes /admin/voorraad. */
export default function Page() {
  return <VanStockPage />;
}

import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import styles from './pim.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Master Products (PIM) | Autosleutel24',
};

export default async function PimPage() {
  await requireOfficeUser('/admin/pim');
  const supabase = await createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from('inventory_products')
    .select('id, internal_sku, product_type, car_make, car_model, fcc_id, transponder, standard_price')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load PIM products:', error);
  }

  const list = products ?? [];

  return (
    <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Master Products (PIM)</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Beheer van alle sleutels, transponders en materialen met FCC ID's en OEM nummers.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={18} />
          <input type="text" placeholder="Zoek op SKU, merk, of FCC ID..." className={styles.searchInput} />
        </div>
        <Link href="/admin/pim/nieuw" className={styles.newBtn}>
          <Plus size={18} /> Nieuw Product
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Type</th>
              <th>Voertuig</th>
              <th>FCC ID / Transponder</th>
              <th>Verkoopprijs</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Geen producten gevonden. Voeg de eerste toe.
                </td>
              </tr>
            ) : (
              list.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/pim/${p.id}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>
                      {p.internal_sku}
                    </Link>
                  </td>
                  <td><span className={styles.badge}>{p.product_type}</span></td>
                  <td>{p.car_make} {p.car_model}</td>
                  <td>
                    {p.fcc_id && <span style={{ marginRight: 8 }}>FCC: {p.fcc_id}</span>}
                    {p.transponder && <span style={{ color: '#64748b' }}>Chip: {p.transponder}</span>}
                  </td>
                  <td>{p.standard_price ? `€${p.standard_price.toFixed(2)}` : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

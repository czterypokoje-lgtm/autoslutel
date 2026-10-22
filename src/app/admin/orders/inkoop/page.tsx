import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/catalog';
import styles from '../../klanten/klanten.module.css';
import MarkOrdered from './MarkOrdered';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
/** A-Key ships free from this order value (to be confirmed for the Netherlands). */
const AKEY_FREE_FROM = 200;

type Item = { sku?: string; slug?: string; title?: string; quantity?: number; supplierCode?: string };

/**
 * The daily A-Key order: every webshop order that is paid but not yet ordered
 * at the supplier, folded into one list per A-Key article code. Ordering once
 * a day in one parcel saves A-Key's shipping on every order; "Besteld bij
 * A-Key" moves those orders to 'In behandeling' so tomorrow's list starts empty.
 */
export default async function InkoopPage() {
  await requireOfficeUser('/admin/orders/inkoop');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, items, paid_at, country')
    .eq('status', 'paid')
    .order('paid_at', { ascending: true })
    .limit(500);

  if (error) return <div className={styles.warning}>Bestellingen konden niet worden geladen: {error.message}</div>;

  const catalog = getProducts('all');
  const byCode = new Map(catalog.flatMap((p) => [[p.id, p] as const, ...(p.articleCode ? [[p.articleCode, p] as const] : [])]));

  type Line = { code: string; title: string; qty: number; cost: number | null; orders: string[] };
  const lines = new Map<string, Line>();
  const unknown: { order: string; title: string }[] = [];
  for (const o of data ?? []) {
    for (const it of ((o.items as Item[]) ?? [])) {
      const code = it.supplierCode?.trim();
      if (!code) { unknown.push({ order: o.order_number as string, title: it.title ?? it.slug ?? '?' }); continue; }
      const p = byCode.get(code);
      const line = lines.get(code) ?? { code, title: p?.title ?? it.title ?? code, qty: 0, cost: p?.costPrice ?? null, orders: [] };
      line.qty += Number(it.quantity) || 1;
      if (!line.orders.includes(o.order_number as string)) line.orders.push(o.order_number as string);
      lines.set(code, line);
    }
  }
  const rows = [...lines.values()].sort((a, b) => a.code.localeCompare(b.code));
  const total = rows.reduce((t, r) => t + (r.cost ?? 0) * r.qty, 0);
  const missing = Math.max(0, AKEY_FREE_FROM - total);
  const orderIds = (data ?? []).map((o) => o.id as string);
  const copyText = rows.map((r) => `${r.code}\t${r.qty}x\t${r.title}`).join('\n');

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>A-Key inkoop vandaag</h1>
        <span className={styles.count}>{orderIds.length} betaalde bestelling{orderIds.length === 1 ? '' : 'en'} nog niet besteld</span>
        <Link className={styles.link} href="/admin/orders">← Bestellingen</Link>
      </div>

      {rows.length === 0 ? (
        <div className={styles.warning}>Niets te bestellen: alle betaalde bestellingen zijn al besteld bij A-Key.</div>
      ) : (
        <>
          <div className={styles.warning}>
            Inkoopwaarde (catalogusprijs A-Key): <strong>{MONEY.format(total)}</strong>.{' '}
            {missing > 0
              ? <>Nog <strong>{MONEY.format(missing)}</strong> tot gratis verzending bij A-Key (vanaf {MONEY.format(AKEY_FREE_FROM)}). Vul aan met voorraad van je best verkochte artikelen, of betaal één keer verzending voor deze hele bestelling.</>
              : <>Boven {MONEY.format(AKEY_FREE_FROM)}: gratis verzending bij A-Key.</>}
          </div>

          <div className={styles.wrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>A-Key code</th><th>Aantal</th><th>Artikel (A-Key)</th><th>Inkoop p/st</th><th>Totaal</th><th>Voor bestelling</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code}>
                    <td><strong>{r.code}</strong></td>
                    <td>{r.qty}×</td>
                    <td>{r.title}</td>
                    <td>{r.cost != null ? MONEY.format(r.cost) : '—'}</td>
                    <td>{r.cost != null ? MONEY.format(r.cost * r.qty) : '—'}</td>
                    <td>{r.orders.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className={styles.title} style={{ fontSize: '1.05rem', marginTop: '1.25rem' }}>Kopieer naar A-Key</h2>
          <textarea readOnly className={styles.control} style={{ width: '100%', minHeight: 140, fontFamily: 'monospace' }} defaultValue={copyText} />

          <MarkOrdered orderIds={orderIds} />
        </>
      )}

      {unknown.length > 0 && (
        <div className={styles.warning} style={{ marginTop: '1rem' }}>
          Zonder A-Key code (zelf opzoeken): {unknown.map((u) => `${u.order}: ${u.title}`).join(' · ')}
        </div>
      )}
    </>
  );
}

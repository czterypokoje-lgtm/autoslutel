import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { sampleOrders, SHOPS, SOLD } from '@/lib/kfcSampleOrders';
import { findProfile } from '@/lib/productProfiles';
import { Card, Notice, PageHead, Table, ui } from '../_ui';
import { PreviewProductName, PreviewInput, PreviewText } from '../PreviewLanguage';
import catalog from '@/data/keyforcars-stock.json';
import { inventoryCategory, inventoryCategories } from '../voorraad/inventoryCategories';
import { dayKey } from '../overzicht/KfcDashboard';
import { rankProducts } from '../overzicht/productRanking';
import styles from '../overzicht/dashboard.module.css';

const periods = [
  { days: 1, label: 'Vandaag' },
  { days: 7, label: '7 dagen' },
  { days: 30, label: '30 dagen' },
];
const categories = new Map<string, string>(inventoryCategories.map(([id, name]) => [id, name]));
categories.set('other', 'Overige artikelen');
const categoryBySku = new Map(catalog.map(article => [article.sku, inventoryCategory(article)[0]]));
const PAGE_SIZE = 50;
const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function BestSellersPage({ searchParams }: { searchParams: Promise<{ days?: string; order?: string; shop?: string; category?: string; q?: string; min?: string; page?: string }> }) {
  await requireOfficeUser('/admin/best-verkocht');
  const query = await searchParams;
  const days = periods.find(period => String(period.days) === query.days)?.days ?? 7;
  const least = query.order === 'least';
  const shop = SHOPS.find(name => name === query.shop) ?? '';
  const category = query.category && categories.has(query.category) ? query.category : '';
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
  const quantity = Number(query.min);
  const minimum = Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1;
  const now = Date.now();
  const start = new Date(`${dayKey(now)}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const from = start.toISOString().slice(0, 10);
  const sold = sampleOrders(now).filter(order => SOLD.includes(order.status) && (!shop || shop === order.shop) && dayKey(order.created) >= from);
  const ranked = rankProducts(sold, least).filter(product =>
    product.units >= minimum && (!category || category === (categoryBySku.get(product.sku) ?? 'other')) &&
    `${product.sku} ${product.name}`.toLowerCase().includes(search.toLowerCase()));
  const lastPage = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  const requested = Number(query.page);
  const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, lastPage)) : 1;
  const href = (range: number, ascending: boolean, nextPage = 1) => `/admin/best-verkocht?${new URLSearchParams({
    days: String(range), order: ascending ? 'least' : 'most', shop, category, q: search, min: String(minimum), page: String(nextPage),
  })}`;

  return (
    <div className={styles.page}>
      <PageHead title={<PreviewText>Best verkocht</PreviewText>} />
      <Notice><PreviewText>Voorbeeldbestellingen uit de drie webshops. Alleen producten met verkoop in de gekozen periode tellen mee.</PreviewText></Notice>
      <div className={styles.orderFilters}>
        <nav className={styles.periods} aria-label="Periode">
          {periods.map(period => <Link key={period.days} href={href(period.days, least)} aria-current={days === period.days ? 'true' : undefined} className={days === period.days ? styles.periodOn : styles.period}><PreviewText>{period.label}</PreviewText></Link>)}
        </nav>
        <nav className={styles.periods} aria-label="Sortering">
          {[false, true].map(ascending => <Link key={String(ascending)} href={href(days, ascending)} aria-current={least === ascending ? 'true' : undefined} className={least === ascending ? styles.periodOn : styles.period}><PreviewText>{ascending ? 'Minst verkocht eerst' : 'Meest verkocht eerst'}</PreviewText></Link>)}
        </nav>
      </div>
      <form className={styles.salesFilters} method="get">
        <input type="hidden" name="days" value={days} /><input type="hidden" name="order" value={least ? 'least' : 'most'} />
        <label><PreviewText>Zoek op SKU of productnaam</PreviewText><PreviewInput className={ui.input} name="q" type="search" defaultValue={search} maxLength={80} /></label>
        <label><PreviewText>Webshop</PreviewText><select className={ui.input} name="shop" defaultValue={shop}>
          <option value=""><PreviewText>Alle webshops</PreviewText></option>
          {SHOPS.map(name => <option key={name}>{name}</option>)}
        </select></label>
        <label><PreviewText>Categorie</PreviewText><select className={ui.input} name="category" defaultValue={category}>
          <option value=""><PreviewText>Alle categorieën</PreviewText></option>
          {[...categories].map(([id, name]) => <option key={id} value={id}><PreviewText>{name}</PreviewText></option>)}
        </select></label>
        <label><PreviewText>Minimaal verkocht</PreviewText><input className={ui.input} name="min" type="number" min="1" step="1" defaultValue={minimum} /></label>
        <button className={`${ui.btn} ${ui.btnPrimary}`} type="submit"><PreviewText>Filters toepassen</PreviewText></button>
        <Link className={ui.btn} href="/admin/best-verkocht"><PreviewText>Filters wissen</PreviewText></Link>
      </form>
      <p className={styles.kpiFoot}>{ranked.length} <PreviewText>resultaten</PreviewText></p>
      <Card>
        {ranked.length ? <Table head={<>
          <th scope="col">SKU</th>
          <th scope="col"><PreviewText>Producten</PreviewText></th>
          <th scope="col"><PreviewText>Merk</PreviewText></th>
          <th scope="col"><PreviewText>Categorie</PreviewText></th>
          <th scope="col" className={styles.rankingNumber}><PreviewText>Stuksprijs incl. btw</PreviewText></th>
          <th scope="col"><PreviewText>Verkoop per webshop</PreviewText></th>
          <th scope="col" className={styles.rankingNumber}><PreviewText>Verkochte stuks</PreviewText></th>
        </>}>
          {ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(product => {
            const brand = findProfile(product.sku)?.brand?.trim();
            const productCategory = categories.get(categoryBySku.get(product.sku) ?? 'other') ?? 'Overige artikelen';
            const price = money.format(product.minPrice / 100);
            return <tr key={product.sku} className={styles.rankingRows}>
              <td>{product.sku}</td>
              <td><Link prefetch={false} href={`/admin/voorraad/p?q=${encodeURIComponent(product.sku)}`}><PreviewProductName sku={product.sku}>{product.name}</PreviewProductName></Link></td>
              <td>{brand || '—'}</td>
              <td><PreviewText>{productCategory}</PreviewText></td>
              <td className={styles.rankingNumber}>{product.minPrice === product.maxPrice ? price : `${price} – ${money.format(product.maxPrice / 100)}`}</td>
              <td><ul className={styles.rankingStores}>
                {[...product.stores].sort(([a], [b]) => a.localeCompare(b)).map(([store, units]) => <li key={store}>{store} <b>{units}</b></li>)}
              </ul></td>
              <td>{product.units}</td>
            </tr>;
          })}
        </Table> : <Notice><PreviewText>Geen verkochte producten in deze periode.</PreviewText></Notice>}
      </Card>
      {lastPage > 1 && <div className={styles.orderFilters}>
        {page > 1 && <Link className={ui.btn} href={href(days, least, page - 1)}><PreviewText>Vorige pagina</PreviewText></Link>}
        <span>{page} / {lastPage}</span>
        {page < lastPage && <Link className={ui.btn} href={href(days, least, page + 1)}><PreviewText>Volgende pagina</PreviewText></Link>}
      </div>}
    </div>
  );
}

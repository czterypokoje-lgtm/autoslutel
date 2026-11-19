import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProducts, shelfPrice } from '@/lib/catalog';
import styles from '../klanten/klanten.module.css';
import ProductTable, { type ProductRow } from './ProductTable';
import BulkPanel, { type CategoryStat } from './BulkPanel';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 60;

export default async function ProductenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; pub?: string; p?: string }>;
}) {
  await requireOfficeUser('/admin/producten');

  const sp = await searchParams;
  const search = (sp.q ?? '').trim().toLowerCase().slice(0, 60);
  const category = sp.cat ?? '';
  const page = Math.max(1, Number.parseInt(sp.p ?? '1', 10) || 1);

  const supabase = await createSupabaseServerClient();
  const { data: overrides, error } = await supabase
    .from('product_overrides')
    .select('*');

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <div className={styles.warning}>
        Producten konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0010_product_overrides.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  const byslug = new Map(
    (overrides ?? []).map((o) => [o.slug as string, o])
  );

  // Both audiences: the trade catalogue is gated on the site, but the office
  // still has to be able to price and hide those products.
  const all = [...getProducts('public'), ...getProducts('trade')];

  const categories = Array.from(
    new Set(all.map((p) => p.category).filter((c): c is string => Boolean(c)))
  ).sort();

  // Per category: how many there are, and how many the office has hidden.
  const stats: CategoryStat[] = Array.from(
    all.reduce((acc, p) => {
      const key = p.category ?? 'geen';
      const entry =
        acc.get(key) ??
        { category: key, total: 0, hidden: 0, akey: 0, akeyHidden: 0 };
      const isHidden = byslug.get(p.slug)?.published === false;

      entry.total += 1;
      if (isHidden) entry.hidden += 1;
      entry.akey += 1;
      if (isHidden) entry.akeyHidden += 1;

      acc.set(key, entry);
      return acc;
    }, new Map<string, CategoryStat>())
  )
    .map(([, v]) => v)
    .filter((s) => s.akey > 0)
    .sort((a, b) => b.akey - a.akey);


  const filtered = all.filter((p) => {
    if (category && p.category !== category) return false;
    if (sp.pub === 'hidden' && byslug.get(p.slug)?.published !== false) return false;
    if (sp.pub === 'edited' && !byslug.has(p.slug)) return false;
    if (!search) return true;
    return (
      p.slug.includes(search) ||
      (p.titleNl ?? '').toLowerCase().includes(search) ||
      (p.title ?? '').toLowerCase().includes(search) ||
      (p.makes ?? []).some((m) => m.toLowerCase().includes(search))
    );
  });

  const total = filtered.length;
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: ProductRow[] = slice.map((p) => {
    const o = byslug.get(p.slug);
    return {
      slug: p.slug,
      title: p.titleNl ?? p.title,
      category: p.category ?? '',
      audience: p.audience,
      makes: (p.makes ?? []).slice(0, 3),
      image: p.image ?? null,
      feedCost: p.costPrice,
      feedPrice: shelfPrice(p.costPrice),
      published: (o?.published as boolean | null) ?? null,
      priceOverride: o?.price_override != null ? Number(o.price_override) : null,
      costOverride: o?.cost_override != null ? Number(o.cost_override) : null,
      titleOverride: (o?.title_override as string) ?? null,
      trackStock: o?.track_stock === true,
      stockQuantity: o ? Number(o.stock_quantity ?? 0) : 0,
      minQuantity: o ? Number(o.min_quantity ?? 0) : 0,
      featured: o?.featured === true,
    };
  });

  const edited = (overrides ?? []).length;
  const hidden = (overrides ?? []).filter((o) => o.published === false).length;
  const lowStock = (overrides ?? []).filter(
    (o) => o.track_stock === true && Number(o.stock_quantity) <= Number(o.min_quantity)
  ).length;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Producten</h1>
        <span className={styles.count}>
          {total} van {all.length} · {edited} aangepast · {hidden} verborgen
          {lowStock > 0 && ` · ${lowStock} bijbestellen`}
        </span>
        <form className={styles.search} method="get" action="/admin/producten">
          <input
            className={styles.control}
            type="search"
            name="q"
            defaultValue={search}
            placeholder="titel, merk of slug"
          />
          <select className={styles.control} name="cat" defaultValue={category}>
            <option value="">Alle categorieën</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className={styles.control} name="pub" defaultValue={sp.pub ?? ''}>
            <option value="">Alles</option>
            <option value="edited">Alleen aangepast</option>
            <option value="hidden">Alleen verborgen</option>
          </select>
          <button className={styles.apply} type="submit">Filter</button>
        </form>
      </div>

      <BulkPanel stats={stats} />

      <ProductTable
        rows={rows}
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      />

      <div className={styles.panel} style={{ marginTop: 16 }}>
        <h2>Hoe dit werkt</h2>
        <p className={styles.note}>
          De catalogus zelf komt uit de leveranciersfeed en wordt opnieuw
          opgebouwd met <code>npm run catalog</code>. Wat je hier wijzigt wordt
          apart bewaard en overleeft die import — daarom wordt de feed nooit ter
          plekke bewerkt.
        </p>
        <p className={styles.note}>
          Zonder eigen prijs rekent de winkel <em>inkoopprijs × staffelmarge ×
          btw</em>, met een bodem van €2,95. Vul je een prijs in, dan geldt die
          en wordt de marge genegeerd — ook bij het afrekenen, niet alleen op de
          productpagina.
        </p>
        <p className={styles.note}>
          Voorraad bijhouden is per product een keuze. Staat het uit, dan is het
          product altijd te bestellen; dat klopt voor onderdelen die per klus
          worden ingekocht. Staat het aan en is de voorraad nul, dan kan het niet
          meer besteld worden.
        </p>
      </div>
    </>
  );
}

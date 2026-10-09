import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/site.config';
import {
  buildFacets,
  facetLabel,
  filterProducts,
  sortProducts,
  type FacetKey,
  type Filters,
  type SortKey,
} from '@/lib/catalog';
import { getShopProducts, type ShopProduct } from '@/lib/shopCatalog';
import {
  findForCar,
  isConsumerVisible,
  needsProgramming,
  shopMakes,
} from '@/lib/finder';
import ProductCard from '../ProductCard';
import styles from '../winkel.module.css';

/**
 * One results page for both ways in: a car, or a category.
 *
 * Two pages would duplicate the facet panel, the sort row and the grid, and
 * the two modes differ in exactly one thing — whether results are split into
 * groups by how well they match the car. So: one page, one layout, and a
 * `car` branch that groups.
 *
 * The URL is the state. Every filter is a plain `<a href>` with the whole
 * query rebuilt, so filtering works before hydration, the back button does
 * what it should, and a filtered shelf can be linked to or shared.
 */

export const revalidate = 3600;

/* ── reading the query ────────────────────────────────────────────────── */

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'prijs-oplopend', label: 'Prijs laag → hoog' },
  { key: 'prijs-aflopend', label: 'Prijs hoog → laag' },
  { key: 'naam', label: 'Naam' },
];

/** Facets offered in the sidebar, in this order. */
const FACETS: FacetKey[] = [
  'category',
  'make',
  'manufacturer',
  'condition',
  'buttons',
  'frequency',
  'chip',
  'blade',
];

const FACET_TITLES: Record<string, string> = {
  category: 'Soort onderdeel',
  make: 'Automerk',
  manufacturer: 'Fabrikant',
  condition: 'Uitvoering',
  buttons: 'Aantal knoppen',
  frequency: 'Frequentie',
  chip: 'Transponder',
  blade: 'Sleutelbaard',
};

/** Which query keys a facet maps to. */
const FACET_PARAM: Record<FacetKey, string> = {
  category: 'categorie',
  subcategory: 'subcategorie',
  make: 'merk',
  manufacturer: 'fabrikant',
  condition: 'uitvoering',
  buttons: 'knoppen',
  frequency: 'frequentie',
  chip: 'chip',
  blade: 'baard',
};

function readFilters(params: Params): Filters {
  const buttons = Number(one(params.knoppen));
  return {
    category: one(params.categorie),
    subcategory: one(params.subcategorie),
    make: one(params.merk),
    manufacturer: one(params.fabrikant),
    condition: one(params.uitvoering),
    buttons: Number.isInteger(buttons) && buttons > 0 ? buttons : undefined,
    frequency: one(params.frequentie),
    chip: one(params.chip),
    blade: one(params.baard),
    q: one(params.q),
  };
}

/**
 * Rebuilds the whole query string with one key changed.
 *
 * Clicking an active facet clears it — that is the only way back out of a
 * filter without a "wis filter" button next to every one of them.
 */
function href(params: Params, key: string, value: string | null): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const single = one(v);
    if (single && k !== key) next.set(k, single);
  }
  if (value) next.set(key, value);
  const qs = next.toString();
  return qs ? `/winkel/zoeken?${qs}` : '/winkel/zoeken';
}

/* ── metadata ─────────────────────────────────────────────────────────── */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const params = await searchParams;
  const make = one(params.merk);
  const model = one(params.model);
  const category = one(params.categorie);

  const what = category ? facetLabel('category', category) : 'Autosleutel onderdelen';
  const car = [make, model].filter(Boolean).join(' ');

  const title = car ? `${what} voor ${car}` : what;

  return {
    title: { absolute: `${title} | Autosleutel24 winkel` },
    description: car
      ? `${what} voor uw ${car}. Zie wat er volgens de leverancier op past, wat u zelf kunt monteren en wat ingeleerd moet worden.`
      : `${what} voor elk automerk. Behuizingen, baarden, batterijen en printplaten — zelf monteren of door onze monteur.`,
    /*
     * A filtered shelf must not compete with /winkel in the index: the
     * combinations are effectively unlimited and they are all thin variants
     * of the same catalogue. Canonical points home; a car-specific shelf is
     * still perfectly shareable, just not a separate indexable page.
     */
    alternates: { canonical: `${SITE_CONFIG.domain}/winkel` },
    robots: { index: false, follow: true },
  };
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default async function ZoekenPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const all = await getShopProducts('public');
  const visible = all.filter(isConsumerVisible);

  const make = one(params.merk);
  const model = one(params.model);
  const yearRaw = Number(one(params.jaar));
  const year = Number.isInteger(yearRaw) && yearRaw > 1950 ? yearRaw : undefined;
  const sort = (one(params.sort) as SortKey | undefined) ?? 'prijs-oplopend';
  const plate = one(params.kenteken);

  // A make in the URL that no article claims is a dead end, not an empty shelf.
  if (make && !shopMakes().some((m) => m.make.toLowerCase() === make.toLowerCase())) {
    notFound();
  }

  const filters = readFilters(params);

  /*
   * Facets are always counted against the *unsorted, car-unaware* visible set
   * so the numbers in the sidebar describe the catalogue rather than the
   * current grouping. buildFacets already excludes each facet's own selection
   * from its own counts, which is what keeps a chosen filter wideable again.
   */
  const facets = buildFacets(visible, filters, FACETS);

  /* ── car mode ─────────────────────────────────────────────────────── */

  if (make) {
    const results = findForCar({ make, model, year });
    const bySlug = new Map(visible.map((p) => [p.slug, p] as const));

    // findForCar works on the raw catalogue; re-attach the office's overrides
    // and apply whatever else the visitor filtered on.
    const shopOf = (slugs: { product: { slug: string }; exact: boolean }[]) => {
      const rows = slugs
        .map((m) => ({ product: bySlug.get(m.product.slug), exact: m.exact }))
        .filter((r): r is { product: ShopProduct; exact: boolean } => !!r.product);
      const filtered = rows.filter(
        (r) => filterProducts([r.product], { ...filters, make: undefined }).length > 0
      );
      const sorted = sortProducts(
        filtered.map((r) => r.product),
        sort
      );
      const exactBySlug = new Map(filtered.map((r) => [r.product.slug, r.exact]));
      return sorted.map((p) => ({ product: p, exact: exactBySlug.get(p.slug) ?? false }));
    };

    const exact = shopOf(results.exact);
    const sameMake = shopOf(results.sameMake);
    const service = shopOf(results.service);
    const total = exact.length + sameMake.length + service.length;

    const carLabel = [make, model, year].filter(Boolean).join(' ');

    return (
      <main className="container">
        <div className={styles.shell}>
          <FacetSidebar params={params} facets={facets} filters={filters} />

          <div>
            <div className={styles.resultHead}>
              <div>
                <h1 className={styles.resultTitle}>Onderdelen voor uw {carLabel}</h1>
                <p className={styles.resultCount}>
                  {total} artikelen
                  {plate ? ` · kenteken ${plate.toUpperCase()}` : ''}
                  {' · '}
                  <Link href="/winkel">andere auto kiezen</Link>
                </p>
              </div>
              <SortRow params={params} active={sort} />
            </div>

            {/*
              The visitor named a model and nothing in the catalogue names it.
              Saying so is better than showing the make-wide shelf under a
              heading that implies we checked the model.
            */}
            {results.modelUnknown ? (
              <div className={styles.empty} style={{ marginBottom: 'var(--sp-8)' }}>
                <p className={styles.emptyTitle}>
                  Onze leverancier noemt de {model} niet bij naam
                </p>
                <p className={styles.emptyText}>
                  Dat betekent niet dat er niets past. Veel onderdelen gelden voor
                  een heel merk en niet per model — die staan hieronder. Twijfelt u,
                  stuur ons een foto van uw sleutel via WhatsApp en we zeggen welke
                  u nodig heeft.
                </p>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary">
                  {SITE_CONFIG.phone}
                </a>
              </div>
            ) : null}

            {exact.length > 0 ? (
              <Group
                title={`Past op uw ${[model, year].filter(Boolean).join(' ') || make}`}
                note="Onze leverancier noemt dit model met zoveel woorden bij deze artikelen."
                rows={exact}
              />
            ) : null}

            {sameMake.length > 0 ? (
              <Group
                title={`Overige ${make}-onderdelen`}
                note={
                  `Onze leverancier noemt hier het merk en niet het model. Dat is normaal — ` +
                  `één behuizing past vaak op tientallen modellen. Vergelijk de foto met uw ` +
                  `eigen sleutel, of stuur ons een foto en wij kijken mee.`
                }
                rows={sameMake}
              />
            ) : null}

            {service.length > 0 ? (
              <Group
                title="Sleutels voor deze auto — via de monteur"
                note={
                  `Deze moeten bij de auto ingeleerd worden met apparatuur die ter plaatse ` +
                  `moet staan, dus we versturen ze niet. De prijs hiernaast is het onderdeel; ` +
                  `het inleren rekenen we erbij. Bel ${SITE_CONFIG.phone} en we komen naar u toe.`
                }
                rows={service}
              />
            ) : null}

            {total === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Niets gevonden met deze filters</p>
                <p className={styles.emptyText}>
                  De filters links staan misschien te smal. Zet ze uit, of kies een
                  ander merk.
                </p>
                <Link href={`/winkel/zoeken?merk=${encodeURIComponent(make)}`} className="btn btn-primary">
                  Alles voor {make}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  /* ── category / browse mode ───────────────────────────────────────── */

  const matched = sortProducts(filterProducts(visible, filters), sort);
  const heading = filters.category
    ? facetLabel('category', filters.category)
    : filters.q
      ? `Zoeken naar “${filters.q}”`
      : 'Alle onderdelen';

  return (
    <main className="container">
      <div className={styles.shell}>
        <FacetSidebar params={params} facets={facets} filters={filters} />

        <div>
          <div className={styles.resultHead}>
            <div>
              <h1 className={styles.resultTitle}>{heading}</h1>
              <p className={styles.resultCount}>
                {matched.length} artikelen ·{' '}
                <Link href="/winkel">zoek op uw auto</Link>
              </p>
            </div>
            <SortRow params={params} active={sort} />
          </div>

          {matched.length > 0 ? (
            <div className={styles.grid}>
              {matched.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Niets gevonden</p>
              <p className={styles.emptyText}>
                Probeer een filter uit te zetten, of begin bij uw auto — dan laten we
                zien wat erop past.
              </p>
              <Link href="/winkel" className="btn btn-primary">
                Zoek op uw auto
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function Group({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: { product: ShopProduct; exact: boolean }[];
}) {
  return (
    <section className={styles.group}>
      <header className={styles.groupHead}>
        <h2 className={styles.groupTitle}>
          {title} <span className={styles.facetCount}>({rows.length})</span>
        </h2>
        <p className={styles.groupNote}>{note}</p>
      </header>
      <div className={styles.grid}>
        {rows.map(({ product, exact }) => (
          <ProductCard
            key={product.slug}
            product={product}
            exact={exact && !needsProgramming(product)}
          />
        ))}
      </div>
    </section>
  );
}

function SortRow({ params, active }: { params: Params; active: SortKey }) {
  return (
    <div className={styles.sortRow}>
      <span className={styles.sortLabel}>Sorteer</span>
      {SORTS.map((s) => (
        <Link
          key={s.key}
          href={href(params, 'sort', s.key)}
          className={`${styles.sortLink} ${active === s.key ? styles.sortLinkActive : ''}`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}

function FacetSidebar({
  params,
  facets,
  filters,
}: {
  params: Params;
  facets: Record<string, { value: string; label: string; count: number }[]>;
  filters: Filters;
}) {
  const active = Object.entries(FACET_PARAM).filter(([key]) => {
    const value = filters[key as keyof Filters];
    return value !== undefined && value !== '';
  });

  return (
    <aside className={styles.sidebar}>
      {/* Checkbox + label: the panel opens on a phone with no JavaScript. */}
      <input
        type="checkbox"
        id="facet-toggle"
        className={styles.facetToggle}
        aria-hidden="true"
      />
      <label htmlFor="facet-toggle" className={styles.facetToggleLabel}>
        <span>Filters{active.length ? ` (${active.length})` : ''}</span>
        <span aria-hidden="true">▾</span>
      </label>

      <div className={styles.facetPanel}>
        {active.length > 0 ? (
          <div className={styles.facetGroup}>
            <Link href={href({}, 'x', null)} className={styles.sortLink}>
              Alle filters wissen
            </Link>
          </div>
        ) : null}

        {FACETS.map((key) => {
          const options = facets[key];
          if (!options?.length) return null;
          const param = FACET_PARAM[key];
          const current = one(params[param]);

          return (
            <div key={key} className={styles.facetGroup}>
              <p className={styles.facetTitle}>{FACET_TITLES[key] ?? key}</p>
              <ul className={styles.facetList}>
                {/* Twelve is enough to choose from without a scrolling wall. */}
                {options.slice(0, 12).map((o) => {
                  const isActive = !!current && current.toLowerCase() === o.value.toLowerCase();
                  return (
                    <li key={o.value}>
                      <Link
                        // Clicking the active option clears it.
                        href={href(params, param, isActive ? null : o.value)}
                        className={`${styles.facetLink} ${isActive ? styles.facetLinkActive : ''}`}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span>{o.label}</span>
                        <span className={styles.facetCount}>{o.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

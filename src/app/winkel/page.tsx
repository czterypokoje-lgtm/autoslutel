import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema } from '@/utils/schema';
import { SITE_CONFIG } from '@/config/site.config';
import { facetLabel } from '@/lib/catalog';
import { getShopProducts } from '@/lib/shopCatalog';
import { isConsumerVisible, isSellable, shopMakes, shopModels } from '@/lib/finder';
import Finder, { type FinderModel } from './Finder';
import ProductCard from './ProductCard';
import styles from './winkel.module.css';

/**
 * The shop's front door.
 *
 * It leads with the finder and not with a product grid, because the question
 * a visitor arrives with is "does this fit MY car", and a grid of 1,400
 * articles cannot answer it. Everything below the finder is a way into the
 * same catalogue for someone who would rather browse.
 */

export const metadata: Metadata = {
  title: { absolute: 'Autosleutel Onderdelen Webshop | Behuizingen, Baarden & Batterijen' },
  description:
    'Sleutelbehuizing, sleutelbaard, batterij of printplaat voor uw auto. Kies uw merk en zie wat erop past. Zelf monteren of door onze monteur laten doen.',
  alternates: { canonical: `${SITE_CONFIG.domain}/winkel` },
};

/*
 * Nothing on this page depends on the request, and the catalogue is a
 * build-time import with a small per-request overrides query on top. An hour
 * is short enough that an office price change shows up the same morning.
 */
export const revalidate = 3600;

export default async function WinkelPage() {
  const all = await getShopProducts('public');
  const visible = all.filter(isConsumerVisible);
  const sellable = visible.filter(isSellable);

  // Categories, biggest first, over what a consumer may actually buy.
  const byCategory = new Map<string, number>();
  for (const p of sellable) {
    if (!p.category) continue;
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const makes = shopMakes();

  /*
   * The model map for the finder's client-side narrowing. Built here rather
   * than in the component so the catalogue import stays on the server.
   */
  const modelsByMake: Record<string, FinderModel[]> = {};
  for (const m of makes) {
    const models = shopModels(m.make);
    if (models.length) {
      modelsByMake[m.make.toLowerCase()] = models.map(({ model, fromYear, toYear }) => ({
        model,
        fromYear,
        toYear,
      }));
    }
  }

  /*
   * "Populair" is the office's own flag, not an invented bestseller list —
   * there is no order history to compute one from yet, and a fabricated
   * ranking is exactly the kind of claim AGENTS.md rules out. With nothing
   * flagged, the section simply does not render.
   */
  const featured = sellable.filter((p) => p.featured && p.price != null).slice(0, 8);

  return (
    <main>
      <script
        id="bc-winkel"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([{ name: 'Winkel', path: '/winkel' }])),
        }}
      />

      <section className={styles.finder}>
        <div className="container">
          <Finder makes={makes} modelsByMake={modelsByMake} />
        </div>
      </section>

      {categories.length > 0 ? (
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Of kies een soort onderdeel</h2>
            <p className={styles.sectionLead}>
              {sellable.length.toLocaleString('nl-NL')} onderdelen die u zelf kunt
              monteren. Sleutels die bij de auto ingeleerd moeten worden verkopen we
              niet als pakketje — die doet onze monteur op locatie.
            </p>
            <div className={styles.tiles}>
              {categories.map(([category, count]) => (
                <Link
                  key={category}
                  href={`/winkel/zoeken?categorie=${encodeURIComponent(category)}`}
                  className={styles.tile}
                >
                  <p className={styles.tileTitle}>{facetLabel('category', category)}</p>
                  <p className={styles.tileCount}>{count} artikelen</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Uitgelicht</h2>
            <p className={styles.sectionLead}>Door ons kantoor uitgelicht.</p>
            <div className={styles.grid}>
              {featured.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Alle merken</h2>
          <p className={styles.sectionLead}>
            Het getal is wat we voor dat merk in huis hebben. Staat er een merk niet
            bij, bel ons dan — de monteur werkt op veel meer merken dan de winkel
            onderdelen voor heeft.
          </p>
          <div className={styles.makeCloud}>
            {makes.map((m) => (
              <Link
                key={m.make}
                href={`/winkel/zoeken?merk=${encodeURIComponent(m.make)}`}
                className={styles.makeChip}
              >
                {m.make}
                <span className={styles.facetCount}>{m.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Sleutel kwijt of moet hij ingeleerd worden?</h2>
          <p className={styles.sectionLead}>
            Een transpondersleutel, afstandsbediening of smart key werkt niet als hij
            uit de doos komt — hij moet aan uw auto gekoppeld worden met apparatuur die
            bij de auto moet staan. Daarom verkopen we die niet als pakketje. Onze
            monteur komt naar u toe, maakt de sleutel en leert hem in.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary">
              {SITE_CONFIG.phone}
            </a>
            <Link href="/contact" className="btn btn-outline">
              Offerte aanvragen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

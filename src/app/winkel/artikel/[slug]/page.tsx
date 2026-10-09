import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/site.config';
import { breadcrumbSchema } from '@/utils/schema';
import {
  facetLabel,
  formatPrice,
  FREE_SHIPPING_FROM,
  SHIPPING_COST,
  VAT_RATE,
} from '@/lib/catalog';
import { getShopProducts, getShopProductBySlug } from '@/lib/shopCatalog';
import { fitClass, FIT_LABEL, isConsumerVisible, needsProgramming } from '@/lib/finder';
import AddToCart from '../../AddToCart';
import styles from '../../winkel.module.css';
import detail from './artikel.module.css';

/**
 * One article.
 *
 * The page is organised around one question the grid cannot answer: what
 * does the customer have to do after the parcel arrives. For a housing the
 * answer is "swap it over" and there is a buy button. For a transponder key
 * the answer is "someone has to program it at your car" and there is no buy
 * button at all — a phone number instead. Selling the second as the first is
 * the single most expensive mistake this shop could make, so the distinction
 * is the first thing under the price and not a footnote.
 */

export const revalidate = 3600;

/*
 * Only the sellable articles are pre-rendered. The programming ones are
 * reachable and indexable — they are good landing pages for "golf sleutel
 * bijmaken" — but there are 600 of them and they end in a phone call, so
 * they can render on demand.
 */
export async function generateStaticParams() {
  const products = await getShopProducts('public');
  return products
    .filter((p) => isConsumerVisible(p) && !needsProgramming(p) && p.price != null)
    .slice(0, 500)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);
  if (!product || !isConsumerVisible(product)) return {};

  return {
    title: { absolute: `${product.metaTitle || product.titleNl} | Autosleutel24` },
    description: product.metaDescriptionNl,
    alternates: { canonical: `${SITE_CONFIG.domain}/winkel/artikel/${slug}` },
    openGraph: product.image
      ? { images: [{ url: product.image }], title: product.titleNl }
      : undefined,
  };
}

export default async function ArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);

  // Unpublished, trade-only or unknown: all a 404. A trade line must never be
  // reachable by guessing a URL.
  if (!product || !isConsumerVisible(product)) notFound();

  const fit = fitClass(product);
  const service = needsProgramming(product);
  const title = product.titleNl || product.title;
  const photos = (product.images?.length ? product.images : [product.image]).filter(
    (u): u is string => !!u
  );

  /*
   * The VAT split, shown because business customers ask for it and because
   * shelfPrice() builds the gross number from a cost price and a margin —
   * there is no second place where this could be computed differently.
   */
  const exVat = product.price != null ? product.price / (1 + VAT_RATE) : null;

  /*
   * Fitment exactly as the supplier states it, grouped by make. `content`
   * is built at catalogue-build time from their own description; `vehiclesRaw`
   * is their literal text. Both beat anything we could infer from the title.
   */
  const vehicles = product.content?.vehicles ?? [];

  return (
    <main>
      <script
        id="bc-artikel"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Winkel', path: '/winkel' },
              { name: title, path: `/winkel/artikel/${slug}` },
            ])
          ),
        }}
      />

      {/*
        Product schema only where there is a real price and a real offer.
        A "programming" article has no shippable offer, and marking one up as
        buyable is exactly the kind of thing that gets a Merchant Center
        account suspended. No GTIN is emitted because the feed has none —
        inventing one would be worse than omitting it.
      */}
      {!service && product.price != null ? (
        <script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: title,
              description: product.metaDescriptionNl,
              image: photos.length ? photos.map((u) => `${SITE_CONFIG.domain}${u}`) : undefined,
              sku: product.articleCode ?? product.slug,
              mpn: product.articleCode ?? undefined,
              brand: product.manufacturer
                ? { '@type': 'Brand', name: product.manufacturer }
                : undefined,
              offers: {
                '@type': 'Offer',
                url: `${SITE_CONFIG.domain}/winkel/artikel/${slug}`,
                priceCurrency: 'EUR',
                price: product.price.toFixed(2),
                availability: product.inStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                seller: { '@type': 'Organization', name: SITE_CONFIG.name },
              },
            }),
          }}
        />
      ) : null}

      <div className="container">
        <nav className={detail.crumbs} aria-label="Kruimelpad">
          <Link href="/winkel">Winkel</Link>
          {product.category ? (
            <>
              <span aria-hidden="true">›</span>
              <Link href={`/winkel/zoeken?categorie=${encodeURIComponent(product.category)}`}>
                {facetLabel('category', product.category)}
              </Link>
            </>
          ) : null}
        </nav>

        <div className={detail.layout}>
          {/* ── photos ─────────────────────────────────────────────── */}
          <div>
            <div className={detail.hero}>
              {photos[0] ? (
                <Image
                  src={photos[0]}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 480px"
                  quality={80}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <span className={styles.cardNoPhoto}>Geen foto beschikbaar</span>
              )}
            </div>

            {photos.length > 1 ? (
              <div className={detail.thumbs}>
                {photos.slice(0, 6).map((url) => (
                  <div key={url} className={detail.thumb}>
                    <Image
                      src={url}
                      alt={title}
                      fill
                      sizes="88px"
                      quality={60}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── the decision column ────────────────────────────────── */}
          <div>
            <h1 className={detail.title}>{title}</h1>

            {product.articleCode ? (
              <p className={detail.code}>Artikelnummer {product.articleCode}</p>
            ) : null}

            <span
              className={`${styles.badge} ${
                service ? styles.badgeProgramming : fit === 'cutting' ? styles.badgeCutting : styles.badgeSelf
              }`}
            >
              {FIT_LABEL[fit]}
            </span>

            <div className={detail.priceBlock}>
              {product.price == null ? (
                <p className={detail.priceAsk}>Prijs op aanvraag</p>
              ) : (
                <>
                  <p className={detail.price}>
                    {service ? <span className={detail.priceFrom}>vanaf </span> : null}
                    {formatPrice(product.price)}
                  </p>
                  <p className={detail.priceMeta}>
                    incl. {Math.round(VAT_RATE * 100)}% btw
                    {exVat != null ? ` · ${formatPrice(exVat)} excl. btw` : ''}
                  </p>
                </>
              )}
            </div>

            {/* ── the part that decides the sale ──────────────────── */}
            {service ? (
              <div className={detail.serviceBox}>
                <p className={detail.serviceTitle}>Dit onderdeel versturen we niet</p>
                <p className={detail.serviceText}>
                  Een sleutel als deze werkt niet uit de doos. Hij moet aan úw auto
                  gekoppeld worden met apparatuur die bij de auto moet staan — anders
                  start de auto er niet mee. Daarom doet onze monteur dit op locatie:
                  hij brengt de sleutel mee, maakt hem en leert hem in.
                </p>
                <p className={detail.serviceText}>
                  De prijs hierboven is het onderdeel. Wat het inleren kost hangt af
                  van uw auto en van of u nog een werkende sleutel heeft — dat zeggen
                  we u aan de telefoon, voordat er iemand langskomt.
                </p>
                <div className={detail.serviceActions}>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary">
                    Bel {SITE_CONFIG.phone}
                  </a>
                  <Link href="/contact" className="btn btn-outline">
                    Offerte aanvragen
                  </Link>
                </div>
              </div>
            ) : product.price == null ? (
              <div className={detail.serviceBox}>
                <p className={detail.serviceTitle}>Nog geen prijs bekend</p>
                <p className={detail.serviceText}>
                  Van dit artikel hebben we geen inkoopprijs, dus zetten we er geen
                  bedrag bij in plaats van er een te verzinnen. Bel of mail ons en we
                  zoeken het op.
                </p>
                <div className={detail.serviceActions}>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary">
                    Bel {SITE_CONFIG.phone}
                  </a>
                </div>
              </div>
            ) : (
              <>
                <AddToCart
                  slug={product.slug}
                  title={title}
                  price={product.price}
                  image={product.image}
                  inStock={product.inStock}
                />
                <ul className={detail.assurances}>
                  <li>
                    Verzending {formatPrice(SHIPPING_COST)} · gratis vanaf{' '}
                    {formatPrice(FREE_SHIPPING_FROM)}
                  </li>
                  <li>14 dagen bedenktijd (herroepingsrecht)</li>
                  {fit === 'cutting' ? (
                    <li>
                      Let op: dit is een blanco baard. Hij moet nog op uw slot gezaagd
                      worden — dat kunnen wij doen.
                    </li>
                  ) : (
                    <li>Zelf te monteren — u heeft geen monteur nodig</li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ── description, specs, fitment ──────────────────────────── */}
        <div className={detail.below}>
          <section className={detail.block}>
            <h2 className={detail.blockTitle}>Beschrijving</h2>
            {product.content?.intro?.length ? (
              product.content.intro.map((line, i) => (
                <p key={i} className={detail.text}>
                  {line}
                </p>
              ))
            ) : (
              <p className={detail.text}>{product.descriptionNl}</p>
            )}

            {/*
              Lines the supplier wrote that did not translate cleanly are shown
              in their own German rather than half in Dutch. Half-translated
              technical copy is how a customer orders the wrong chip.
            */}
            {product.supplierNote?.length ? (
              <div className={detail.supplierNote}>
                <p className={detail.supplierNoteLabel}>
                  Van de leverancier, in hun eigen woorden:
                </p>
                {product.supplierNote.map((line, i) => (
                  <p key={i} className={detail.text}>
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </section>

          {product.specs?.length ? (
            <section className={detail.block}>
              <h2 className={detail.blockTitle}>Specificaties</h2>
              <table className={detail.specs}>
                <tbody>
                  {product.specs.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {vehicles.length > 0 || product.vehiclesRaw ? (
            <section className={detail.block}>
              <h2 className={detail.blockTitle}>Past volgens de leverancier op</h2>
              {/*
                "Volgens de leverancier", not "past op". We did not test this
                on your car and the supplier's list is what we have. Saying so
                costs nothing and is the difference between an honest shop and
                a returns problem.
              */}
              <p className={detail.fitmentCaveat}>
                Dit is de lijst die onze leverancier A-Key bij dit artikel geeft. Wij
                hebben hem niet zelf op uw auto geprobeerd. Vergelijk de foto met uw
                eigen sleutel — of stuur ons een foto, dan kijken wij mee.
              </p>

              {vehicles.length > 0 ? (
                <div className={detail.fitmentGrid}>
                  {vehicles.map((v) => (
                    <div key={v.make} className={detail.fitmentMake}>
                      <p className={detail.fitmentMakeName}>{v.make}</p>
                      {v.note ? <p className={detail.fitmentNote}>{v.note}</p> : null}
                      <ul className={detail.fitmentModels}>
                        {v.models.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={detail.text}>{product.vehiclesRaw}</p>
              )}
            </section>
          ) : null}

          {product.replacedBy ? (
            <section className={detail.block}>
              <h2 className={detail.blockTitle}>Opvolger</h2>
              <p className={detail.text}>
                De leverancier geeft aan dat dit artikel is opgevolgd door{' '}
                <Link href={`/winkel/artikel/${product.replacedBy}`}>
                  {product.replacedBy}
                </Link>
                .
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

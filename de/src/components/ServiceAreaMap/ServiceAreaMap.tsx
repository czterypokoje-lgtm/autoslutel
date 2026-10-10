import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { ARRIVAL } from '@/config/arrival';
import { SITE_CONFIG } from '@/config/site.config';
import { MY_MAPS_VIEWER_URL } from '@/config/myMaps';
import InstantServiceMap from '../InstantServiceMap';
import styles from './ServiceAreaMap.module.css';

/*
 * The service area: the map, the provinces and the towns, as one section.
 *
 * Everything shown is derived from the same two records the rest of the site reads
 * (CITIES and SERVICE_REGIONS), so the provinces, the town counts and every link can
 * only point at pages that exist and are indexed. The map itself is the Google My Maps
 * map in src/config/myMaps.ts behind a tap-to-load facade; the province cards link to the
 * /regio hubs and from there to each town.
 *
 * It replaces an accordion that listed towns by search volume (so the twelve newest towns,
 * measured at 0, sat at the bottom of every list), included Noord-Brabant, which is not a
 * province the business serves, and said "46+ steden" by hand.
 */

const PER_CARD = 6;

const regions = SERVICE_REGIONS.map((region) => {
  const cities = CITIES.filter((c) => c.region === region.name && !isNoindexCity(c.slug)).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
    if (a.nlSearches !== b.nlSearches) return b.nlSearches - a.nlSearches;
    return a.city.localeCompare(b.city, 'nl');
  });
  return { ...region, cities };
});

const totalCities = regions.reduce((n, r) => n + r.cities.length, 0);

export default function ServiceAreaMap() {
  return (
    <div className={styles.root}>
      <ul className={styles.stats} aria-label="Ons werkgebied in cijfers">
        <li>
          <strong>{regions.length}</strong>
          <span>provincies</span>
        </li>
        <li>
          <strong>{totalCities}</strong>
          <span>steden en dorpen</span>
        </li>
        <li>
          <strong>{ARRIVAL.replace('min', '')}<small> min</small></strong>
          <span>ter plaatse</span>
        </li>
        <li>
          <strong>24/7</strong>
          <span>bereikbaar</span>
        </li>
      </ul>

      <div className={styles.layout}>
        <div className={styles.mapCol}>
          <InstantServiceMap />
          <a href={MY_MAPS_VIEWER_URL} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
            Open de kaart in Google Maps ↗
          </a>
        </div>

        <div className={styles.cards}>
          {regions.map((r) => {
            const shown = r.cities.slice(0, PER_CARD);
            const more = r.cities.length - shown.length;
            return (
              <article key={r.slug} className={styles.card}>
                <header className={styles.cardHead}>
                  <h3>
                    <Link href={`/regionen/${r.slug}`}>{r.label}</Link>
                  </h3>
                  <span className={styles.count}>{r.cities.length} steden</span>
                </header>
                <p className={styles.intro}>{r.intro}</p>
                <ul className={styles.chips}>
                  {shown.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/staedte/${c.slug}`}>{c.city}</Link>
                    </li>
                  ))}
                  {more > 0 && (
                    <li>
                      <Link href={`/regionen/${r.slug}`} className={styles.more}>
                        +{more} meer
                      </Link>
                    </li>
                  )}
                </ul>
                <Link href={`/regionen/${r.slug}`} className={styles.cta}>
                  Alle steden in {r.name} →
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <p>
          <strong>Staat uw plaats er niet bij?</strong> Wij komen ook naar de dorpen en gemeenten eromheen.
        </p>
        <div className={styles.footerActions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.call}>
            Bel {SITE_CONFIG.phone}
          </a>
          <Link href="/autoschluessel-nachmachen-in-der-naehe" className={styles.ghost}>
            Zoek wie er bij u in de buurt is
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { SITE_CONFIG } from '@/config/site.config';
import { MY_MAPS_VIEWER_URL } from '@/config/myMaps';
import InstantServiceMap from '../InstantServiceMap';
import styles from './ServiceAreaMap.module.css';

/*
 * Das Einsatzgebiet: Karte, Regionen und Städte als ein Abschnitt.
 *
 * Alles Gezeigte kommt aus denselben zwei Datensätzen, die auch der Rest der
 * Seite liest (CITIES und SERVICE_REGIONS). Die Regionen, die Städtezahlen und
 * jeder Link können deshalb nur auf Seiten zeigen, die es gibt und die
 * indexierbar sind — keine Zahl ist hier von Hand getippt. Das ist der Grund,
 * warum dieser Abschnitt heute vier Städte zeigt und nicht vierundzwanzig.
 *
 * Die Karte ist die statische Karte aus /api/service-map; eine interaktive
 * My-Maps-Einbettung gibt es erst, wenn eine deutsche Karte angelegt ist —
 * siehe config/myMaps.ts.
 */

const PER_CARD = 6;

const regions = SERVICE_REGIONS.map((region) => {
  const cities = CITIES.filter((c) => c.region === region.name && !isNoindexCity(c.slug)).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
    if (a.nlSearches !== b.nlSearches) return b.nlSearches - a.nlSearches;
    return a.city.localeCompare(b.city, 'de');
  });
  return { ...region, cities };
});

const totalCities = regions.reduce((n, r) => n + r.cities.length, 0);

export default function ServiceAreaMap() {
  return (
    <div className={styles.root}>
      <ul className={styles.stats} aria-label="Unser Einsatzgebiet in Zahlen">
        <li>
          <strong>{regions.length}</strong>
          <span>{regions.length === 1 ? 'Region' : 'Regionen'}</span>
        </li>
        <li>
          <strong>{totalCities}</strong>
          <span>{totalCities === 1 ? 'Stadt' : 'Städte'}</span>
        </li>
        {/*
          * Die niederländische Fassung zeigt hier "30-60 min — ter plaatse".
          * ARRIVAL ist in dieser App "kurzfristig" (siehe config/arrival.ts),
          * und die Zeile stand als ARRIVAL.replace('min', '') im Code — mit
          * dem deutschen Wert hätte dort "kurzfristig min" gestanden. Statt
          * eine Zahl zu erfinden, nennt die Kachel den Festpreis: das ist die
          * Zusage, die dieses Netz tatsächlich halten kann.
          */}
        <li>
          <strong>Festpreis</strong>
          <span>vorab am Telefon</span>
        </li>
        <li>
          <strong>24/7</strong>
          <span>erreichbar</span>
        </li>
      </ul>

      <div className={styles.layout}>
        <div className={styles.mapCol}>
          <InstantServiceMap />
          {MY_MAPS_VIEWER_URL && (
            <a href={MY_MAPS_VIEWER_URL} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
              Karte in Google Maps öffnen ↗
            </a>
          )}
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
                  <span className={styles.count}>{r.cities.length} {r.cities.length === 1 ? 'Stadt' : 'Städte'}</span>
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
                        +{more} weitere
                      </Link>
                    </li>
                  )}
                </ul>
                <Link href={`/regionen/${r.slug}`} className={styles.cta}>
                  Alle Städte in {r.name} →
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <p>
          <strong>Ihr Ort steht nicht dabei?</strong> Unsere Partner fahren auch in die
          Gemeinden ringsum — rufen Sie an, und Sie hören sofort, ob jemand zu Ihnen kommt.
        </p>
        <div className={styles.footerActions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.call}>
            {SITE_CONFIG.phone} anrufen
          </a>
          <Link href="/autoschluessel-nachmachen-in-der-naehe" className={styles.ghost}>
            Wer ist in Ihrer Nähe?
          </Link>
        </div>
      </div>
    </div>
  );
}

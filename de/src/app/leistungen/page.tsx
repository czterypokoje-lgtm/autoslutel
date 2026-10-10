import type { Metadata } from 'next';
import Link from 'next/link';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autoschlüssel-Leistungen: nachmachen, verloren, öffnen | 24/7',
  },
  description:
    'Alle Leistungen rund um den Autoschlüssel, vor Ort erledigt: nachmachen, alle Schlüssel verloren, Transponder anlernen, Keyless Go, Auto öffnen und Reparatur. Festpreis vorab inkl. MwSt.',
  alternates: { canonical: `${SITE_CONFIG.domain}/leistungen` },
};

export default function LeistungenOverviewPage() {
  /*
   * Diese Übersicht lieferte auf der niederländischen Seite lange überhaupt
   * keine strukturierten Daten — nicht einmal einen Breadcrumb —, während jede
   * ihrer Unterseiten einen vollständigen Service-Graphen trägt. Eine ItemList
   * sagt einem Crawler, dass DIESE Seite das Verzeichnis dieser Leistungen ist
   * und nicht eine weitere Seite, die zufällig auf sie verlinkt.
   *
   * hrefFor löst Weiterleitungen auf: eine URL, die weiterleitet, in
   * strukturierten Daten anzugeben, schickt einen Crawler über einen Umweg,
   * den er nicht nehmen müsste. In dieser App ist REDIRECTED_SERVICE_SLUGS
   * leer, aber die Funktion bleibt, damit das beim ersten Umzug stimmt.
   */
  const hrefFor = (slug: string) =>
    REDIRECTED_SERVICE_SLUGS.has(slug) ? '/autoschluessel-verloren' : `/leistungen/${slug}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_CONFIG.domain}/leistungen#liste`,
    name: 'Autoschlüssel-Leistungen',
    numberOfItems: DIENSTEN.length,
    itemListElement: DIENSTEN.map((dienst, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: dienst.title,
      url: `${SITE_CONFIG.domain}${hrefFor(dienst.slug)}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Leistungen', item: `${SITE_CONFIG.domain}/leistungen` },
    ],
  };

  return (
    <main>
      <script id="leistungen-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script id="leistungen-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.label}>UNSERE LEISTUNGEN</span>
          <h1>Alles rund um den Autoschlüssel</h1>
          <p className={styles.heroSub}>
            Jedes Schlüsselproblem wird dort gelöst, wo Ihr Fahrzeug steht. Keine Abschleppkosten,
            keine Wartezeit beim Vertragshändler, Festpreis vorab am Telefon.
          </p>
        </div>
      </section>

      <VerifiedReviewBanner />

      <BrandsMarquee />

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <h2 className={styles.tableTitle}>Leistungen im Überblick</h2>
        <div className={styles.tableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Leistung</th>
                <th>Was wir tun</th>
                <th>Dauer</th>
                <th className={styles.actionCol}></th>
              </tr>
            </thead>
            <tbody>
              {DIENSTEN.map((s, i) => {
                const href = hrefFor(s.slug);
                return (
                  <tr key={i}>
                    <td className={styles.serviceCell}>
                      <Link href={href} className={styles.serviceLink}>{s.title}</Link>
                    </td>
                    <td className={styles.descCell}>{s.intro.split('.')[0]}.</td>
                    <td className={styles.timeCell}>{s.duration || '30–60 Minuten'}</td>
                    <td className={styles.actionCell}>
                      <Link href={href} className={styles.moreBtn}>Details →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── RATGEBERTEXT ZU DEN LEISTUNGEN ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="seo-article-block" style={{ marginTop: 0 }}>
            <h2>Was ein Autoschlüssel-Fachbetrieb vor Ort leisten kann</h2>
            <p>
              <strong>{SITE_CONFIG.name}</strong> deckt über ein Netzwerk selbstständiger
              Fachbetriebe jeden Fall rund um den Autoschlüssel ab — vom eingeschlossenen Schlüssel
              über das abgebrochene Schlüsselblatt und das defekte Zündschloss bis zur leeren
              Batterie im Keyless-Go-Schlüssel. Gearbeitet wird dort, wo das Fahrzeug steht, rund um
              die Uhr.
            </p>
            <h3>1. Auto schadenfrei öffnen</h3>
            <p>
              Tür zugefallen, Schlüssel liegt innen auf dem Sitz oder im Kofferraum? Geöffnet wird
              mit Lishi-Decodern über den Schließzylinder. Anders als bei den Methoden, für die ein
              Abschleppdienst bekannt ist, bleibt dabei die Scheibe ganz, der Türrahmen gerade und
              das Schloss funktionsfähig — Sie zahlen also nicht hinterher noch eine Reparatur.
            </p>
            <h3>2. Autoschlüssel nachmachen und anlernen</h3>
            <p>
              Das Schlüsselblatt wird mit der CNC-Fräse auf Ihr Schließsystem gefräst, und der
              Transponder über die OBD-Schnittstelle an der Wegfahrsperre angelernt. Beides gehört
              zusammen: ein gefräster Rohling öffnet die Tür, startet aber den Motor nicht. Das ist
              der Punkt, an dem ein Schlüsseldienst ohne Fahrzeugdiagnose aufhört — und der Grund,
              warum ADAC- und Versicherer-Ratgeber schreiben, man müsse zum Hersteller.
            </p>
            <h3>3. Alle Schlüssel verloren</h3>
            <p>
              Existiert kein Schlüssel mehr, verlangt der Vertragshändler, dass das Fahrzeug zu ihm
              gebracht wird. Unser Partner öffnet es vor Ort, liest die Schlüsseldaten aus dem
              Steuergerät, fertigt einen neuen Schlüssel an und löscht die verlorenen aus der
              Wegfahrsperre — damit niemand mit ihnen mehr öffnen oder starten kann. Es dauert
              länger als ein Zweitschlüssel und kostet mehr, aber Abschleppen und Händlertermin
              entfallen.
            </p>
            <h3>4. Reparieren statt ersetzen</h3>
            <p>
              Nicht jeder Fall braucht einen neuen Schlüssel. Tasten ohne Funktion, ein gerissenes
              Gehäuse oder eine leere Batterie lassen sich meist reparieren — und das ist deutlich
              günstiger, außerdem bleibt es der Schlüssel, den Ihr Fahrzeug schon kennt.
            </p>
          </div>
        </section>

        <div className={styles.cta}>
          <h2>Sofort Hilfe nötig?</h2>
          <p>Rufen Sie an oder schreiben Sie per WhatsApp — Sie hören den Festpreis und ein Zeitfenster.</p>
          <div className={styles.ctaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="leistungen-overview-phone">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="leistungen-overview-wa">WhatsApp</a>
          </div>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import styles from './page.module.css';
import VideoEmbed from '@/components/VideoEmbed/VideoEmbed';

export const metadata: Metadata = {
  title: {
    /*
     * Auf der niederländischen Seite ist das nach der Nachmachen-Seite das
     * zweitgrößte Leck: 10.607 Impressionen bei Position 69. Die Lehre daraus
     * steht im Titel — die Suchanfrage lautet "kosten", nicht "Preisliste",
     * und der alte Titel begann mit dem Wort, das niemand tippt.
     */
    absolute: 'Autoschlüssel nachmachen Kosten | Festpreis vorab',
  },
  description:
    'Was kostet es, einen Autoschlüssel nachmachen zu lassen? Festpreis je Schlüsselart — Transponder, Klappschlüssel, Keyless Go. Alle Preise inkl. 19 % MwSt., vorab am Telefon.',
  alternates: {
    canonical: `${SITE_CONFIG.domain}/preise`,
    languages: { 'de-DE': `${SITE_CONFIG.domain}/preise` },
  },
};

/*
 * Die Preistabelle — mit einer Spalte weniger als die niederländische.
 *
 * Dort hat sie vier Spalten: Leistung, Vanaf, Tot, Toelichting, und jede Zeile
 * nennt eine Spanne (EUR 149-199, EUR 299-399 und so weiter). Diese Zahlen
 * stammen aus Jahren niederländischer Aufträge. Für Deutschland gibt es sie
 * noch nicht: der Partner nennt, was ihm der Auftrag wert ist, wir legen die
 * Marge darauf, und daraus ergibt sich der Ab-Preis (siehe site.config.ts).
 *
 * Eine Spanne zu übersetzen wäre keine Übersetzung, sondern eine Behauptung —
 * und eine Preisangabe, die am Fahrzeug nicht hält, ist in Deutschland nicht
 * nur ärgerlich, sondern ein Fall für § 5 UWG. Darum eine Preisspalte statt
 * zwei, gefüllt aus der Konfiguration, und "auf Anfrage", wo die Zahl noch
 * fehlt. Sobald die Sätze der vier Partner da sind, füllt sich die Spalte von
 * selbst.
 *
 * Die Zeilen ohne Betrag bleiben stehen, weil sie etwas anderes leisten: sie
 * sagen dem Leser, dass wir diese Arbeit überhaupt machen.
 */
type PriceItem =
  | { category: string; service?: never; price?: never; note?: never }
  | { category?: never; service: string; price?: string; note: string };

const priceRows: PriceItem[] = [
  { category: 'Autoschlüssel nachmachen (Zweitschlüssel)' },
  { service: 'Transponderschlüssel', price: preisAb('transponder'), note: 'Die meisten älteren Modelle' },
  { service: 'Klapp-/Flipschlüssel mit Funkfernbedienung', price: preisAb('klapsleutel'), note: 'VW, Audi, Seat, Škoda, Ford' },
  { service: 'Keyless Go / Smart Key', price: preisAb('smartKey'), note: 'BMW, Mercedes, Toyota, Mazda' },
  { service: 'Funkfernbedienung nachmachen', price: preisAb('remote'), note: 'Nur die Fernbedienung, Schlüssel vorhanden' },

  { category: 'Alle Autoschlüssel verloren' },
  { service: 'Transponderschlüssel, kein Original vorhanden', price: preisAb('allKeysLost'), note: 'Schlüsseldaten aus dem Steuergerät lesen' },
  { service: 'Keyless Go, kein Original vorhanden', note: 'Aufwendiger — Preis nach Marke und Baujahr' },

  { category: 'Auto öffnen (ausgeschlossen)' },
  { service: 'Fahrzeug schadenfrei öffnen', price: preisAb('unlock'), note: 'Mit Spezialwerkzeug, ohne Glasbruch' },
  { service: 'Notöffnung bei Keyless-System', note: 'Eigene Technik nötig — Preis vorab am Telefon' },

  { category: 'Reparatur (Schlüssel defekt)' },
  { service: 'Schlüsselgehäuse wechseln', price: preisAb('casing'), note: 'Elektronik bleibt, Gehäuse neu' },
  { service: 'Batterie wechseln', note: 'Inklusive Funktionsprüfung' },
  { service: 'Tasten / Mikroschalter reparieren', note: 'SMD-Löten an der Platine' },
  { service: 'Transponder ersetzen', note: 'Wenn der Chip selbst defekt ist' },

  { category: 'Zündschloss und Lenkradschloss' },
  { service: 'Zündschloss wechseln', price: preisAb('ignition'), note: 'Mechanischer Defekt, Schlüssel dreht nicht' },
  { service: 'Lenkradschloss (ELV/ESL) reparieren', note: 'Häufig bei Mercedes und BMW' },
];

/*
 * Der Zuschlag für Abend, Nacht und Wochenende ist hier nicht.
 *
 * Die niederländische Seite hatte einmal eine Tabelle mit +15 % abends und
 * samstags und +25 % nachts und sonntags — Zuschläge, die im Code nirgends
 * angewandt wurden. Das war ein Preis, den die Seite ankündigte und das System
 * nie berechnete, auf der Seite, die ein Kunde um 23 Uhr aufruft, bevor er
 * anruft.
 *
 * Für Deutschland ist das keine Auslassung, sondern das Versprechen: der Preis
 * am Telefon gilt unabhängig von der Uhrzeit. Genau davor warnen
 * Verbraucherzentralen bei Aufsperrdiensten, und es ist der Grund, warum diese
 * Zeile auf /mobiler-schluesseldienst der erste Absatz ist.
 */

/**
 * 'ab 149 €' -> 149.
 *
 * Abgeleitet aus dem String, den die Tabelle rendert, statt daneben von Hand
 * getippt: zwei Kopien desselben Preises driften auseinander, und die, die
 * niemand ansieht, ist die im Schema. So ist die Zahl, die Google liest, von
 * Bauart her die Zahl, die auf der Seite steht.
 */
const euro = (value: string | undefined): number | null => {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/*
 * Die Preisliste, maschinenlesbar.
 *
 * valueAddedTaxIncluded: TRUE — das ist der Unterschied zur niederländischen
 * Fassung, und er ist keine Geschmacksfrage. Dort steht false, weil die Seite
 * zweimal "exclusief btw" sagt. Gegenüber deutschen Verbrauchern verlangt die
 * Preisangabenverordnung Bruttopreise, also sind die Beträge hier inklusive
 * 19 % MwSt., und das Schema muss dasselbe sagen wie die Seite.
 *
 * Zeilen ohne Betrag erzeugen kein Offer: ein Offer ohne Preis ist in der
 * Rich-Result-Prüfung ein Fehler, und einen Preis zu erfinden, damit das
 * Schema vollständig aussieht, ist genau der Fehler, den diese Datei
 * vermeidet.
 */
const offers = priceRows.flatMap((row) => {
  if (!row.service) return [];
  const min = euro(row.price);
  if (min === null) return [];
  return [{
    '@type': 'Offer',
    name: row.service,
    description: row.note,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    areaServed: SITE_CONFIG.areaServedCities.map((c) => ({ '@type': 'City', name: c.name })),
    itemOffered: { '@type': 'Service', name: row.service, provider: { '@id': `${SITE_CONFIG.domain}/#localbusiness` } },
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'EUR',
      minPrice: min,
      valueAddedTaxIncluded: true,
    },
  }];
});

const offerCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  '@id': `${SITE_CONFIG.domain}/preise#preise`,
  name: `Preise ${SITE_CONFIG.name}`,
  url: `${SITE_CONFIG.domain}/preise`,
  itemListElement: offers,
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Preise', item: `${SITE_CONFIG.domain}/preise` },
  ],
};

export default function PreisePage() {
  return (
    <>
      <script id="preise-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {/* Kein leerer OfferCatalog: solange kein Betrag konfiguriert ist, gibt
          es nichts auszuzeichnen, und ein OfferCatalog ohne Offers ist in der
          Rich-Result-Prüfung ein Fehler. */}
      {offers.length > 0 && (
        <script id="preise-offers-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
      )}
      <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.label}>PREISE</p>
          <h1>Was kostet ein Autoschlüssel?</h1>
          <p className={styles.heroSub}>
            Den genauen Festpreis hören Sie <strong>vor der Anfahrt</strong> am Telefon, und
            er ändert sich am Fahrzeug nicht. Alle Beträge sind Bruttopreise{' '}
            <strong>inklusive 19 % MwSt.</strong> Weil unser Partner zu Ihrem Fahrzeug kommt,
            zahlen Sie <strong>keine Abschleppkosten</strong>.
          </p>
          <div className={styles.heroCtas}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="preise-hero-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              Festpreis erfragen
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="preise-hero-wa">Per WhatsApp anfragen</a>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Video — no VideoObject here; the watch page is /autoschluessel-verloren */}
        <section style={{ padding: '3.5rem 0' }}>
          <VideoEmbed heading="So läuft es ab — in 40 Sekunden" />
        </section>

        {/* Important disclaimer */}
        <div className={styles.disclaimer}>
          <div className={styles.disclaimerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <strong>Wichtig zu unseren Preisen</strong>
            <ul className={styles.disclaimerList}>
              <li>Die Beträge unten sind <strong>Ab-Preise</strong> — was es genau kostet, hängt von Marke, Modell, Baujahr und Schlüsselsystem ab.</li>
              <li>Alle Preise sind <strong>Bruttopreise inklusive 19 % MwSt.</strong>, wie es die Preisangabenverordnung gegenüber Verbrauchern verlangt. Was Sie hier lesen, ist der Betrag, der auf der Rechnung steht.</li>
              <li>Der Festpreis wird <strong>vor der Anfahrt am Telefon vereinbart</strong> und gilt unabhängig von Uhrzeit, Wochentag und Feiertag. Keine Nachforderung vor Ort, kein Nachtzuschlag.</li>
              <li>Die Anfahrt ist enthalten. Sagen Sie nach dem Preis nein, zahlen Sie nichts.</li>
            </ul>
          </div>
        </div>

        {/* Main price table */}
        <h2 className={styles.tableTitle}>Preisübersicht</h2>
        <div className={styles.tableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Leistung</th>
                <th>Preis (inkl. MwSt.)</th>
                <th className={styles.noteCol}>Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((row, i) => (
                row.category ? (
                  <tr key={i} className={styles.categoryRow}>
                    <td colSpan={3}><strong>{row.category}</strong></td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className={styles.serviceCell}>{row.service}</td>
                    <td className={styles.priceCell}>{row.price ?? 'auf Anfrage'}</td>
                    <td className={styles.noteCell}>{row.note}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableNote}>
          * Bruttopreise inklusive 19 % MwSt., für Einsätze in {SITE_CONFIG.serviceAreaString}.
          Den genauen Festpreis nennen wir am Telefon, nachdem Sie Marke, Modell, Baujahr und
          Schlüsselart genannt haben.
        </p>

        {/* Vertrauensabschnitt: die mobile Werkstatt und ihre Technik */}
        <div className={styles.trustSection}>
          <h2 className={styles.tableTitle}>Die mobile Werkstatt unserer Partner</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Gearbeitet wird mit Diagnose- und Anlerntechnik, nicht mit Gewalt. Die Fahrzeuge unserer
            Partner sind so ausgerüstet, dass Transponderschlüssel, Keyless-Go-Schlüssel und
            Zündschlösser in {SITE_CONFIG.serviceAreaString} vor Ort und ohne Folgeschaden erledigt
            werden können.
          </p>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autoschluessel_reparatur_mobil.webp"
                  alt="Techniker repariert das Gehäuse eines Autoschlüssels vor Ort"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Reparatur vor Ort</h3>
                <p className={styles.trustDesc}>Gerissene Gehäuse, defekte Transponder und Platinen werden dort instand gesetzt, wo das Fahrzeug steht.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autoschluessel_anlernen_vor_ort.webp"
                  alt="Neuer Autoschlüssel wird im Servicefahrzeug codiert und angelernt"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImgTop}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Anlernen vor Ort</h3>
                <p className={styles.trustDesc}>Transponder und Keyless-Go-Schlüssel werden an der Wegfahrsperre angelernt — ohne Abschleppen zum Vertragshändler.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autoschluessel_lager_alle_marken.webp"
                  alt="Lager mit Autoschlüsseln und Transpondern für verschiedene Fahrzeugmarken"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Schlüssellager für alle Marken</h3>
                <p className={styles.trustDesc}>OEM-Schlüssel, Keyless-Go-Schlüssel und Transponder im Fahrzeug — deshalb muss nichts bestellt werden.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/professionelle_diagnose_geraete.webp"
                  alt="Diagnosegerät Autel IM608 Pro zum Anlernen von Autoschlüsseln"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Werkstatttechnik</h3>
                <p className={styles.trustDesc}>Zugriff auf Steuergerät, CAS, FEM/BDC, MQB und EIS — dieselben Geräte, die eine Werkstatt einsetzt.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why cheaper */}
        <div className={styles.whyCard}>
          <h2>Warum günstiger als der Vertragshändler?</h2>
          {/*
            * Die niederländische Überschrift nennt hier "30-50 % günstiger".
            * Diese Zahl steht hier nicht: sie stammt aus niederländischen
            * Aufträgen gegen niederländische Händlerpreise, und für Deutschland
            * liegt sie nicht vor. Was unten steht, ist der GRUND, warum es
            * günstiger wird, und der gilt auch ohne Prozentangabe.
            */}
          <div className={styles.whyGrid}>
            {[
              { title: 'Kein Ausstellungsraum', desc: 'Der Partner fährt zu Ihrem Fahrzeug — keine Miete, kein Überbau.' },
              { title: 'Dieselben Geräte', desc: 'Autel IM608 Pro II, AVDI, VVDI — Werkstatttechnik, nicht Schlagschlüssel.' },
              { title: 'Keine Wartezeit', desc: 'Kein Warten auf einen Schlüssel, der auf Fahrgestellnummer bestellt wird.' },
              { title: 'Festpreis vorab', desc: 'Sie kennen den Preis, bevor jemand losfährt. Keine Nachforderung.' },
            ].map(item => (
              <div key={item.title} className={styles.whyItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RATGEBERTEXT ZU DEN PREISEN ── */}
        <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '3.5rem' }}>
          <h2>Woraus sich der Preis eines Autoschlüssels ergibt</h2>
          <p>
            Beim Nachmachen oder Ersetzen eines Autoschlüssels entscheiden technische Umstände über
            den Preis, nicht eine Pauschale. Ein einfacher Zweitschlüssel ohne Funkfernbedienung ist
            die kleinste Arbeit; ein Keyless-Go-Schlüssel verlangt Elektronik und eine
            Anlernprozedur, die der Hersteller je Baureihe anders gelöst hat.
            <strong> {SITE_CONFIG.name}</strong> nennt Ihnen deshalb vor der Anfahrt einen Festpreis
            für Ihr Fahrzeug — inklusive 19 % MwSt., und ohne Nachforderung vor Ort.
          </p>
          <h3>Warum es beim mobilen Fachbetrieb günstiger ist als beim Vertragshändler</h3>
          <p>
            Beim Vertragshändler kommen drei Dinge zusammen: der Stundensatz der Werkstatt, die
            Bestellung des Schlüssels auf Fahrgestellnummer samt Verwaltung, und — wenn kein
            Schlüssel mehr existiert — das Abschleppen zum Betrieb. Unsere Partner fahren mit
            Fräse und Diagnosetechnik zu Ihrem Fahrzeug, fräsen das Schlüsselblatt vor Ort und
            lernen den Transponder über die OBD-Schnittstelle an der Wegfahrsperre an. Damit
            entfallen Abschleppen und Wartezeit, und das ist der eigentliche Unterschied in der
            Rechnung.
          </p>
          <h3>Transponderschlüssel, Klappschlüssel und Keyless Go im Vergleich</h3>
          <p>
            Ein Transponderschlüssel startet das Fahrzeug und öffnet die Tür mechanisch — die
            günstigste Variante. Ein Klappschlüssel mit Funkfernbedienung hat zusätzlich die
            Funkelektronik für die Zentralverriegelung. Keyless Go und Smart Keys, etwa bei BMW,
            Mercedes und im VW-Konzern, verlangen das Auslesen oder Beschreiben eines Steuergeräts
            und liegen deshalb darüber. An welcher Stelle Ihr Fahrzeug steht, sagen wir Ihnen am
            Telefon, sobald Sie Marke, Modell und Baujahr nennen.
          </p>
          <h3>Zweitschlüssel gegen &quot;alle Schlüssel verloren&quot;</h3>
          <p>
            Solange noch ein funktionierender Schlüssel existiert, kann ein zweiter über die
            OBD-Schnittstelle hinzugefügt werden. Ist kein Schlüssel mehr da, muss das Schließsystem
            erst dekodiert und die Wegfahrsperre neu mit Schlüsseldaten versehen werden. Das ist
            mehr Arbeit und kostet entsprechend mehr — und es ist der Grund, warum ein
            Zweitschlüssel, solange alles funktioniert, die mit Abstand günstigste Entscheidung
            ist.
          </p>
          <h3>Versicherung und 12 Monate Garantie</h3>
          <p>
            Ob Ihre Versicherung einen verlorenen oder gestohlenen Schlüssel ersetzt, steht in Ihrer
            Police, und die Antwort ist häufiger &quot;nein&quot;, als man erwartet: die Teilkasko
            deckt den Diebstahl des Fahrzeugs, den Ersatz eines Schlüssels in der Regel nicht.
            Manche Versicherer bieten das als Zusatzbaustein an, und bei einem Wohnungseinbruch kann
            die Hausratversicherung greifen. Fragen Sie dort nach, bevor Sie damit rechnen. Von uns
            erhalten Sie in jedem Fall eine Rechnung mit ausgewiesener MwSt. und aufgeführter
            Leistung, wie sie zur Einreichung gebraucht wird, sowie zwölf Monate schriftliche
            Garantie auf jeden gelieferten Schlüssel und jedes Anlernen.
          </p>
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <h2>Festpreis für Ihr Fahrzeug?</h2>
          <p>Nennen Sie Marke, Modell, Baujahr und Schlüsselart — Sie hören den Festpreis sofort.</p>
          <div className={styles.ctaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.ctaPhone} id="preise-cta-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              {SITE_CONFIG.phone}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaWa} id="preise-cta-wa">WhatsApp</a>
            <Link href="/kontakt" className={styles.ctaContact} id="preise-cta-form">Anfrageformular</Link>
          </div>
        </div>

      </div>
    </main>
    </>
  );
}

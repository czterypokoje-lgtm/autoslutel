import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import ServiceLayout from '@/components/ServiceLayout/ServiceLayout';
import { videoSchema } from '@/components/VideoEmbed/video';
import { ARRIVAL_TITLE } from '@/config/arrival';

/*
 * Diese Seite IST die Seite für "alle Schlüssel verloren", unter der Adresse,
 * die die Suchanfrage will.
 *
 * Sie rendert dasselbe ServiceLayout wie die Leistungsseiten, aus demselben
 * DIENSTEN-Datensatz, mit basePath auf diese URL — damit jeder Canonical, jeder
 * Breadcrumb und jede Element-ID /autoschluessel-verloren sagt. Die
 * niederländische Fassung war eine Zeit lang eine handgebaute zweite Variante
 * derselben Leistung: anderer Hero, andere Abschnitte, und nur die Teile des
 * Originals, die jemand übertragen hatte. Zwei Beschreibungen einer Leistung,
 * die auseinanderdriften, von denen die vollständigere hinter einer
 * Weiterleitung verschwindet.
 *
 * DER SLUG WAR FALSCH, UND ZWAR STILL.
 *
 * Hier stand 'alle-sleutels-kwijt-auto' — der niederländische Slug. In dieser
 * App heißt der Datensatz 'alle-autoschluessel-verloren', also fand
 * DIENSTEN.find() nichts, ServiceLayout rief notFound() auf, und diese Seite
 * war eine 404. Verlinkt wird sie aus der Fußzeile jeder Seite, aus der
 * Navigation, aus der Sitemap und aus sechs weiteren Seiten; der Build lief
 * dabei ohne Fehler durch, weil eine 404 eine gültige Antwort ist. Darum
 * stammt der Slug jetzt aus der Konfiguration und nicht aus einer
 * Zeichenkette.
 */

/*
 * Aus DIENSTEN gelesen statt getippt: schreibt jemand den Slug in
 * config/leistungen.ts um, bricht hier der Typecheck, statt die Seite leise auf
 * 404 zu stellen.
 */
const SERVICE_SLUG = 'alle-autoschluessel-verloren';

const PAGE_URL = `${SITE_CONFIG.domain}/autoschluessel-verloren`;

const TITLE = `Autoschlüssel verloren? Neuer Schlüssel vor Ort | ${ARRIVAL_TITLE}`;
const DESCRIPTION =
  'Autoschlüssel verloren, beide Schlüssel weg oder kein Zweitschlüssel? Unser Partner öffnet das Fahrzeug schadenfrei und fertigt den neuen Schlüssel vor Ort an — Festpreis vorab, 24/7, alle Marken.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function AutoschluesselVerloren() {
  return (
    <>
      {/*
        * Das VideoObject gehört auf genau eine Seite, und das ist diese — aber
        * nur, wenn es ein Video gibt. videoSchema ist null, solange kein
        * deutsch gesprochenes Video vorliegt; siehe VideoEmbed/video.ts.
        */}
      {videoSchema && (
        <script
          id="verloren-video"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}
      <ServiceLayout slug={SERVICE_SLUG} basePath="/autoschluessel-verloren" />
    </>
  );
}

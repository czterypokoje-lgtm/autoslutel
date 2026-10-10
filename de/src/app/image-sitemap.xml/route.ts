import { SITE_CONFIG } from '@/config/site.config';
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';
import { DIENSTEN } from '@/config/leistungen';
import fs from 'fs';
import path from 'path';

const BASE = SITE_CONFIG.domain;

/*
 * Die Bilder-Sitemap. In robots.txt angemeldet, also holt Google sie wirklich
 * ab — und genau deshalb stand hier der teuerste übersehene Text der ganzen
 * Übersetzung.
 *
 * Was hier stand: 21 Einträge, Titel und Bildunterschriften durchgehend
 * niederländisch ("Autosleutel Bijmaken Utrecht", "Berkan Acarol, eigenaar en
 * hoofdtechnicus"), jeder mit <image:geo_location>Utrecht, Nederland</…> auf
 * einer .de-Domain, dazu ein Bild, das es nicht gibt
 * (marktplaats-…-verifiziert.webp), und /leistungen/transponder-programmeren
 * — ein niederländischer Slug, der 404 liefert. Eine Bilder-Sitemap ist keine
 * Seite; keine Übersetzungsprüfung, die auf gerenderte HTML-Seiten schaut,
 * kommt hier je vorbei. Deshalb wird sie jetzt aus den Daten gebaut statt von
 * Hand gepflegt:
 *
 *  - Seiten kommen aus DIENSTEN, also gibt es jeden Slug wirklich.
 *  - Galeriebilder kommen aus config/gallery.ts, mit genau dem Alt-Text, den
 *    die Seite auch anzeigt.
 *  - Jede Datei wird beim Start gegen /public geprüft; was fehlt, fliegt raus,
 *    statt Google eine 404 anzubieten.
 *  - Kein geo_location mehr. Die Fotos stammen aus dem niederländischen
 *    Betrieb; eine deutsche Stadt daruntersetzen wäre dieselbe Behauptung, die
 *    in gallery.ts schon aus den Alt-Texten entfernt wurde.
 */

type SitemapImage = { url: string; title: string; caption: string };

function exists(url: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', url));
}

/** Bilder, die die Startseite und /ueber-uns wirklich zeigen. */
const HOME_IMAGES: SitemapImage[] = [
  {
    url: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
    title: 'Autoschlüssel-Spezialist vor Ort',
    caption: 'Mobiler Autoschlüsseldienst: der Partner kommt mit Ausrüstung zum Fahrzeug.',
  },
  {
    url: '/images/seo/autoschluessel_nachmachen_car_keys.webp',
    title: 'Autoschlüssel nachmachen',
    caption: 'Schlüsselrohlinge und Funkschlüssel, wie sie vor Ort gefräst und angelernt werden.',
  },
  {
    url: '/images/seo/autoschluessel_anlernen_vor_ort.webp',
    title: 'Schlüssel an der Wegfahrsperre anlernen',
    caption: 'Anlernen des neuen Schlüssels an der Wegfahrsperre, am Fahrzeug statt in der Werkstatt.',
  },
  {
    url: '/images/seo/auto_tuer_oeffnen_schluesseldienst_schadenfrei.webp',
    title: 'Auto schadenfrei öffnen',
    caption: 'Öffnen der Fahrzeugtür am Schließsystem, ohne Schaden an Lack, Schloss oder Dichtung.',
  },
  {
    url: '/images/seo/autoschluessel_reparatur_mobil.webp',
    title: 'Autoschlüssel reparieren',
    caption: 'Reparatur von Funkschlüssel und Schlüsselgehäuse statt Neuanfertigung.',
  },
  {
    url: '/images/seo/professionelle_diagnose_geraete.webp',
    title: 'Diagnose- und Programmiergeräte',
    caption: 'Programmiergeräte auf Fachbetriebsniveau für das Anlernen von Schlüsseln und Transpondern.',
  },
];

const ABOUT_IMAGES: SitemapImage[] = [
  {
    url: '/images/seo/auto_schluessel_24stunden_workshop.webp',
    title: 'Rund um die Uhr erreichbar',
    caption: 'Autoschlüssel-Werkstatt: Fräsen, Anlernen und Reparatur, 24 Stunden erreichbar.',
  },
  {
    url: '/images/seo/schluesseldienst_arbeiten_24stunden.webp',
    title: 'Arbeiten am Fahrzeug',
    caption: 'Arbeit am Schließsystem vor Ort, mit Fachwerkzeug statt roher Gewalt.',
  },
  {
    url: '/images/seo/envanter.webp',
    title: 'Schlüssellager',
    caption: 'Vorrat an Schlüsselrohlingen und Transpondern für die gängigen Marken.',
  },
];

/** Die Bilder, die ServiceLayout über jeder Dienstseite zeigt. */
const SERVICE_IMAGES: SitemapImage[] = [
  {
    url: '/images/seo/autoschluessel_reparatur_hero.webp',
    title: 'Autoschlüssel-Service vor Ort',
    caption: 'Mobiler Autoschlüsseldienst am Fahrzeug, mit Festpreis vor der Anfahrt.',
  },
];

/** Die Galerie, mit genau dem Alt-Text, den /galerie anzeigt. */
const GALLERY_IMAGES: SitemapImage[] = REAL_GALLERY_PROJECTS.map((g) => ({
  url: g.src,
  title: g.alt,
  caption: g.alt,
}));

const PAGE_ENTRIES: { loc: string; images: SitemapImage[] }[] = [
  { loc: `${BASE}/`, images: HOME_IMAGES },
  { loc: `${BASE}/ueber-uns`, images: ABOUT_IMAGES },
  { loc: `${BASE}/galerie`, images: GALLERY_IMAGES },
  ...DIENSTEN.map((dienst) => ({
    loc: `${BASE}/leistungen/${dienst.slug}`,
    images: SERVICE_IMAGES,
  })),
]
  .map(({ loc, images }) => ({ loc, images: images.filter((img) => exists(img.url)) }))
  .filter((entry) => entry.images.length > 0);

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const dynamic = 'force-static';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PAGE_ENTRIES.map(({ loc, images }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
${images.map((img) => `    <image:image>
      <image:loc>${escapeXml(BASE + img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

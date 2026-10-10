import { SITE_CONFIG } from '@/config/site.config';
import { BLOG_POSTS } from '@/config/services';
import { CITIES } from '@/config/cities';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const BASE = SITE_CONFIG.domain;

// ── Core SEO images with descriptive alt/title metadata ──
const CORE_IMAGES = [
  {
    /* The home page hero. Swapped when the hero changed — an image sitemap is
       meant to list images that actually appear on a page, and the previous
       entry pointed at a file the site no longer displays anywhere. */
    url: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
    title: 'Autosleutelspecialist van Autosleutel24 op locatie',
    caption: 'Autosleutel24 — mobiele autosleutelspecialist in Utrecht, Amsterdam en Midden-Nederland',
    geo_location: 'Utrecht en Amsterdam, Nederland',
  },
  {
    url: '/autoschluessel24-schluesselnachmachen.webp',
    title: 'Autosleutel Bijmaken Utrecht',
    caption: 'Professioneel autosleutel bijmaken op locatie in Utrecht door Autosleutel24',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/hero-auto.webp',
    title: 'Auto Sleutel Service Utrecht 24/7',
    caption: 'Autosleutel24 — 24/7 mobiele autosleutel service in Utrecht en omgeving',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/auto_tuer_oeffnen_schluesseldienst_schadenfrei.webp',
    title: 'Auto Deur Openen Schadevrij Utrecht',
    caption: 'Professionele auto slotenmaker opent deur schadevrij in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/auto_schluessel_anfertigen_vor_ort.webp',
    title: 'Autosleutel Maken Op Locatie Utrecht',
    caption: 'Autosleutel programmeringsapparatuur — sleutel bijmaken op locatie in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/auto_schluessel_24stunden_workshop.webp',
    title: 'Autosleutel Werkplaats Utrecht 24 Uur',
    caption: 'Professionele autosleutel werkplaats van Autosleutel24 in Utrecht — 24/7 open',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/autoschluessel_nachmachen_car_keys.webp',
    title: 'Autosleutels Bijmaken Utrecht',
    caption: 'Diverse autosleutels voor bijmaken en programmeren in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/autoschluessel-marken-nachmachen.webp',
    title: 'Autosleutel Merken Bijmaken Utrecht en Amsterdam',
    caption: 'Autosleutel24 maakt sleutels voor alle 59 automerken waaronder BMW, Mercedes, VW, Audi, Toyota, Ford en Volvo in Utrecht en Amsterdam',
    geo_location: 'Utrecht en Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autoschluessel_anlernen_vor_ort.webp',
    title: 'Autosleutel Programmeren Utrecht Amsterdam',
    caption: 'Mobiel autosleutel programmeren op uw locatie in Utrecht en Amsterdam',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autoschluessel_reparatur_mobil.webp',
    title: 'Autosleutel Reparatie Utrecht Amsterdam',
    caption: 'Mobiele autosleutel reparatie in Utrecht en Amsterdam door Autosleutel24',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autoschluessel_lager_alle_marken.webp',
    title: 'Autosleutel Voorraad Alle Merken',
    caption: 'Grote voorraad originele autosleutels voor alle merken bij Autosleutel24',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/zuendschloss-auto-wechseln/auto_zuendschloss_reparatur_schluesseldienst.webp',
    title: 'Contactslot Auto Vervangen Utrecht',
    caption: 'Professioneel contactslot repareren en vervangen in Utrecht door slotenmaker',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/professionelle_diagnose_geraete.webp',
    title: 'Professionele Diagnose Apparatuur Autosleutel',
    caption: 'Dealer-niveau diagnose apparatuur voor autosleutel programmering — Autel, VVDI, Lonsdor',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/ersatz_autoschluessel_transponder_anlernen.webp',
    title: 'Reserve Autosleutel Transponder Programmeren Utrecht',
    caption: 'Reserve autosleutel met transponder chip programmeren in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/schluesseldienst_werkzeug_notdienst.webp',
    title: 'Slotenmaker Gereedschap Utrecht Spoed',
    caption: 'Professioneel slotenmaker gereedschap voor spoedopdrachten in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/schluesseldienst_arbeiten_24stunden.webp',
    title: 'Slotenmaker Utrecht Werkzaamheden 24 Uur',
    caption: 'Slotenmaker in Utrecht voert werkzaamheden uit op locatie — 24 uur beschikbaar',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/schluesseldienst_lager_schluessel.webp',
    title: 'Slotenmaker Voorraad Utrecht Sleutels',
    caption: 'Grote sleutelvoorraad van de slotenmaker in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/team/berkan-acarol-autoschluessel-spezialist.webp',
    title: 'Berkan Acarol — Autosleutelspecialist Utrecht',
    caption: 'Berkan Acarol, eigenaar en hoofdtechnicus van Autosleutel24',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/marktplaats-autoschluessel24-verifiziert.webp',
    title: 'Autosleutel24 Marktplaats Geverifieerd',
    caption: 'Geverifieerd Marktplaats profiel van Autosleutel24 voor extra betrouwbaarheid en reviews',
    geo_location: 'Utrecht, Nederland',
  },
];

// ── Blog post images ──
const BLOG_IMAGES = [
  {
    url: '/images/blog/auto_oeffnen_ohne_schluessel_schadenfrei.webp',
    title: 'Auto Openen Zonder Sleutel Schadevrij',
    caption: 'Schadevrij auto openen zonder sleutel door Autosleutel24',
  },
  {
    url: '/images/blog/autoschluessel_nachmachen_kosten_preisliste.webp',
    title: 'Autosleutel Bijmaken Kosten Prijslijst 2026',
    caption: 'Kostenoverzicht autosleutel bijmaken per merk — 2026 prijslijst',
  },
  {
    url: '/images/blog/autoschluessel_nachmachen_spezialist.webp',
    title: 'Autosleutel Bijmaken Specialist Utrecht',
    caption: 'Gecertificeerde autosleutelspecialist aan het werk in Utrecht',
  },
  {
    url: '/images/blog/autoschluessel_verloren_was_tun_anleitung.webp',
    title: 'Autosleutel Kwijt — Stappenplan Utrecht',
    caption: 'Stappenplan: wat te doen als u uw autosleutel kwijt bent in Utrecht',
  },
  {
    url: '/images/blog/schluessel_nachmachen_auto_mobil_service.webp',
    title: 'Autosleutel Bijmaken Mobiele Service',
    caption: 'Mobiele autosleutel bijmaken service — Autosleutel24 bij u thuis of op kantoor',
  },
  {
    url: '/images/blog/smart_key_anlernen_auto.webp',
    title: 'Smart Key Programmeren Utrecht',
    caption: 'Smart key en keyless entry sleutel programmeren in Utrecht',
  },
];

/** Files whose bytes appear under exactly one city. */
function cityOwnImages(): Set<string> {
  const seen = new Map<string, string[]>();
  for (const city of CITIES) {
    for (let i = 1; i <= 8; i++) {
      const rel = `/images/cities/${city.slug}/autosleutel-bijmaken-${city.slug}-${i}.webp`;
      const abs = path.join(process.cwd(), 'public', rel);
      if (!fs.existsSync(abs)) continue;
      const hash = crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex');
      seen.set(hash, [...(seen.get(hash) ?? []), rel]);
    }
  }
  const own = new Set<string>();
  for (const paths of seen.values()) if (paths.length === 1) own.add(paths[0]!);
  return own;
}

let ownCache: Set<string> | null = null;

function cityImageEntries() {
  ownCache ??= cityOwnImages();
  const own = ownCache;
  return CITIES.map((city) => ({
    loc: `${BASE}/staedte/${city.slug}`,
    images: Array.from({ length: 8 })
      .map((_, i) => `/images/cities/${city.slug}/autosleutel-bijmaken-${city.slug}-${i + 1}.webp`)
      .filter((url) => own.has(url))
      .map((url, i) => ({
        url,
        title: `Autosleutel Bijmaken ${city.city} - Foto ${i + 1}`,
        caption: `Professioneel autosleutel bijmaken en programmeren in ${city.city}`,
        geo_location: `${city.city}, ${city.region}, Nederland`,
      })),
  })).filter((entry) => entry.images.length > 0);
}

// ── Page entries: url → its image(s) ──
const PAGE_ENTRIES = [
  {
    loc: `${BASE}/`,
    images: [
      CORE_IMAGES[0], CORE_IMAGES[2], CORE_IMAGES[7],
      CORE_IMAGES[4], CORE_IMAGES[3], CORE_IMAGES[17], CORE_IMAGES[18],
    ],
  },
  {
    loc: `${BASE}/ueber-uns`,
    images: [
      CORE_IMAGES[5], CORE_IMAGES[11], CORE_IMAGES[14], CORE_IMAGES[17], CORE_IMAGES[18],
    ],
  },
  {
    loc: `${BASE}/leistungen/autoschluessel-nachmachen`,
    images: [CORE_IMAGES[4], CORE_IMAGES[13], CORE_IMAGES[9]],
  },
  {
    loc: `${BASE}/leistungen/transponder-programmeren`,
    images: [CORE_IMAGES[13], CORE_IMAGES[8]],
  },
  {
    loc: `${BASE}/leistungen/keyless-go-schluessel`,
    images: [CORE_IMAGES[8], CORE_IMAGES[1]],
  },
  {
    loc: `${BASE}/leistungen`,
    images: [CORE_IMAGES[10], CORE_IMAGES[11]],
  },

  ...BLOG_POSTS.map((post) => ({
    loc: `${BASE}/blog/${post.slug}`,
    images: [BLOG_IMAGES[0]],
  })),

  /*
   * City gallery images — only the ones that belong to that city.
   *
   * Two filters, and the second is the point.
   *
   * It exists on disk: this block used to emit 8 URLs per city regardless,
   * and 17 cities have no directory at all, so 136 of the URLs handed to
   * Google were 404s — concentrated in the newest regions, exactly the pages
   * that most need to be crawled cleanly.
   *
   * And it is not the same photograph as another city's: 384 files across 48
   * cities were 8 stock images copied and renamed per city. Telling Google
   * "Autosleutel Bijmaken Breda - Foto 1" about a picture also filed as
   * Gouda's, Bussum's and forty-five others' is an image-duplication signal
   * laid on top of the text one. A shared photo can stay on the page as
   * decoration; it has no business being declared as that city's.
   *
   * Computed once per process rather than per request — 394 small reads at
   * module load, none afterwards — and self-maintaining: as real job photos
   * replace stock, coverage grows with no list to keep up to date.
   */
  ...cityImageEntries(),
];

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
      <image:caption>${escapeXml(img.caption)}</image:caption>${(img as any).geo_location ? `
      <image:geo_location>${escapeXml((img as any).geo_location)}</image:geo_location>` : ''}
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

import { SITE_CONFIG } from '@/config/site.config';
import { BLOG_POSTS } from '@/config/services';

const BASE = 'https://www.autosleutel24.nl';

// ── Core SEO images with descriptive alt/title metadata ──
const CORE_IMAGES = [
  {
    url: '/autosleutel-bijmaken-utrecht-amsterdam-mobiel.webp',
    title: 'Autosleutel Bijmaken Utrecht en Amsterdam',
    caption: 'Autosleutel24 — mobiele autosleutelspecialist in Utrecht, Amsterdam en Midden-Nederland',
    geo_location: 'Utrecht en Amsterdam, Nederland',
  },
  {
    url: '/autosleutel24-sleutelbijmaken-utrecht.webp',
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
    url: '/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp',
    title: 'Auto Deur Openen Schadevrij Utrecht',
    caption: 'Professionele auto slotenmaker opent deur schadevrij in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/auto_sleutel_maken_op_locatie_utrecht.webp',
    title: 'Autosleutel Maken Op Locatie Utrecht',
    caption: 'Autosleutel programmeringsapparatuur — sleutel bijmaken op locatie in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/auto_sleutel_utrecht_24uur_workshop.webp',
    title: 'Autosleutel Werkplaats Utrecht 24 Uur',
    caption: 'Professionele autosleutel werkplaats van Autosleutel24 in Utrecht — 24/7 open',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp',
    title: 'Autosleutels Bijmaken Utrecht',
    caption: 'Diverse autosleutels voor bijmaken en programmeren in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/autosleutel-merken-bijmaken-utrecht-amsterdam.webp',
    title: 'Autosleutel Merken Bijmaken Utrecht en Amsterdam',
    caption: 'Autosleutel24 maakt sleutels voor alle 38 automerken waaronder BMW, Mercedes, VW, Audi, Toyota, Ford en Volvo in Utrecht en Amsterdam',
    geo_location: 'Utrecht en Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autosleutel_programmeren_op_locatie_utrecht_amsterdam.webp',
    title: 'Autosleutel Programmeren Utrecht Amsterdam',
    caption: 'Mobiel autosleutel programmeren op uw locatie in Utrecht en Amsterdam',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autosleutel_reparatie_utrecht_amsterdam_mobiel.webp',
    title: 'Autosleutel Reparatie Utrecht Amsterdam',
    caption: 'Mobiele autosleutel reparatie in Utrecht en Amsterdam door Autosleutel24',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/autosleutel_voorraad_alle_merken_utrecht_amsterdam.webp',
    title: 'Autosleutel Voorraad Alle Merken',
    caption: 'Grote voorraad originele autosleutels voor alle merken bij Autosleutel24 Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/contactslot_reparatie_vervangen_utrecht_slotenmaker.webp',
    title: 'Contactslot Reparatie Utrecht',
    caption: 'Professioneel contactslot repareren en vervangen in Utrecht door slotenmaker',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/professionele_diagnose_apparatuur_utrecht_amsterdam.webp',
    title: 'Professionele Diagnose Apparatuur Autosleutel',
    caption: 'Dealer-niveau diagnose apparatuur voor autosleutel programmering — Autel, VVDI, Lonsdor',
    geo_location: 'Utrecht, Amsterdam, Nederland',
  },
  {
    url: '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp',
    title: 'Reserve Autosleutel Transponder Programmeren Utrecht',
    caption: 'Reserve autosleutel met transponder chip programmeren in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/slotenmaker_gereedschap_utrecht_spoed.webp',
    title: 'Slotenmaker Gereedschap Utrecht Spoed',
    caption: 'Professioneel slotenmaker gereedschap voor spoedopdrachten in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/slotenmaker_utrecht_werkzaamheden_24uur.webp',
    title: 'Slotenmaker Utrecht Werkzaamheden 24 Uur',
    caption: 'Slotenmaker in Utrecht voert werkzaamheden uit op locatie — 24 uur beschikbaar',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/slotenmaker_voorraad_utrecht_sleutels.webp',
    title: 'Slotenmaker Voorraad Utrecht Sleutels',
    caption: 'Grote sleutelvoorraad van de slotenmaker in Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp',
    title: 'Berkan Acarol — Autosleutelspecialist Utrecht',
    caption: 'Berkan Acarol, eigenaar en hoofdtechnicus van Autosleutel24 Utrecht',
    geo_location: 'Utrecht, Nederland',
  },
  {
    url: '/images/seo/marktplaats-autosleutel24-verifieerd.webp',
    title: 'Autosleutel24 Marktplaats Geverifieerd',
    caption: 'Geverifieerd Marktplaats profiel van Autosleutel24 voor extra betrouwbaarheid en reviews',
    geo_location: 'Utrecht, Nederland',
  },
];

// ── Blog post images ──
const BLOG_IMAGES = [
  {
    url: '/images/blog/auto_openen_zonder_sleutel_schadevrij.png',
    title: 'Auto Openen Zonder Sleutel Schadevrij',
    caption: 'Schadevrij auto openen zonder sleutel door Autosleutel24 Utrecht',
  },
  {
    url: '/images/blog/autosleutel_bijmaken_kosten_prijslijst.png',
    title: 'Autosleutel Bijmaken Kosten Prijslijst 2026',
    caption: 'Kostenoverzicht autosleutel bijmaken per merk — 2026 prijslijst',
  },
  {
    url: '/images/blog/autosleutel_bijmaken_specialist_utrecht.png',
    title: 'Autosleutel Bijmaken Specialist Utrecht',
    caption: 'Gecertificeerde autosleutelspecialist aan het werk in Utrecht',
  },
  {
    url: '/images/blog/autosleutel_kwijt_wat_nu_stappenplan.png',
    title: 'Autosleutel Kwijt — Stappenplan Utrecht',
    caption: 'Stappenplan: wat te doen als u uw autosleutel kwijt bent in Utrecht',
  },
  {
    url: '/images/blog/sleutel_bijmaken_auto_mobiele_service.png',
    title: 'Autosleutel Bijmaken Mobiele Service',
    caption: 'Mobiele autosleutel bijmaken service — Autosleutel24 bij u thuis of op kantoor',
  },
  {
    url: '/images/blog/smart_key_programmeren_utrecht_auto.png',
    title: 'Smart Key Programmeren Utrecht',
    caption: 'Smart key en keyless entry sleutel programmeren in Utrecht',
  },
];

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
    loc: `${BASE}/over-ons`,
    images: [
      CORE_IMAGES[5], CORE_IMAGES[11], CORE_IMAGES[14], CORE_IMAGES[17], CORE_IMAGES[18],
    ],
  },
  {
    loc: `${BASE}/diensten/autosleutel-bijmaken`,
    images: [CORE_IMAGES[4], CORE_IMAGES[13], CORE_IMAGES[9]],
  },
  {
    loc: `${BASE}/diensten/transponder-programmeren`,
    images: [CORE_IMAGES[13], CORE_IMAGES[8]],
  },
  {
    loc: `${BASE}/diensten/smart-key-programmeren`,
    images: [CORE_IMAGES[8], CORE_IMAGES[1]],
  },
  {
    loc: `${BASE}/diensten/contactslot-reparatie`,
    images: [CORE_IMAGES[10], CORE_IMAGES[11]],
  },

  ...BLOG_POSTS.map((post) => ({
    loc: `${BASE}/blog/${post.slug}`,
    images: [BLOG_IMAGES[0]],
  })),
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

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BRANDS } from '@/config/brands';
import { CITIES } from '@/config/cities';
import { DIENSTEN } from '@/config/diensten';
import { SITE_CONFIG } from '@/config/site.config';
import { CityBrandView } from './CityBrandView';
import { CityServiceView } from './CityServiceView';

// ── helpers ────────────────────────────────────────────────
function getBrandFromSlug(slug: string) {
  return BRANDS.find(b => `${b.nameSlug}-sleutel-programmeren` === slug);
}
function getServiceFromSlug(slug: string) {
  return DIENSTEN.find(s => s.slug === slug);
}

// ── generateStaticParams — covers BOTH brand slugs AND service slugs ────────
export async function generateStaticParams() {
  const params: { citySlug: string; slug: string }[] = [];

  for (const city of CITIES) {
    // Brand combos
    for (const brand of BRANDS) {
      const eligible =
        (city.priority === 'P1' && (brand.priority === 'P1' || brand.priority === 'P2')) ||
        (city.priority === 'P2' && brand.priority === 'P1') ||
        (city.priority === 'P3' && brand.priority === 'P1');
      if (eligible) {
        params.push({ citySlug: city.slug, slug: `${brand.nameSlug}-sleutel-programmeren` });
      }
    }
    // Service combos — all services for all P1+P2 cities; core 5 for P3
    const coreSlugs = ['alle-sleutels-kwijt-auto', 'sleutel-bijmaken', 'transponder-sleutel-programmeren', 'smart-key-programmeren', 'contact-reparatie'];
    const services = city.priority === 'P3'
      ? DIENSTEN.filter(s => coreSlugs.includes(s.slug))
      : DIENSTEN;
    for (const service of services) {
      params.push({ citySlug: city.slug, slug: service.slug });
    }
  }
  return params;
}

// ── generateMetadata ────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ citySlug: string; slug: string }> }): Promise<Metadata> {
  const { citySlug, slug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) return {};

  const brand = getBrandFromSlug(slug);
  if (brand) {
    return {
      title: `${brand.name} Sleutel Programmeren ${city.city} | Mobiel | ${SITE_CONFIG.name}`,
      description: `${brand.name} autosleutel programmering in ${city.city}. ${brand.system.split('/')[0]}. Mobiel aan huis. ${city.travelTime} reactietijd. Goedkoper dan dealer. Bel: ${SITE_CONFIG.phone}`,
      alternates: { canonical: `${SITE_CONFIG.domain}/steden/${citySlug}/${slug}` },
    };
  }

  const service = getServiceFromSlug(slug);
  if (service) {
    return {
      title: `${service.title} ${city.city} | 24/7 Mobiel | ${SITE_CONFIG.name}`,
      description: `${service.title} in ${city.city}. Mobiel aan huis. ${city.travelTime} reactietijd. ${service.metaDesc}`,
      alternates: { canonical: `${SITE_CONFIG.domain}/steden/${citySlug}/${slug}` },
    };
  }

  return {};
}

// ── Page component ──────────────────────────────────────────
export default async function CitySlugPage({ params }: { params: Promise<{ citySlug: string; slug: string }> }) {
  const { citySlug, slug } = await params;

  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) notFound();

  // Try brand first
  const brand = getBrandFromSlug(slug);
  if (brand) {
    return <CityBrandView citySlug={citySlug} brandSlug={slug} city={city} brand={brand} />;
  }

  // Try service
  const service = getServiceFromSlug(slug);
  if (service) {
    return <CityServiceView citySlug={citySlug} serviceSlug={slug} city={city} service={service} />;
  }

  notFound();
}

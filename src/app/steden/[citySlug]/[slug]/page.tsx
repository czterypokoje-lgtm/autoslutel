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
  return BRANDS.find(b => `${b.nameSlug}-autosleutel-bijmaken` === slug);
}
function getServiceFromSlug(slug: string) {
  return DIENSTEN.find(s => s.slug === slug);
}

// ── generateStaticParams — covers BOTH brand slugs AND service slugs ────────
export async function generateStaticParams() {
  const params: { citySlug: string; slug: string }[] = [];

  for (const city of CITIES) {
    // Brand combos — only for P1 core regional hubs
    if (city.priority === 'P1') {
      for (const brand of BRANDS) {
        if (brand.priority === 'P1' || brand.priority === 'P2') {
          params.push({ citySlug: city.slug, slug: `${brand.nameSlug}-autosleutel-bijmaken` });
        }
      }
    }

    // Service combos — all services for P1 hubs; core services for P2 towns
    const coreSlugs = ['alle-sleutels-kwijt-auto', 'sleutel-bijmaken', 'transponder-programmeren', 'smart-key-programmeren', 'contactslot-reparatie'];
    const services = city.priority === 'P1'
      ? DIENSTEN
      : DIENSTEN.filter(s => coreSlugs.includes(s.slug));

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
      title: {
        absolute: `${brand.name} Sleutel Bijmaken ${city.city} | Autosleutel24`,
      },
      description: `${brand.name} autosleutel bijmaken & programmeren in ${city.city}. Autosleutel Specialist — ${brand.system.split('/')[0]}. Mobiel ter plaatse. ${city.travelTime} reactietijd. Tot 50% goedkoper dan dealer. Bel: ${SITE_CONFIG.phone}`,
      alternates: { canonical: `${SITE_CONFIG.domain}/steden/${citySlug}/${slug}` },
    };
  }

  const service = getServiceFromSlug(slug);
  if (service) {
    return {
      title: {
        absolute: `${service.title} ${city.city} | Autosleutel24`,
      },
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

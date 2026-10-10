import type { Metadata } from 'next';
import { clampMeta } from '@/lib/meta';
import ServiceLayout from '@/components/ServiceLayout/ServiceLayout';
import { notFound } from 'next/navigation';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import SplitHero from '@/components/SplitHero/SplitHero';
import GalleryMarquee from '@/components/GallerySlider/GalleryMarquee';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import GallerySlider from '@/components/GallerySlider/GallerySlider';
import FeatureCards from '@/components/FeatureCards/FeatureCards';
import Image from 'next/image';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import { getBaseLocalBusinessSchema } from '@/utils/schema';
import { captionFromFilename } from '@/lib/imageCaption';
import styles from './page.module.css';
import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
  return DIENSTEN.filter(s => !REDIRECTED_SERVICE_SLUGS.has(s.slug)).map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) return {};
  const pageUrl = `${SITE_CONFIG.domain}/leistungen/${slug}`;
  return {
    /*
     * metaTitle first. All 17 services carry a hand-written one and this
     * template ignored every single one of them, generating a title from
     * `title` instead -- which is the short NAV label, not a page title.
     *
     * That was not only wasted copy. alle-sleutels-kwijt-auto has
     * title: 'Autosleutel Kwijt', so it published "Autosleutel Kwijt | 24/7
     * Mobiel | Autosleutel24" and competed with /autoschluessel-verloren for the
     * exact query that page exists to win, while its own metaTitle -- "Alle
     * Autosleutels Kwijt? | AKL Specialist op Locatie" -- sat unused.
     *
     * The generated form stays as the fallback for a service added without
     * one. There, two suffixes fit behind a short title and not a long one,
     * so "24/7 Mobiel" gives way rather than the brand being truncated off.
     */
    title: {
      absolute:
        service.metaTitle ??
        (service.title.length > 30
          ? `${service.title} | Autosleutel24`
          : `${service.title} | 24/7 Mobiel | Autosleutel24`),
    },
    description: clampMeta(service.metaDesc),
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${service.title} | Mobiel & Schadevrij ter Plaatse`,
      description: clampMeta(service.metaDesc),
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${service.title} — Autosleutel24` }],
    },
  };
}


/*
 * The page body lives in ServiceLayout because /autoschluessel-verloren renders the
 * same thing under its own URL. basePath tells it which one it is on.
 */
export default async function DienstPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DIENSTEN.some((s) => s.slug === slug)) notFound();
  return <ServiceLayout slug={slug} basePath={`/leistungen/${slug}`} />;
}

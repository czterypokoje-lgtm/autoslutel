import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import ServiceLayout from '@/components/ServiceLayout/ServiceLayout';
import { videoSchema } from '@/components/VideoEmbed/video';
import { ARRIVAL, ARRIVAL_TITLE } from '@/config/arrival';

/*
 * This page IS the AKL service page, at the URL the query wants.
 *
 * /diensten/alle-sleutels-kwijt-auto 301s here, and for a while this page was
 * a hand-built version of it: a different hero, different sections, and only
 * the parts of the original I had got round to copying. That is the same
 * mistake in a new place -- two descriptions of one service, drifting apart,
 * with the older and fuller one hidden behind a redirect.
 *
 * So it renders the same ServiceLayout the service pages render, from the same
 * DIENSTEN record, with basePath pointing at this URL so every canonical,
 * breadcrumb and element id says /autosleutel-kwijt. The service's own title
 * is "Autosleutel Kwijt", so the headings read as they should.
 *
 * The one thing that is this page's alone is the VideoObject: it is the
 * video's watch page. The player itself arrives with FeatureCards inside the
 * layout, so there is exactly one.
 */

const SERVICE_SLUG = 'alle-sleutels-kwijt-auto';

export const metadata: Metadata = {
  title: { absolute: `Autosleutel Kwijt? Binnen ${ARRIVAL_TITLE} | Vanaf €${SITE_CONFIG.prices.allKeysLost}` },
  description: `Autosleutel kwijt, beide sleutels weg of geen reservesleutel? Binnen ${ARRIVAL} ter plaatse, nieuwe sleutel vanaf €${SITE_CONFIG.prices.allKeysLost}. 24/7, alle merken.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    title: `Autosleutel Kwijt? Binnen ${ARRIVAL_TITLE} | Vanaf €${SITE_CONFIG.prices.allKeysLost}`,
    description: `Autosleutel kwijt en geen reserve? Nieuwe sleutel ter plaatse, vanaf €${SITE_CONFIG.prices.allKeysLost}. Alle merken, 24/7.`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel Kwijt — Autosleutel24' }],
  },
};

export default function AutosleutelKwijt() {
  return (
    <>
      <script
        id="kwijt-video"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <ServiceLayout slug={SERVICE_SLUG} basePath="/autosleutel-kwijt" />
    </>
  );
}

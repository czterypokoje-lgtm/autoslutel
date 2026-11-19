import type { Metadata } from 'next';
import { businessRef } from '@/utils/schema';
import { SITE_CONFIG } from '@/config/site.config';
import AfspraakForm from '@/components/AfspraakForm/AfspraakForm';

export const metadata: Metadata = {
  title: {
    absolute: `Afspraak Maken | ${SITE_CONFIG.fullName}`,
  },
  description: `Plan uw afspraak voor een autosleutel bij ${SITE_CONFIG.fullName}. Laat uw gegevens, kenteken en plaats achter — wij bellen u snel terug om alles af te stemmen.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/afspraak`,
  },
};

const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': `${SITE_CONFIG.domain}/afspraak#contactpage`,
  url: `${SITE_CONFIG.domain}/afspraak`,
  name: 'Afspraak Maken — Autosleutel24',
  inLanguage: 'nl-NL',
  mainEntity: businessRef,
};

export default function AfspraakPage() {
  return (
    <main style={{ padding: '3rem 1.5rem', background: 'var(--navy-900)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <AfspraakForm />
    </main>
  );
}

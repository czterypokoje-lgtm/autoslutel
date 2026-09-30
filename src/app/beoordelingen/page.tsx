import type { Metadata } from 'next';
import Link from 'next/link';
import GoogleReviewsCta, { REVIEWS } from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel24 Reviews | 5,0★ Klantbeoordelingen',
  },
  description: `Lees echte reviews van klanten over ${SITE_CONFIG.fullName}. Sleutel bijgemaakt of kwijt? Zie de beoordelingen op ons Google-bedrijfsprofiel.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/beoordelingen` },
};

export default function BeoordelingenPage() {
  /*
   * Review and AggregateRating markup, on this page ONLY.
   *
   * The old note here said the markup had to wait for real review bodies to
   * be on the page. They are now — GoogleReviewsCta renders eight, copied
   * from the Google profile — so the condition is met and the same array is
   * marked up rather than a second, retyped copy of it.
   *
   * What this will NOT do is put stars in Google's results. Reviews a
   * business publishes about itself on LocalBusiness or Organization are
   * self-serving and ineligible for the star rich result; that is why
   * LocalBusinessSchema.tsx deliberately carries no aggregateRating. The
   * value here is for answer engines that read structured data directly. The
   * stars customers see come from the Google Business Profile.
   *
   * Two rules kept honest:
   *   - the two reviews Google itself truncates with "…" are left out. A
   *     marked-up body that stops mid-sentence misrepresents what the person
   *     wrote.
   *   - no datePublished. The source has "2 weken geleden" and nothing more;
   *     a date derived from that would be invented, and an invented date in
   *     structured data is worse than an absent one.
   */
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.domain}/#localbusiness`,
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.domain,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE_CONFIG.rating,
      /* Ten, not eight: two five-star reviews on the profile carry no written
         text, so they are counted but not quoted. */
      reviewCount: SITE_CONFIG.reviewCount,
      bestRating: '5',
      worstRating: '1',
    },
    review: REVIEWS.filter((r) => !r.text.includes('…')).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewBody: r.text,
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Beoordelingen', item: `${SITE_CONFIG.domain}/beoordelingen` },
    ],
  };

  return (
    <main>
      <script
        id="beoordelingen-review-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">BEOORDELINGEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Klantbeoordelingen</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f59e0b' }}>{SITE_CONFIG.rating}</span>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '4px' }}>★★★★★</div>
            
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <GoogleReviewsCta />

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href={SITE_CONFIG.social.google} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" id="all-google-reviews">
            Schrijf uw beoordeling op Google →
          </a>
        </div>
      </div>
    </main>
  );
}

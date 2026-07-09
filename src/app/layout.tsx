import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
});
import Navigation from '@/components/Navigation/Navigation';
import Footer from '@/components/Footer/Footer';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import UrgencyBanner from '@/components/UrgencyBanner/UrgencyBanner';
import StickyCallBar from '@/components/StickyCallBar/StickyCallBar';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: {
    default: 'Autosleutel Bijmaken & Programmeren Utrecht | Mobiele Sleutelmaker 24/7',
    template: `%s | ${SITE_CONFIG.name} | Bel 06 11 75 12 31`,
  },
  description: `Autosleutel kwijt of defect? Professionele mobiele autosleutelspecialist in Utrecht, Amsterdam, Almere & heel Nederland. Alle merken. Zelfde dag service. Goedkoper dan dealer. Bel: ${SITE_CONFIG.phone}`,
  keywords: [
    'autosleutelbijmaken', 'autosleutel24', 'autosleutejkwijt', 'autosleutel kwijt',
    'autosleutel bijmaken', 'autosleutel programmeren', 'reservesleutel auto bijmaken',
    'mobiele autoslotenmaker', 'autosleutel bijmaken utrecht', 'transponder sleutel programmeren',
    'BMW autosleutel bijmaken', 'Mercedes sleutel programmeren', 'Volkswagen autosleutel bijmaken',
    'autosleutel bijmaken kosten', 'autosleutel bijmaken amsterdam', 'sleutelmaker 24 uur',
    'autosleutel laten bijmaken', 'autosleutel specialist utrecht', 'klapsleutel bijmaken',
    'smart key programmeren', 'autosleutel bijmaken almere', 'autosleutel bijmaken amersfoort',
  ],
  alternates: {
    canonical: SITE_CONFIG.domain,
    languages: {
      'nl-NL': SITE_CONFIG.domain,
      'x-default': SITE_CONFIG.domain,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: SITE_CONFIG.domain,
    siteName: SITE_CONFIG.name,
    title: 'Autosleutel Bijmaken & Programmeren | Mobiele Specialist 24/7',
    description: 'Mobiele autosleutelspecialist voor alle merken. Utrecht, Amsterdam, Almere & omstreken. Zelfde dag. Goedkoper dan dealer. Bel nu.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel24 — Mobiele Autosleutelspecialist Utrecht Amsterdam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autosleutel Bijmaken & Programmeren | Autosleutel24 Utrecht',
    description: 'Mobiele autosleutelspecialist voor alle merken. 24/7 service. Bel 06 11 75 12 31',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_ID', // Replace after verifying in GSC
  },
};

// ── LocalBusiness Schema (replaces Organization — critical for Local Pack) ──
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
  '@id': `${SITE_CONFIG.domain}/#localbusiness`,
  name: SITE_CONFIG.name,
  alternateName: 'Autosleutel24 Utrecht',
  description: 'Professionele mobiele autosleutelspecialist voor alle merken en modellen. Autosleutel bijmaken, transponder programmeren, smart key bijmaken en auto openen. Werkzaam in Utrecht, Amsterdam, Almere, Amersfoort en heel Nederland.',
  url: SITE_CONFIG.domain,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_CONFIG.domain}/logo.png`,
    width: 200,
    height: 60,
  },
  image: `${SITE_CONFIG.domain}/og-image.png`,
  telephone: SITE_CONFIG.phoneTel,
  email: SITE_CONFIG.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE_CONFIG.address.street,
    addressLocality: SITE_CONFIG.address.city,
    addressRegion: SITE_CONFIG.address.region,
    postalCode: SITE_CONFIG.address.postal,
    addressCountry: SITE_CONFIG.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: parseFloat(SITE_CONFIG.geo.lat),
    longitude: parseFloat(SITE_CONFIG.geo.lng),
  },
  hasMap: `https://maps.google.com/?q=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}`,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  ],
  areaServed: [
    { '@type': 'City', 'name': 'Utrecht', 'sameAs': 'https://en.wikipedia.org/wiki/Utrecht' },
    { '@type': 'City', 'name': 'Amsterdam', 'sameAs': 'https://en.wikipedia.org/wiki/Amsterdam' },
    { '@type': 'City', 'name': 'Almere' },
    { '@type': 'City', 'name': 'Amersfoort' },
    { '@type': 'City', 'name': 'Hilversum' },
    { '@type': 'City', 'name': 'Bussum' },
    { '@type': 'City', 'name': 'Nieuwegein' },
    { '@type': 'City', 'name': 'Houten' },
    { '@type': 'City', 'name': 'Zeist' },
    { '@type': 'City', 'name': 'Maarssen' },
    { '@type': 'City', 'name': 'Amstelveen' },
    { '@type': 'City', 'name': 'Diemen' },
    { '@type': 'City', 'name': 'Naarden' },
    { '@type': 'City', 'name': 'Weesp' },
    { '@type': 'City', 'name': 'Leusden' },
    { '@type': 'City', 'name': 'Baarn' },
    { '@type': 'City', 'name': 'Soest' },
    { '@type': 'City', 'name': 'IJsselstein' },
    { '@type': 'City', 'name': 'Vianen' },
    { '@type': 'City', 'name': 'Woerden' },
    { '@type': 'City', 'name': 'Alphen aan den Rijn' },
  ],
  priceRange: '€€',
  paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'iDEAL', 'Pin'],
  currenciesAccepted: 'EUR',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: SITE_CONFIG.rating,
    reviewCount: SITE_CONFIG.reviewCount,
    bestRating: '5',
    worstRating: '1',
  },
  sameAs: [
    SITE_CONFIG.social.facebook,
    SITE_CONFIG.social.instagram,
    SITE_CONFIG.social.google,
    `https://www.kvk.nl/zoeken/?source=all&q=${SITE_CONFIG.kvk}`,
  ],
  foundingDate: '2020',
  vatID: SITE_CONFIG.btw,
  legalName: SITE_CONFIG.fullName,
  identifier: {
    '@type': 'PropertyValue',
    name: 'KVK',
    value: SITE_CONFIG.kvk,
  },
};

// ── WebSite Schema (enables Google Sitelinks Searchbox) ──
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_CONFIG.domain}/#website`,
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.domain,
  description: 'Mobiele autosleutelspecialist — alle merken — 24/7',
  inLanguage: 'nl-NL',
  publisher: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_CONFIG.domain}/?s={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/* ── iubenda Cookie Solution & Privacy Controls — MUST be first in <head> ── */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="text/javascript"
          src="https://embeds.iubenda.com/widgets/c53c352b-ed07-4c5b-b461-8b542ddd3aaf.js"
        />

        <meta name="theme-color" content="#0d2137" />

        {/* ── GEO META TAGS — Local SEO signals for Google & Bing ── */}
        <meta name="geo.region" content="NL-UT" />
        <meta name="geo.placename" content="Utrecht, Nederland" />
        <meta name="geo.position" content="52.0907;5.1214" />
        <meta name="ICBM" content="52.0907, 5.1214" />

        {/* ── BUSINESS META TAGS — Open Graph extensions ── */}
        <meta property="business:contact_data:street_address" content={SITE_CONFIG.address.street} />
        <meta property="business:contact_data:locality" content={SITE_CONFIG.address.city} />
        <meta property="business:contact_data:postal_code" content={SITE_CONFIG.address.postal} />
        <meta property="business:contact_data:country_name" content="Nederland" />
        <meta property="business:contact_data:phone_number" content={SITE_CONFIG.phoneTel} />
        <meta property="business:contact_data:email" content={SITE_CONFIG.email} />
        <meta property="business:contact_data:website" content={SITE_CONFIG.domain} />

        {/* ── SERVICE TYPE META ── */}
        <meta name="classification" content="Autosleutelspecialist, Slotenmaker, Auto Locksmith" />
        <meta name="category" content="Automotive, Locksmith Services, Mobile Car Key Programming" />
        <meta name="coverage" content="Utrecht, Amsterdam, Almere, Amersfoort, Nederland" />
        <meta name="distribution" content="Local" />
        <meta name="rating" content="4.9/5 — 247 Google Reviews" />
        <meta name="revisit-after" content="3 days" />

        {/* ── GOOGLE BUSINESS PROFILE LINK ── */}
        <link rel="me" href={SITE_CONFIG.social.google} />

        {/* ── FONTS ── */}
        {/* Font loading moved to next/font/google */}
        {/* ── STRUCTURED DATA ── */}
        <script
          id="schema-localbusiness"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={ibmPlexSans.className}>
        <UrgencyBanner />
        <Navigation />
        {children}
        <Footer />
        <WhatsAppButton />
        <StickyCallBar />
      </body>
    </html>
  );
}

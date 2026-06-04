import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation/Navigation';
import Footer from '@/components/Footer/Footer';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import UrgencyBanner from '@/components/UrgencyBanner/UrgencyBanner';
import StickyCallBar from '@/components/StickyCallBar/StickyCallBar';
import { SITE_CONFIG } from '@/config/site.config';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: {
    default: 'Autosleutel Expert | Mobiele Sleutelprogrammering | Alle Merken | 24/7',
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: 'Professionele mobiele autosleutelprogrammering in heel Nederland en België. Alle merken en modellen. Zelfde dag service. Bel: 06-XX XX XX XX',
  keywords: ['autosleutel programmeren', 'autosleutel kwijt', 'mobiele autoslotenmaker', 'sleutel bijmaken eindhoven', 'transponder sleutel programmeren', 'BMW sleutel programmeren', 'Mercedes sleutel programmeren'],
  alternates: { canonical: SITE_CONFIG.domain },
  openGraph: {
    type: 'website', locale: 'nl_NL', url: SITE_CONFIG.domain, siteName: SITE_CONFIG.name,
    title: 'Autosleutel Expert | Mobiele Sleutelprogrammering | Alle Merken',
    description: 'Professionele mobiele autosleutelprogrammering. Alle merken. Zelfde dag. Bel nu.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Autosleutel Expert' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

// Organization schema — sitewide baseline. Does NOT contain a city address.
// Each individual city/service page injects its own Locksmith schema.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_CONFIG.domain}/#organization`,
  name: SITE_CONFIG.fullName,
  url: SITE_CONFIG.domain,
  logo: `${SITE_CONFIG.domain}/logo.png`,
  telephone: SITE_CONFIG.phoneTel,
  email: SITE_CONFIG.email,
  sameAs: [
    SITE_CONFIG.social.facebook,
    SITE_CONFIG.social.instagram,
    SITE_CONFIG.social.google,
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={ibmPlexSans.variable}>
      <head>
        <meta name="theme-color" content="#0d2137" />
        <script id="schema-organization" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </head>
      <body style={{ fontFamily: 'var(--font-ibm, IBM Plex Sans, sans-serif)' }}>
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

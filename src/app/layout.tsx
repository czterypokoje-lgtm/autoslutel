import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import HeaderSwitcher from '@/components/Navigation/HeaderSwitcher';
import Footer from '@/components/Footer/Footer';
import WebshopFooter from '@/components/webshop/WebshopFooter';
import FooterSwitcher from '@/components/Footer/FooterSwitcher';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import UrgencyBanner from '@/components/UrgencyBanner/UrgencyBanner';
import StickyCallBar from '@/components/StickyCallBar/StickyCallBar';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: {
    template: '%s | Autosleutel24',
    default: 'Autosleutel Bijmaken of Kwijt? 24/7 Mobiele Service | Autosleutel24',
  },
  description: `Autosleutel bijmaken of alle sleutels kwijt? Onze mobiele monteurs komen direct naar u toe in de Randstad. Schadevrij openen & inleren. Bel direct!`,
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
    title: 'Autosleutel Bijmaken & Programmeren | Autosleutel24',
    description: 'Mobiele autosleutelspecialist voor alle merken. 24/7 service. Bel 06 11 75 12 31',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
    yandex: '94f695ae8808f677',
  },
  // Google Search Console: verify via the HTML-tag method in GSC (Settings → Ownership verification → HTML tag)
  // Paste the <meta name="google-site-verification" content="..."> tag directly in this <head> block
};

// LocalBusiness schema removed. Now handled dynamically in page components.

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
  // SearchAction removed — Next.js has no ?s= endpoint; prevents schema error in GSC
};

import PhoneConversionTracker from '@/components/PhoneConversionTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PRT75SWX');`
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C4WR7TYCTV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C4WR7TYCTV');
          `}
        </Script>
        {/* Google Ads Click to call conversion snippet */}
        <Script id="google-ads-conversion" strategy="afterInteractive">
          {`
            window.gtag_report_conversion = function(url) {
              var callback = function () {
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion', {
                  'send_to': 'AW-18315813515/qKjlCPGp_d0cEIvF1J1E',
                  'event_callback': callback
              });
              return false;
            };
          `}
        </Script>

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
        {/* distribution, rating, revisit-after removed — not recognised by Google, add noise to head */}

        {/* ── GOOGLE BUSINESS PROFILE LINK ── */}
        <link rel="me" href={SITE_CONFIG.social.google} />

        {/* ── FONTS ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* ── GOOGLE PREFERRED SOURCES ── */}
        <Script async src="https://news.google.com/swg/js/v1/publisher.js" strategy="afterInteractive" />
        {/* ── STRUCTURED DATA ── */}
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <PhoneConversionTracker />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PRT75SWX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <HeaderSwitcher />
        {children}
        <FooterSwitcher 
          mainFooter={<Footer />} 
          webshopFooter={<WebshopFooter />} 
        />
        <WhatsAppButton />
        <StickyCallBar />
        {/* ── iubenda Cookie Solution & Privacy Controls ── */}
        <Script
          strategy="lazyOnload"
          src="https://embeds.iubenda.com/widgets/c53c352b-ed07-4c5b-b461-8b542ddd3aaf.js"
        />
      </body>
    </html>
  );
}

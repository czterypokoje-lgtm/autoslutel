import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import ConsentBanner from '@/components/ConsentBanner/ConsentBanner';


import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';


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

import { GlobalHeader, GlobalFooter, GlobalStickyBar, GlobalWidgets } from '@/components/LayoutManager';
import PhoneConversionTracker from '@/components/PhoneConversionTracker';
import AdParameterTracker from '@/components/Tracking/AdParameterTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/*
          ── CONSENT MODE v2 DEFAULTS ──
          Must be a plain <script> (not next/script) and must run BEFORE the GTM
          and gtag tags below, so no advertising or analytics storage is created
          until the visitor actually accepts. `wait_for_update` gives the CMP
          time to send the real choice. Required by GDPR/AVG art. 6 and the
          Telecommunicatiewet 11.7a, and by Google's EU user consent policy —
          defaulting to "granted" puts the Ads account at risk.
        */}
        {/*
          Microsoft Clarity is loaded from src/lib/consent.ts only after the
          visitor accepts statistics cookies. It records sessions and is not
          Consent Mode aware, so unlike the Google tags it cannot be allowed to
          start and simply withhold storage.
        */}

        <meta name="theme-color" content="#0d2137" />
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
        {/* ── STRUCTURED DATA ── */}
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <Script id="consent-defaults">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent','default',{
              ad_storage:'denied',
              ad_user_data:'denied',
              ad_personalization:'denied',
              analytics_storage:'denied',
              functionality_storage:'granted',
              security_storage:'granted',
              personalization_storage:'denied',
              wait_for_update: 500
            });
            gtag('set','ads_data_redaction', true);
            gtag('set','url_passthrough', true);
          `}
        </Script>
        {/*
          Google Tag Manager — production hostname only. Every Vercel preview
          deploy (autoslutel-git-*-nethoreca.vercel.app) and every localhost
          dev session renders this exact layout, so without this check the
          CRM team testing the admin panel fires the same GTM container as a
          real customer — GA4 events, the Google Ads "generate_lead"
          conversion, Clarity — inflating conversion counts with staff
          testing and polluting session recordings with admin traffic.
          Checked client-side (not via next/headers) because reading the
          request Host header in this root layout would force every page in
          the site out of static generation.
        */}
        <Script id="gtm-script">
          {`
            if (window.location.hostname === 'www.autosleutel24.nl' || window.location.hostname === 'autosleutel24.nl') {
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PRT75SWX');
            }
          `}
        </Script>
        {/* End Google Tag Manager */}

        {/*
          ── MICROSOFT ADVERTISING UET (ti 97270067) ──

          Same production-hostname guard as GTM above: every Vercel preview
          and every localhost session renders this layout, and staff clicking
          around the admin panel must not register as Bing traffic.

          Consent is pushed BEFORE the loader, for the same reason the Google
          defaults are: ad_storage starts denied and is raised only when the
          visitor accepts marketing cookies. Microsoft requires this for EEA
          visitors under the ePrivacy Directive and the GDPR, and the real
          "granted" comes from applyConsent() in src/lib/consent.ts — the same
          function that already updates Google, so one banner decision drives
          both and they cannot disagree.
        */}
        <Script id="uet-consent-default" strategy="beforeInteractive">
          {`
            window.uetq = window.uetq || [];
            window.uetq.push('consent', 'default', { ad_storage: 'denied' });
          `}
        </Script>
        <Script id="uet-tag">
          {`
            if (window.location.hostname === 'www.autosleutel24.nl' || window.location.hostname === 'autosleutel24.nl') {
              (function(w,d,t,u,o){
                w[u]=w[u]||[],o.ts=(new Date).getTime();
                var n=d.createElement(t);
                n.src="https://bat.bing.net/bat.js?ti="+o.ti+("uetq"!=u?"&q="+u:""),
                n.async=1,
                n.onload=n.onreadystatechange=function(){
                  var s=this.readyState;
                  s&&"loaded"!==s&&"complete"!==s||(o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad"),n.onload=n.onreadystatechange=null)
                };
                var i=d.getElementsByTagName(t)[0];
                i.parentNode.insertBefore(n,i);
              })(window, document, "script", "uetq", { ti:"97270067", enableAutoSpaTracking:true });
            }
          `}
        </Script>
        {/*
          GA4 (G-C4WR7TYCTV) is no longer loaded here directly — it's now
          configured as a "Google Tag" inside the GTM container itself
          (GTM-PRT75SWX), which runs its own gtag-compatible runtime. Loading
          both would double-fire every pageview and event: one hit from this
          script, one from GTM's copy, doubling every number in GA4 for no
          reason.

          The Google Ads "Click to call" conversion used to be reported from
          a window.gtag_report_conversion() defined here, called directly from
          PhoneConversionTracker with preventDefault() first — so the actual
          phone call only happened inside that call's callback. If the
          callback never ran (and it stopped running once the standalone
          gtag.js above was removed), the click just did nothing: no call, no
          error. That function and its call site are gone; the "Click to
          call" tag already exists in GTM itself, wired to the click_to_call
          dataLayer event PhoneConversionTracker still sends on every tel:
          click, everywhere on the site.
        */}

        <AdParameterTracker />
        <PhoneConversionTracker />
        {/*
          Google Tag Manager (noscript) — left unconditional. Gating this on
          hostname needs the request Host header, which (see gtm-script
          above) would cost the whole site its static generation. The
          exposure is a JS-disabled browser hitting a preview/localhost URL,
          which does not happen in practice for internal CRM testing.
        */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PRT75SWX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <GlobalHeader />
        {children}
        <GlobalFooter />
        <GlobalWidgets>
          <WhatsAppButton />
        </GlobalWidgets>
        <GlobalStickyBar />
        <GlobalWidgets>
          <ConsentBanner />
        </GlobalWidgets>
        {/*
          Vercel Web Analytics — the traffic number that does not depend on
          consent.

          Since the consent banner went in on 31 August, Google Analytics has
          only received anonymous pings, and this site is far below the volume
          Google needs to model those into a user count — so GA4 has reported
          zero active users while real customers kept arriving. This counts
          page views without a cookie or any device identifier, so it needs no
          consent under the AVG and sees every visitor rather than only those
          who accept. GA4 stays where it is for the funnel and Ads attribution
          it does when consent is granted; this is the number to trust for
          "how many people actually came".

          Inside GlobalWidgets so it never mounts on /admin — the CRM is staff
          traffic and has no business in the site's visitor numbers, the same
          reason the GTM snippet above is gated to the production hostname.
        */}
        <GlobalWidgets>
          <Analytics />
        </GlobalWidgets>
      </body>
    </html>
  );
}

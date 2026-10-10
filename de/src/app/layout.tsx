import type { Metadata } from 'next';
import { IBM_Plex_Sans, Chivo } from 'next/font/google';
import './globals.css';
import './framer-theme.css';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import ConsentBanner from '@/components/ConsentBanner/ConsentBanner';
import LocalBusinessSchema from '@/components/Schema/LocalBusinessSchema';


import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';


import { SITE_CONFIG, assertSiteReady, siteIsReady } from '@/config/site.config';
import PreviewBanner from '@/components/PreviewBanner/PreviewBanner';

/*
 * Ein Build, der Platzhalter ausliefern würde, startet nicht.
 *
 * Hier, weil jeder Weg, der eine Seite rendert, durch dieses Modul geht. Ein
 * geratener Preis oder eine fremde USt-IdNr. auf einer deutschen Seite ist eine
 * Abmahnung, kein vorläufiger Wert — lieber laut scheitern, solange es nichts
 * kostet. Zum Ansehen gibt es AUTOSCHLUESSEL_ALLOW_PLACEHOLDERS=1, und dann
 * sagt die Seite selbst, dass sie eine Vorschau ist.
 */
assertSiteReady();

/*
 * The two fonts the stylesheet actually uses, self-hosted.
 *
 * They were pulled from fonts.googleapis.com with a plain <link>: a
 * render-blocking stylesheet on a third-party origin, on all 190 pages,
 * needing two preconnects to soften a round trip that next/font removes
 * entirely by serving the woff2 from our own origin.
 *
 * A third family, Big Shoulders Display weight 900, was being downloaded
 * with them and is NOT loaded here, because it never rendered: every
 * font-family token in framer-theme.css asks for "Big Shoulders", and
 * "Big Shoulders Display" is a different family name, so every heading has
 * been falling back to sans-serif while paying for the download. Turning it
 * on is a visible change to every heading on the site and is a design
 * decision, not a cleanup one -- see the token comment in framer-theme.css.
 */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--ff-body',
});

const chivo = Chivo({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
  variable: '--ff-accent',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: {
    template: `%s | ${SITE_CONFIG.name}`,
    default: `Autoschlüssel nachmachen oder verloren? Vor Ort | ${SITE_CONFIG.name}`,
  },
  description:
    'Autoschlüssel nachmachen lassen oder alle Schlüssel verloren? Unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt — schadenfrei öffnen, Wegfahrsperre anlernen, Festpreis vorab inkl. MwSt.',
  alternates: {
    canonical: SITE_CONFIG.domain,
    /*
     * Kein hreflang-Cluster, solange es nur diese Seite gibt.
     *
     * Ein hreflang auf autosleutel24.nl wäre falsch: die niederländische
     * Startseite ist nicht die Übersetzung dieser — sie bewirbt ein anderes
     * Einsatzgebiet mit anderen Preisen. Und ein Cluster, bei dem eine Seite
     * nicht zurückverweist, wird von Google ohnehin verworfen. Wenn beide
     * Seiten aufeinander zeigen sollen, muss das auf beiden eingetragen werden.
     */
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.ogLocale,
    url: SITE_CONFIG.domain,
    siteName: SITE_CONFIG.name,
    title: 'Autoschlüssel nachmachen & anlernen | mobil, 24/7',
    description: `Mobiler Autoschlüssel-Service für alle Marken in ${SITE_CONFIG.serviceAreaString}. Am selben Tag, Festpreis vorab, inkl. MwSt.`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Autoschlüssel nachmachen & anlernen | ${SITE_CONFIG.name}`,
    /* Die Rufnummer kommt aus der Konfiguration. Auf der niederländischen
       Seite stand sie hier als Text — und wäre so die niederländische Nummer
       in jeder deutschen Twitter-Karte geworden. */
    description: `Mobiler Autoschlüssel-Service für alle Marken. 24/7 erreichbar. Telefon: ${SITE_CONFIG.phone}`,
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
  /*
   * noindex, solange eine Angabe fehlt — gekoppelt an dieselbe Prüfung wie das
   * Hinweisband und robots.txt. Eine Vorschau, die versehentlich deployt wird,
   * kann so nicht in den Index geraten, und sobald die Konfiguration steht,
   * schaltet es von selbst um.
   */
  robots: siteIsReady()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }
    : { index: false, follow: false },
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
  description: 'Mobiler Autoschlüssel-Service — alle Marken — 24/7',
  inLanguage: SITE_CONFIG.hreflang,
  publisher: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
  // SearchAction removed — Next.js has no ?s= endpoint; prevents schema error in GSC
};

import { GlobalHeader, GlobalFooter, GlobalStickyBar, GlobalWidgets } from '@/components/LayoutManager';
import PhoneConversionTracker from '@/components/PhoneConversionTracker';
import AdParameterTracker from '@/components/Tracking/AdParameterTracker';

/*
 * Der Hostname, auf dem Messung feuern darf.
 *
 * Aus der Konfiguration abgeleitet statt eingetippt: beim Kopieren der Seite
 * stand hier 'autosleutel24.nl', und auf einer deutschen Domain hätte damit
 * kein einziges Skript geladen.
 */
const SITE_HOST = new URL(SITE_CONFIG.domain).hostname.replace(/^www\./, '');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_CONFIG.htmlLang} className={`${ibmPlexSans.variable} ${chivo.variable}`}>
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
        <meta name="classification" content="Autoschlüsseldienst, Schlüsseldienst für Fahrzeuge, Auto Locksmith" />
        <meta name="category" content="Automotive, Locksmith Services, Mobile Car Key Programming" />
        <meta name="coverage" content="Utrecht, Amsterdam, Almere, Amersfoort, Nederland" />
        {/* distribution, rating, revisit-after removed — not recognised by Google, add noise to head */}

        {/* ── GOOGLE BUSINESS PROFILE LINK ── */}
        <link rel="me" href={SITE_CONFIG.social.google} />

        {/* ── STRUCTURED DATA ── */}
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <PreviewBanner />
        {/* The one full description of the business; every other page's markup refers to it by @id. */}
        <LocalBusinessSchema />
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

          The hostname alone never covered the CRM itself: /admin on the
          production domain loaded every tag, so staff opening leads and
          tapping a customer's WhatsApp button counted as visitors and taps.
          The /admin path check is on all three loaders (GTM, Google Ads, UET).
        */}
        {/*
          Nur wenn ein eigener deutscher Container konfiguriert ist. Hier stand
          nach dem Kopieren GTM-PRT75SWX — der Container der niederländischen
          Seite. Siehe den Kommentar an SITE_CONFIG.analytics.
        */}
        {SITE_CONFIG.analytics.gtmId && (
          <Script id="gtm-script">
            {`
            if ((window.location.hostname === 'www.' + '${SITE_HOST}' || window.location.hostname === '${SITE_HOST}') && !window.location.pathname.startsWith('/admin')) {
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${SITE_CONFIG.analytics.gtmId}');
            }
          `}
          </Script>
        )}

        {/* Google Ads Standalone gtag.js (AW-18315813515) - Added to guarantee conversions bypassing GTM complexity */}
        {SITE_CONFIG.analytics.googleAdsId && (
          <Script
            id="google-ads-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.analytics.googleAdsId}`}
          />
        )}
        {SITE_CONFIG.analytics.googleAdsId && (
          <Script id="google-ads-config">
            {`
            if ((window.location.hostname === 'www.' + '${SITE_HOST}' || window.location.hostname === '${SITE_HOST}') && !window.location.pathname.startsWith('/admin')) {
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('config', '${SITE_CONFIG.analytics.googleAdsId}', { send_page_view: false, allow_enhanced_conversions: true });
            }
          `}
          </Script>
        )}
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
{SITE_CONFIG.analytics.bingUetId && (
          <>
          <Script id="uet-consent-default" strategy="beforeInteractive">
            {`
              window.uetq = window.uetq || [];
              window.uetq.push('consent', 'default', { ad_storage: 'denied' });
            `}
          </Script>
          <Script id="uet-tag">
            {`
              if ((window.location.hostname === 'www.' + '${SITE_HOST}' || window.location.hostname === '${SITE_HOST}') && !window.location.pathname.startsWith('/admin')) {
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
                })(window, document, "script", "uetq", { ti:"${SITE_CONFIG.analytics.bingUetId}", enableAutoSpaTracking:true });
              }
            `}
          </Script>
          </>
        )}
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
{SITE_CONFIG.analytics.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${SITE_CONFIG.analytics.gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
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

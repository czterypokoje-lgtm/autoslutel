import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CallBar from '@/components/CallBar';
import PreviewBanner from '@/components/PreviewBanner';
import { SITE, assertSiteReady, siteIsReady } from '@/config/site';
import { JsonLd, localBusinessSchema } from '@/lib/schema';

/*
 * Ein Build, der Platzhalter ausliefern würde, startet nicht.
 *
 * Hier und nicht in einer Prüfung am Rand, weil jeder Weg, der eine Seite
 * rendert, durch dieses Modul geht. Ein geratener Preis oder eine fremde
 * USt-IdNr. auf einer deutschen Seite ist eine Abmahnung, kein vorläufiger
 * Wert — lieber laut scheitern, solange es nichts kostet.
 */
assertSiteReady();

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    template: `%s | ${SITE.name}`,
    default: 'Autoschlüssel nachmachen & verloren — mobiler Service | Autoschlüssel24',
  },
  description:
    'Autoschlüssel nachmachen oder verloren? Unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt. Festpreis vorab, inkl. MwSt., rund um die Uhr.',
  alternates: { canonical: SITE.domain },
  openGraph: {
    type: 'website',
    locale: SITE.ogLocale,
    url: SITE.domain,
    siteName: SITE.name,
    title: 'Autoschlüssel nachmachen & verloren — mobiler Service',
    description:
      'Der Partner kommt zu Ihrem Fahrzeug. Festpreis vorab, inkl. MwSt. Berlin, Hamburg, München, Frankfurt am Main.',
  },
  twitter: { card: 'summary_large_image' },
  /*
   * noindex, solange eine Angabe fehlt.
   *
   * An dieselbe Prüfung gekoppelt wie das Hinweisband: eine Vorschau, die
   * versehentlich deployt wird, kann so nicht in den Index geraten. Sobald die
   * Konfiguration vollständig ist, schaltet das hier von selbst um — niemand
   * muss daran denken.
   */
  robots: siteIsReady()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.htmlLang}>
      <head>
        {/* Einmal pro Seite, im Root: das Unternehmen als ein Knoten. */}
        <JsonLd data={localBusinessSchema()} />
      </head>
      <body>
        <PreviewBanner />
        <Header />
        <main>{children}</main>
        <Footer />
        <CallBar />
      </body>
    </html>
  );
}

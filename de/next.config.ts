import type { NextConfig } from 'next';
import path from 'node:path';

/**
 * Eigenständig von der niederländischen App.
 *
 * Nichts hier importiert aus ../src — das ist der Punkt dieser Trennung. Was
 * beide Seiten brauchen, existiert zweimal, und das ist die bewusst in Kauf
 * genommene Folge (siehe README).
 */
const nextConfig: NextConfig = {
  /*
   * Die Wurzel dieses Projekts ist dieser Ordner — nicht das Repository darüber.
   *
   * Next sucht die Wurzel, indem es nach oben läuft, bis es eine Lockfile
   * findet, und fand damit das Repository mit der niederländischen Seite. Die
   * Folge war ein Build, der ../src/proxy.ts der anderen App einzog und an
   * deren Supabase-Importen scheiterte. Genau das soll diese Trennung
   * verhindern, also wird die Wurzel hier festgenagelt.
   */
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp'],
    /*
     * Ab Next 16 muss jede verwendete Qualitätsstufe hier stehen; ohne Angabe
     * gilt nur [75]. Die Seite benutzt drei: 70 in der Galerie-Laufschrift
     * (viele Bilder nebeneinander, kleine Darstellung), 75 im SplitHero und
     * 80 für die großen Porträt- und Hero-Bilder auf Startseite,
     * /partner-werden und den Geschäftskundenseiten.
     *
     * Ohne diesen Eintrag warnt der Entwicklungsserver bei jedem dieser
     * Bilder, und die Optimierung fällt auf 75 zurück — die Angabe im
     * Bauteil wäre dann wirkungslos, ohne dass es jemand merkt.
     */
    qualities: [70, 75, 80],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;

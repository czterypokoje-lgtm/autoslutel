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

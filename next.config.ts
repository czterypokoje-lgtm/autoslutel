import type { NextConfig } from "next";
import { SITE_CONFIG } from "./src/config/site.config";

const brands = [
  'volkswagen', 'bmw', 'mercedes', 'audi', 'toyota', 'peugeot', 'ford', 'renault', 
  'opel', 'volvo', 'skoda', 'nissan', 'kia', 'hyundai', 'honda', 'fiat', 'citroen', 
  'seat', 'mazda', 'suzuki', 'mitsubishi', 'mini', 'dacia', 'land-rover', 'porsche', 
  'lexus', 'jaguar', 'alfa-romeo', 'smart', 'jeep', 'chevrolet', 'subaru', 'lancia', 
  'ds', 'chrysler', 'saab', 'dodge', 'ssangyong'
];

const brandRedirects = brands.map(brand => ({
  source: `/merken/${brand}`,
  destination: `/merken/${brand}-autosleutel-bijmaken`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  /*
   * pdf-parse pulls in @napi-rs/canvas, a native compiled binary — the class
   * of dependency Next's bundler cannot package into a serverless function
   * correctly. Left un-configured, the invoice route builds fine, deploys
   * fine, and then silently returns empty text on every real request: the
   * failure is caught (route.ts) and logged as a warning, not thrown, so it
   * never shows up as an error, only as "0 regel(s)" on every invoice. This
   * tells Next to require these straight from node_modules in the deployed
   * function instead of bundling them, which is where the platform's own
   * install step already put the correct native binary.
   */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'xlsx'],
  /*
   * The third layer of the same problem. pdfjs-dist loads its worker script
   * with a dynamically computed path — "Setting up fake worker failed:
   * Cannot find module '/var/task/node_modules/pdfjs-dist/legacy/build/
   * pdf.worker.mjs'" — and Vercel's own file-tracing step (separate from
   * Next's bundler, and unaffected by serverExternalPackages) only copies
   * node_modules files it can see referenced by a static import. A
   * dynamically-built path is invisible to it, so the worker file — needed
   * only at runtime, never imported by name anywhere in this codebase —
   * never made it into the deployed function. This forces it in regardless
   * of what the tracer's static analysis finds.
   */
  outputFileTracingIncludes: {
    '/api/admin/invoice': ['./node_modules/pdfjs-dist/**/*.mjs', './node_modules/pdf-parse/dist/**/*'],
  },
  /*
   * The mirror image of the problem above, and it broke a deploy outright:
   *
   *   The Vercel Function "diensten/afstandsbediening-bijmaken" is 304.43mb
   *   uncompressed which exceeds the maximum uncompressed size limit of 250mb
   *
   * /diensten/[slug] lists a service's photos with
   * readdirSync(path.join(process.cwd(), 'public', 'images', slug)). Because
   * `slug` is only known at runtime, the tracer cannot work out which folder
   * is meant and conservatively pulls in all of public/images — 322 MB of
   * photographs — as if the function needed them. Hence 304 MB.
   *
   * It needs none of them. Every one of these routes is prerendered
   * (generateStaticParams, no dynamicParams, no revalidate), so the filenames
   * are baked into the HTML at build time and the images themselves are served
   * from the CDN, never from the function. The directory read happens during
   * the build, which runs against the full repo and is unaffected by this.
   *
   * Scoped to the one route that has the problem: /merken/[merkSlug] does the
   * same trick against a *static* path, so the tracer resolves it and pulls in
   * only public/images/merken (21 MB). Should a service page ever be rendered
   * on demand, the readdirSync is inside a try/catch that falls back to an
   * empty list rather than throwing.
   */
  outputFileTracingExcludes: {
    /*
     * The brackets are escaped because these keys are matched with picomatch,
     * where an unescaped [slug] is a character class meaning "one of s, l, u,
     * g" — it silently matches nothing here, which is exactly how the first
     * attempt at this failed while looking correct. The docs' own example
     * escapes them the same way.
     */
    '/diensten/\\[slug\\]': ['./public/**/*'],
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
      },
    ],
  },
  async redirects() {
    return [
      ...brandRedirects,
      /*
       * The per-model pages are gone — 664 routes that measured 94-97%
       * identical to each other, which is scaled content abuse and is
       * penalised across the whole domain rather than page by page. The model
       * names now live as text on the parent brand page.
       *
       * Redirected rather than deleted: these URLs are in Google's index and
       * may be linked from elsewhere, and answering 664 of them with a 404 is
       * its own bad signal. A 301 to the brand page passes on whatever they
       * earned and sends the visitor somewhere that answers the same question.
       */
      {
        source: "/merken/:merkSlug/:modelSlug",
        destination: "/merken/:merkSlug",
        permanent: true,
      },
      {
        source: "/blog/sleutel-kwijt-utrecht-stappenplan",
        destination: "/blog/autosleutel-kwijt-wat-nu-stappenplan",
        permanent: true,
      },
      {
        source: "/blog/alle-sleutels-kwijt-wat-nu-utrecht",
        destination: "/blog/autosleutel-kwijt-wat-nu-stappenplan",
        permanent: true,
      },
      {
        source: "/blog/sleutel-kwijt-auto-hulp-oplossingen",
        destination: "/blog/autosleutel-kwijt-wat-nu-stappenplan",
        permanent: true,
      },
      {
        source: "/blog/sleutel-kwijt-auto-vind-snel-oplossingen",
        destination: "/blog/autosleutel-kwijt-wat-nu-stappenplan",
        permanent: true,
      },
      {
        source: "/blog/volkswagen-sleutel-bijmaken-kosten-opties-tips",
        destination: "/blog/volkswagen-sleutel-bijmaken",
        permanent: true,
      },
      {
        source: "/blog/auto-herkent-sleutel-niet-meer-oorzaken-oplossingen",
        destination: "/blog/auto-herkent-sleutel-niet-meer",
        permanent: true,
      },
      {
        source: "/locaties",
        destination: "/steden",
        permanent: true,
      },
      {
        source: "/locaties/:slug",
        destination: "/steden/:slug",
        permanent: true,
      },
      {
        source: "/merken/:merkSlug-sleutel-programmeren",
        destination: "/merken/:merkSlug-autosleutel-bijmaken",
        permanent: true,
      },
      {
        source: "/merken/:merkSlug-sleutel-programmeren/:modelSlug",
        destination: "/merken/:merkSlug-autosleutel-bijmaken/:modelSlug",
        permanent: true,
      },
      {
        source: "/steden/:citySlug/:merkSlug-sleutel-programmeren",
        destination: "/steden/:citySlug/:merkSlug-autosleutel-bijmaken",
        permanent: true,
      },
      {
        source: "/diensten/:serviceSlug-eindhoven",
        destination: "/diensten/:serviceSlug-utrecht",
        permanent: true,
      },
      {
        source: "/blog/:blogSlug-eindhoven",
        destination: "/blog/:blogSlug-utrecht",
        permanent: true,
      },
      // ── Autodeur openen → Auto openen zonder sleutel (rename) ────
      {
        source: '/diensten/autodeur-openen',
        destination: '/diensten/auto-openen-zonder-sleutel',
        permanent: true,
      },
      {
        source: '/auto-op-slot',
        destination: '/diensten/auto-openen-zonder-sleutel',
        permanent: true,
      },
      {
        source: '/auto-openen-zonder-sleutel',
        destination: '/diensten/auto-openen-zonder-sleutel',
        permanent: true,
      },
      // ── Legacy / Crawled service slug redirects ──────────────────
      {
        source: '/diensten/transponder-sleutel-programmeren',
        destination: '/diensten/transponder-programmeren',
        permanent: true,
      },
      {
        source: '/diensten/contact-reparatie',
        destination: '/diensten/contactslot-auto-vervangen',
        permanent: true,
      },
      {
        source: '/diensten/contactslot-reparatie',
        destination: '/diensten/contactslot-auto-vervangen',
        permanent: true,
      },
      {
        source: '/diensten/contactslot-vervangen-reparatie',
        destination: '/diensten/contactslot-auto-vervangen',
        permanent: true,
      },
      {
        source: '/diensten/alarm-programmeren',
        destination: '/diensten/autosleutels-repareren',
        permanent: true,
      },
      // ── Verwijderde beveiliging pagina's → auto slotenmaker ──────
      {
        source: '/diensten/auto-beveiliging',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      {
        source: '/diensten/autoalarm-programmeren',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      {
        source: '/diensten/ghost-immobiliser',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      {
        source: '/steden/:citySlug/auto-beveiliging',
        destination: '/steden/:citySlug',
        permanent: true,
      },
      {
        source: '/steden/:citySlug/autoalarm-programmeren',
        destination: '/steden/:citySlug',
        permanent: true,
      },
      {
        source: '/steden/:citySlug/ghost-immobiliser',
        destination: '/steden/:citySlug',
        permanent: true,
      },
      {
        source: '/steden/:citySlug/ghost-immobiliser-installeren',
        destination: '/steden/:citySlug',
        permanent: true,
      },
      {
        source: '/diensten/ghost-immobiliser-installeren',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },

      {
        source: '/auto-beveiliging',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      {
        source: '/autoalarm-programmeren',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      {
        source: '/ghost-immobiliser',
        destination: '/diensten/auto-slotenmaker',
        permanent: true,
      },
      // ── Blog duplicate / thin content → canonical hub ──
      {
        source: '/blog/auto-openen-zonder-sleutel-tips-hulp',
        destination: '/diensten/auto-openen-zonder-sleutel',
        permanent: true,
      },
      {
        source: '/blog/auto-openen-zonder-sleutel-schadevrij',
        destination: '/diensten/auto-openen-zonder-sleutel',
        permanent: true,
      },
      {
        source: '/blog/autosleutel-bijmaken-tips-snel-veilig',
        destination: '/diensten/autosleutel-bijmaken',
        permanent: true,
      },
      {
        source: '/blog/sleutel-bijmaken-auto-mobiele-service',
        destination: '/diensten/autosleutel-bijmaken',
        permanent: true,
      },

      {
        source: '/diensten/autosleutel-kwijt',
        destination: '/autosleutel-kwijt',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Serves customer lead photos from our own domain.
        // Scoped to the `leads/` prefix that /api/upload writes, so the blob
        // store cannot be used to host arbitrary paths under autosleutel24.nl.
        source: '/f/leads/:filename',
        destination: `${SITE_CONFIG.blobStorageDomain}/leads/:filename`,
      },
      {
        // Legacy photos uploaded before the `leads/` prefix existed, so links
        // in already-sent WhatsApp messages keep resolving. Image extensions
        // only — nothing new is ever written to the blob root any more.
        source: '/f/:filename(.*\\.(?:jpg|jpeg|png|webp|heic|heif))',
        destination: `${SITE_CONFIG.blobStorageDomain}/:filename`,
      },
    ];
  },
};

export default nextConfig;

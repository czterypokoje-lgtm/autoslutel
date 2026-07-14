import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "frame-src 'self' https://www.google.com https://maps.google.com https://google.com",
              "connect-src 'self' https:",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
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
        destination: '/diensten/contactslot-reparatie',
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
        source: '/blog/ghost-immobiliser-utrecht',
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
    ];
  },
};

export default nextConfig;

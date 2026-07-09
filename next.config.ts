import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;

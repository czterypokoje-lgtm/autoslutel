import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;

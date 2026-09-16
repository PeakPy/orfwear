import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.orfwear.ir" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;

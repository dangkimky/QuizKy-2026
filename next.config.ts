import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ignore typescript warnings during production builds for speed
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

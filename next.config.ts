import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // Disable development mode warnings
  reactStrictMode: false,
  // Only apply webpack config when not using Turbopack
  webpack: process.env.TURBOPACK ? undefined : (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer || [];
    }
    return config;
  },
};

export default nextConfig;

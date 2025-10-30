import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ensure workspace package TS is transpiled by Next
    transpilePackages: ["@typeb/icons"],
  },
};

export default nextConfig;

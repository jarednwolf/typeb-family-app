import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure workspace package TS is transpiled by Next (moved out of experimental)
  transpilePackages: ["@typeb/icons"],
};

export default nextConfig;

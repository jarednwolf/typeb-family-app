/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [],
  },
  // Expose service worker
  async rewrites() {
    return [
      {
        source: '/service-worker.js',
        destination: '/src/app/service-worker.ts',
      },
    ];
  },
};

module.exports = nextConfig;



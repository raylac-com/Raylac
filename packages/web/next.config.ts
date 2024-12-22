import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
};

export default nextConfig;

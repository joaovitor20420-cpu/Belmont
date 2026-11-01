import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.artic.edu',
      },
      {
        protocol: 'https',
        hostname: 'openaccess-cdn.clevelandart.org',
      },
      {
        protocol: 'https',
        hostname: 'images.metmuseum.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */

const nextConfig = {
  // A separate distDir lets a dev server run beside the production build (NEXT_DIST_DIR=.next-dev).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: false,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
  images: {
    domains: [
      'images.unsplash.com',
      'i.ibb.co',
      'scontent.fotp8-1.fna.fbcdn.net',
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [{ source: '/landing', destination: '/', permanent: false }];
  },
};

module.exports = nextConfig;

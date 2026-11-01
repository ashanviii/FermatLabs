import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/design'],
    },
    sitemap: 'https://www.fermatlabs.org/sitemap.xml',
    host: 'https://www.fermatlabs.org',
  };
}

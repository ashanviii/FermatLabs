import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.fermatlabs.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/plan`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

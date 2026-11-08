import type { MetadataRoute } from 'next';
import { guides } from '@/lib/guides';

const baseUrl = 'https://www.fermatlabs.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: guide.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/plan`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/guides`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    ...guidePages,
  ];
}

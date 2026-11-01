import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fermat · Group trips, sorted',
    short_name: 'Fermat',
    description:
      'Plan a group trip that fits everyone’s private budget, departure city and passport.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf8',
    theme_color: '#0f5132',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

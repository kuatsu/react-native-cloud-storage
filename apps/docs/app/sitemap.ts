import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages().map((page) => ({
    url: new URL(page.url, siteUrl).toString(),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.7,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...pages,
  ];
}

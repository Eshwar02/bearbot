import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/profile',
          '/settings',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/info',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/info',
        disallow: '/',
      },
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.marketingUrl}/sitemap.xml`,
    ],
    host: siteConfig.url,
  };
}

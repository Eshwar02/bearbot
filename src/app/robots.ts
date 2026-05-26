import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

// GEO (Generative Engine Optimization): explicitly allow major AI crawlers
// so LLM-powered search surfaces (ChatGPT, Perplexity, Claude, Gemini, etc.)
// can index AlphaSight AI content. Private/auth routes stay disallowed.
const PRIVATE_PATHS = [
  '/api/',
  '/auth/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/profile',
  '/settings',
];

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-Web',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Googlebot-Extended',
  'CCBot',
  'cohere-ai',
  'Bytespider',
  'Amazonbot',
  'DuckAssistBot',
  'Applebot-Extended',
  'YouBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'MistralAI-User',
  'Diffbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((ua) => ({
        userAgent: ua,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.marketingUrl}/sitemap.xml`,
    ],
    host: siteConfig.url,
  };
}

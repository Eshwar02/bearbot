import type { NextConfig } from 'next';

// Strict security headers. Tightens CSP to known origins (Supabase, Yahoo
// Finance, Vercel insights, Google Fonts/Tag Manager/AdSense). Adjust
// connect-src / script-src as new providers are added.
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://*.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://api.mistral.ai https://api.groq.com",
      "frame-src 'self' https://pagead2.googlesyndication.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',
      'framer-motion',
      'recharts',
      'date-fns',
      '@react-three/fiber',
      'three',
    ],
  },
  turbopack: {
    resolveAlias: {
      '@std/testing/mock': './src/lib/shims/empty-module.ts',
      '@std/testing/bdd': './src/lib/shims/empty-module.ts',
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': './src/lib/shims/empty-module.ts',
      '@gadicc/fetch-mock-cache/stores/fs.ts': './src/lib/shims/empty-module.ts',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix yahoo-finance2 test file imports that reference Deno-specific modules
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@std/testing/mock': './src/lib/shims/empty-module.ts',
        '@std/testing/bdd': './src/lib/shims/empty-module.ts',
        '@gadicc/fetch-mock-cache/runtimes/deno.ts': './src/lib/shims/empty-module.ts',
        '@gadicc/fetch-mock-cache/stores/fs.ts': './src/lib/shims/empty-module.ts',
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
    ];
  },
  // Subdomain routing for alphasightai.online.
  // Apex + www redirects live here (they need to fire before any auth check).
  // The "info → /info" / "about → /about" rewrites are handled in src/proxy.ts
  // instead, so the auth proxy sees the rewritten path and treats them as
  // public routes. See DEPLOYMENT.md.
  async redirects() {
    return [
      // Bare apex → product subdomain. Permanent so search engines collapse them.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'alphasightai.online' }],
        destination: 'https://chat.alphasightai.online/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.alphasightai.online' }],
        destination: 'https://chat.alphasightai.online/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

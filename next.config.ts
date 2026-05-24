import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      '@std/testing/mock': './src/lib/shims/empty-module.ts',
      '@std/testing/bdd': './src/lib/shims/empty-module.ts',
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': './src/lib/shims/empty-module.ts',
      '@gadicc/fetch-mock-cache/stores/fs.ts': './src/lib/shims/empty-module.ts',
    },
  },
  images: {
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
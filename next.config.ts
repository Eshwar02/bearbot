import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
  // Each marketing subdomain (info, about, …) is mapped to its own internal route
  // so the codebase stays single-app while DNS looks SaaS-clean.
  // chat.alphasightai.online serves the product (the existing app at /).
  // See DEPLOYMENT.md for the add-a-new-subdomain recipe.
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'info.alphasightai.online' }],
        destination: '/info',
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'about.alphasightai.online' }],
        destination: '/about',
      },
    ];
  },
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

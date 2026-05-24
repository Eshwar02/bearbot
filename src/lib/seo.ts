import type { Metadata } from 'next';

export const siteConfig = {
  name: 'AlphaSight AI',
  shortName: 'AlphaSight',
  tagline: 'AI Workspace for Research, Automation & Intelligence',
  description:
    'AlphaSight AI is an AI workspace for research, automation, and intelligent analysis with AI assistant workflows, collaborative dashboards, and enterprise-ready productivity.',
  longDescription:
    'AlphaSight AI is an AI productivity platform for modern teams that unifies intelligent AI assistant workflows, deep research, automation pipelines, and AI analysis tools in one secure workspace.',
  url: 'https://alphasightai.online',
  appUrl: 'https://chat.alphasightai.online',
  ogImage: 'https://alphasightai.online/opengraph-image',
  locale: 'en_US',
  twitter: '@alphasightai',
  author: 'AlphaSight AI',
  email: 'support@alphasightai.online',
  themeColor: '#1f2937',
  keywords: [
    'AI workspace',
    'AI assistant',
    'AI productivity platform',
    'AI research platform',
    'AI automation workspace',
    'Intelligent AI assistant',
    'AI analysis tool',
    'enterprise AI workspace',
    'AI workflow automation',
    'AI-native SaaS',
    'AlphaSight',
    'AlphaSight AI',
  ],
} as const;

type RouteSeo = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  canonicalBase?: 'site' | 'app';
  ogType?: 'website' | 'article';
};

export const routeSeo = {
  home: {
    title: 'AlphaSight AI – AI Workspace for Research & Intelligence',
    description: siteConfig.description,
    path: '/',
    keywords: [...siteConfig.keywords],
  },
  about: {
    title: 'About AlphaSight AI – Platform, Mission, and Roadmap',
    description:
      'Learn AlphaSight AI mission, product philosophy, and roadmap for AI workspace, automation workflows, and intelligent assistant systems.',
    path: '/about',
    keywords: ['about AlphaSight AI', 'AI workspace platform', ...siteConfig.keywords],
  },
  features: {
    title: 'AlphaSight AI Features – AI Assistant and Automation Workflows',
    description:
      'Explore AlphaSight AI features for research, AI automation workspace flows, intelligent copilots, analytics, collaboration, and productivity.',
    path: '/features',
  },
  pricing: {
    title: 'AlphaSight AI Pricing – Plans for Teams and Enterprises',
    description:
      'See AlphaSight AI pricing for individuals, startups, and enterprise teams using AI productivity platform workflows, automation, and research tools.',
    path: '/pricing',
  },
  docs: {
    title: 'AlphaSight AI Docs – Guides, Integrations, and API References',
    description:
      'Read AlphaSight AI docs, implementation guides, integrations, and API references for building AI assistant and automation workflows.',
    path: '/docs',
  },
  blog: {
    title: 'AlphaSight AI Blog – AI Research, Automation, and Insights',
    description:
      'AlphaSight AI blog covering AI workspace strategy, automation architecture, assistant design, and practical intelligence workflows.',
    path: '/blog',
    ogType: 'article',
  },
  apiLanding: {
    title: 'AlphaSight AI API – AI Workspace Integrations & Endpoints',
    description:
      'Integrate with AlphaSight AI APIs to connect AI assistant workflows, intelligence pipelines, automation jobs, and productivity systems.',
    path: '/api',
  },
  contact: {
    title: 'Contact AlphaSight AI – Support and Business Inquiries',
    description:
      'Contact AlphaSight AI for support, partnerships, technical guidance, and business inquiries around our AI workspace and productivity platform.',
    path: '/contact',
  },
  privacy: {
    title: 'Privacy Policy – AlphaSight AI',
    description:
      'Read AlphaSight AI privacy policy for data handling, retention, user controls, and security protections across workspace and assistant features.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service – AlphaSight AI',
    description:
      'AlphaSight AI terms of service for workspace usage, account responsibilities, API usage rules, and platform restrictions.',
    path: '/terms',
  },
  disclaimer: {
    title: 'Financial Disclaimer – AlphaSight AI',
    description:
      'AlphaSight AI provides information for research and productivity. This platform does not provide financial, legal, or tax advice.',
    path: '/disclaimer',
  },

  login: {
    title: 'Login to AlphaSight AI Dashboard',
    description:
      'Secure login to AlphaSight AI dashboard for AI automation workspace, research tools, and intelligent assistant workflows.',
    path: '/login',
    noIndex: true,
    canonicalBase: 'app',
  },
  signup: {
    title: 'Sign Up for AlphaSight AI Workspace',
    description:
      'Create AlphaSight AI account and start with AI productivity platform workflows, assistants, automation, and research.',
    path: '/signup',
    noIndex: true,
    canonicalBase: 'app',
  },
  forgotPassword: {
    title: 'Reset AlphaSight AI Password',
    description: 'Reset AlphaSight AI account password to restore secure access to your dashboard.',
    path: '/forgot-password',
    noIndex: true,
    canonicalBase: 'app',
  },
  resetPassword: {
    title: 'Create New Password – AlphaSight AI',
    description: 'Set a new password for your AlphaSight AI account.',
    path: '/reset-password',
    noIndex: true,
    canonicalBase: 'app',
  },
  appHome: {
    title: 'AlphaSight AI Dashboard Workspace',
    description: 'Private AlphaSight AI dashboard workspace for authenticated users.',
    path: '/dashboard',
    noIndex: true,
    canonicalBase: 'app',
  },
  workspace: {
    title: 'AlphaSight AI Workspace',
    description: 'Private AlphaSight AI workspace for AI assistant, automation, and analysis flows.',
    path: '/workspace',
    noIndex: true,
    canonicalBase: 'app',
  },
  chat: {
    title: 'AlphaSight AI Chat Workspace',
    description: 'Private AI chat workspace for AlphaSight AI users.',
    path: '/chat',
    noIndex: true,
    canonicalBase: 'app',
  },
  portfolio: {
    title: 'Portfolio Dashboard – AlphaSight AI',
    description: 'Private AlphaSight AI portfolio dashboard.',
    path: '/portfolio',
    noIndex: true,
    canonicalBase: 'app',
  },
  watchlist: {
    title: 'Watchlist Dashboard – AlphaSight AI',
    description: 'Private AlphaSight AI watchlist dashboard.',
    path: '/watchlist',
    noIndex: true,
    canonicalBase: 'app',
  },
  dailyBrief: {
    title: 'Daily Brief Dashboard – AlphaSight AI',
    description: 'Private AlphaSight AI daily brief dashboard.',
    path: '/daily-brief',
    noIndex: true,
    canonicalBase: 'app',
  },
  profile: {
    title: 'Profile – AlphaSight AI',
    description: 'Manage AlphaSight AI profile settings.',
    path: '/profile',
    noIndex: true,
    canonicalBase: 'app',
  },
  settings: {
    title: 'Settings – AlphaSight AI',
    description: 'Configure AlphaSight AI to match your workflow.',
    path: '/settings',
    noIndex: true,
    canonicalBase: 'app',
  },
} satisfies Record<string, RouteSeo>;

export function buildMetadata(route: RouteSeo): Metadata {
  const baseUrl = route.canonicalBase === 'app' ? siteConfig.appUrl : siteConfig.url;
  const url = `${baseUrl}${route.path}`;
  const keywords = route.keywords ?? siteConfig.keywords;

  return {
    title: route.title,
    description: route.description,
    keywords: [...keywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.author, url: siteConfig.url }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    category: 'software',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    robots: route.noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: route.ogType ?? 'website',
      locale: siteConfig.locale,
      url,
      title: route.title,
      description: route.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: route.title,
      description: route.description,
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      images: [siteConfig.ogImage],
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      other: {
        'msvalidate.01':
          process.env.NEXT_PUBLIC_BING_VERIFICATION ??
          '0D1D17B3E2FD31B1F01753F3F10F1511',
      },
    },
  };
}

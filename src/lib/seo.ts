import type { Metadata } from 'next';

export const siteConfig = {
  name: 'AlphaSight AI',
  shortName: 'AlphaSight',
  tagline: 'AI-Powered Stock Analysis & Market Intelligence',
  description:
    'AlphaSight AI is an AI-first stock intelligence workspace with real-time streaming chat, portfolio tracking, watchlists, daily market briefs, and institutional-grade financial research powered by advanced large language models.',
  longDescription:
    'AlphaSight AI helps retail and professional investors make data-driven decisions with AI-powered stock analysis, real-time quotes, portfolio analytics, sentiment tracking, and personalized market intelligence. Built on modern LLMs (Mistral, Groq, Llama), Yahoo Finance live data, and a secure Supabase backend.',
  url: 'https://chat.alphasightai.online',
  marketingUrl: 'https://chat.alphasightai.online/info',
  apexUrl: 'https://alphasightai.online',
  ogImage: 'https://chat.alphasightai.online/opengraph-image',
  locale: 'en_US',
  twitter: '@alphasightai',
  author: 'AlphaSight AI',
  email: 'support@alphasightai.online',
  themeColor: '#1f2937',
  keywords: [
    'AI stock analysis',
    'AI stock assistant',
    'stock market AI',
    'AI investing platform',
    'AI trading assistant',
    'portfolio tracker',
    'real-time stock quotes',
    'stock watchlist app',
    'daily market brief',
    'AI financial research',
    'LLM stock analysis',
    'sentiment analysis stocks',
    'AI hedge fund tool',
    'algorithmic trading insights',
    'AlphaSight',
    'AlphaSight AI',
    'chat with stocks',
    'AI equity research',
    'AI portfolio analytics',
    'NSE BSE NYSE NASDAQ analysis',
    'fundamental analysis AI',
    'technical analysis AI',
    'retail investor AI tools',
    'stock screener AI',
    'investment research assistant',
    'market intelligence platform',
    'AI for trading',
    'stock price prediction AI',
    'financial news summarizer',
    'earnings call analysis AI',
  ],
} as const;

type RouteSeo = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export const routeSeo = {
  home: {
    title: 'AlphaSight AI — AI-Powered Stock Analysis & Market Intelligence',
    description: siteConfig.description,
    path: '/',
    keywords: [...siteConfig.keywords],
  },
  info: {
    title: 'AlphaSight AI — The AI Stock Intelligence Workspace',
    description:
      'Meet AlphaSight AI: the AI-first stock intelligence platform with streaming chat, real-time portfolio analytics, daily briefs, and institutional-grade research for every investor.',
    path: '/info',
    keywords: ['AI stock intelligence', 'investing platform', ...siteConfig.keywords],
  },
  chat: {
    title: 'Chat — AI Stock Research & Analysis',
    description:
      'Ask anything about markets. Stream institutional-quality stock research, fundamentals, technicals, and live quotes powered by LLMs and Yahoo Finance.',
    path: '/chat',
    keywords: ['AI chat stocks', 'LLM finance chat', 'stock research chat'],
  },
  portfolio: {
    title: 'Portfolio Tracker — AlphaSight AI',
    description:
      'Track positions, P&L, allocation, and live performance with AI commentary on your holdings.',
    path: '/portfolio',
    keywords: ['portfolio tracker', 'P&L tracker', 'portfolio analytics AI'],
  },
  watchlist: {
    title: 'Watchlist — Real-Time Stock Monitoring',
    description: 'Build a custom watchlist with live quotes, alerts, and AI-generated context.',
    path: '/watchlist',
    keywords: ['stock watchlist', 'real-time stock alerts'],
  },
  dailyBrief: {
    title: 'Daily Market Brief — Personalized AI News',
    description:
      'Your personalized morning market brief: macro headlines, your tickers, and AI-summarized catalysts.',
    path: '/daily-brief',
    keywords: ['daily market brief', 'AI market news', 'morning market summary'],
  },
  login: {
    title: 'Sign In — AlphaSight AI',
    description: 'Sign in to your AlphaSight AI account.',
    path: '/login',
    noIndex: true,
  },
  signup: {
    title: 'Create Account — AlphaSight AI',
    description: 'Create a free AlphaSight AI account and start analyzing stocks with AI.',
    path: '/signup',
    keywords: ['sign up AI stock app', 'free AI investing account'],
  },
  forgotPassword: {
    title: 'Reset Password — AlphaSight AI',
    description: 'Reset your AlphaSight AI password.',
    path: '/forgot-password',
    noIndex: true,
  },
  resetPassword: {
    title: 'Reset Password — AlphaSight AI',
    description: 'Choose a new AlphaSight AI password.',
    path: '/reset-password',
    noIndex: true,
  },
  profile: {
    title: 'Profile — AlphaSight AI',
    description: 'Manage your AlphaSight AI profile and preferences.',
    path: '/profile',
    noIndex: true,
  },
  settings: {
    title: 'Settings — AlphaSight AI',
    description: 'Configure AlphaSight AI to match your workflow.',
    path: '/settings',
    noIndex: true,
  },
  about: {
    title: 'About AlphaSight AI — Our Mission & Team',
    description:
      'Learn about AlphaSight AI, the team behind the AI-powered stock intelligence platform, our mission to democratize institutional-grade research, and how we build trustworthy AI for investors.',
    path: '/about',
    keywords: ['about AlphaSight AI', 'AI fintech company', 'AI investing startup', 'stock AI team'],
  },
  privacy: {
    title: 'Privacy Policy — AlphaSight AI',
    description:
      'How AlphaSight AI collects, uses, stores, and protects your data. GDPR, CCPA, and Google AdSense compliant privacy policy.',
    path: '/privacy',
    keywords: ['AlphaSight privacy', 'AI stock app privacy policy', 'GDPR CCPA compliant'],
  },
  terms: {
    title: 'Terms of Service — AlphaSight AI',
    description:
      'Terms of service and acceptable use for AlphaSight AI — the AI stock intelligence platform.',
    path: '/terms',
    keywords: ['AlphaSight terms', 'terms of service AI stock app'],
  },
  disclaimer: {
    title: 'Financial Disclaimer — AlphaSight AI',
    description:
      'AlphaSight AI provides research and information for educational purposes only and does not constitute financial, investment, legal, or tax advice.',
    path: '/disclaimer',
    keywords: ['financial disclaimer', 'AI stock disclaimer', 'investment risk disclaimer'],
  },
  contact: {
    title: 'Contact Us — AlphaSight AI',
    description:
      'Get in touch with the AlphaSight AI team. Support, partnerships, press, and feedback.',
    path: '/contact',
    keywords: ['contact AlphaSight AI', 'AI stock app support', 'fintech partnerships'],
  },
} satisfies Record<string, RouteSeo>;

export function buildMetadata(route: RouteSeo): Metadata {
  const url = `${siteConfig.url}${route.path}`;
  const keywords = route.keywords ?? siteConfig.keywords;

  return {
    title: route.title,
    description: route.description,
    keywords: [...keywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.author, url: siteConfig.url }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    category: 'finance',
    metadataBase: new URL(siteConfig.url),
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
      type: 'website',
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

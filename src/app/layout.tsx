import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist_Mono, Fraunces } from 'next/font/google';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/error-boundary';
import { PWAInstallPrompt } from '@/components/ui/pwa-install-prompt';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  faqSchema,
} from '@/components/seo/json-ld';
import { SeoContent } from '@/components/seo/seo-content';
import './globals.css';

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const fraunces = Fraunces({
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  ...buildMetadata(routeSeo.home),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },
  icons: {
    icon: [
      { url: '/logo.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    shortcut: '/logo.svg',
    apple: '/apple-touch-icon.svg',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': siteConfig.name,
    'application-name': siteConfig.name,
    'msapplication-TileColor': siteConfig.themeColor,
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: siteConfig.themeColor },
  ],
  colorScheme: 'light dark',
};

const themeInitScript = `
(function() {
  try {
    var cookieTheme = null;
    var parts = document.cookie.split('; ');
    for (var p = 0; p < parts.length; p++) {
      if (parts[p].indexOf('theme=') === 0) {
        cookieTheme = decodeURIComponent(parts[p].slice(6));
        break;
      }
    }
    var valid = ['light','dark','sandal','blue'];
    if (cookieTheme && valid.indexOf(cookieTheme) === -1) cookieTheme = null;
    var stored = cookieTheme || localStorage.getItem('theme');
    var hasAuthSession = false;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i) || '';
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        var token = localStorage.getItem(key);
        if (token && token !== 'null') {
          hasAuthSession = true;
          break;
        }
      }
    }
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (hasAuthSession && prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark' || theme === 'blue');
  } catch (e) {}
})();
`;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://query1.finance.yahoo.com" />
        <link rel="dns-prefetch" href="https://query2.finance.yahoo.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={softwareApplicationSchema} />
        <JsonLd data={faqSchema} />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistMono.variable} ${fraunces.variable} font-sans antialiased transition-colors duration-200`}
      >
        <SeoContent />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
        <PWAInstallPrompt />
        <SpeedInsights />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `}
        </Script>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
        {ADSENSE_ID && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}

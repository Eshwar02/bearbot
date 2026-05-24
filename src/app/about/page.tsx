import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { LegalPage } from '@/components/seo/legal-page';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.about);

const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About AlphaSight AI',
  url: `${siteConfig.url}/about`,
  description: routeSeo.about.description,
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon-512.svg`,
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${siteConfig.url}/about` },
  ],
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd data={breadcrumbSchema} />
      <LegalPage title="About AlphaSight AI" updated="May 24, 2026">
        <h2>Our mission</h2>
        <p>
          We&apos;re building the AI co-pilot every investor deserves. Institutional desks have
          spent decades stacking Bloomberg terminals, sell-side research subscriptions, and quant
          tooling. Retail investors got Yahoo Finance and a comment section. AlphaSight AI closes
          that gap with streaming LLM research, live market data, portfolio analytics, and
          personalized daily briefs — all in one workspace.
        </p>

        <h2>What we do</h2>
        <ul>
          <li><strong>Streaming AI research</strong>: ask anything about markets, get
            institutional-quality analysis backed by live fundamentals, technicals, and news.</li>
          <li><strong>Portfolio intelligence</strong>: track positions, P&amp;L, exposure, and
            risk with AI commentary that explains what moved your book and why.</li>
          <li><strong>Watchlist with alerts</strong>: monitor tickers in real time with
            catalyst-aware notifications.</li>
          <li><strong>Daily brief</strong>: a personalized morning email and dashboard covering
            your holdings, the macro tape, and AI-summarized catalysts.</li>
          <li><strong>Backtest &amp; scenario tools</strong>: validate ideas against historical
            data without leaving the chat.</li>
        </ul>

        <h2>Why AlphaSight AI</h2>
        <ul>
          <li><strong>Speed</strong>: streaming responses from Groq + Mistral, never the wait
            you get from generic chat tools.</li>
          <li><strong>Grounded</strong>: every claim is checked against fresh market data so the
            model has fewer reasons to hallucinate.</li>
          <li><strong>Private</strong>: your portfolio is yours. We never train models on your
            data and we never sell it.</li>
          <li><strong>Secure</strong>: row-level security on Supabase, HTTPS-only, strict CSP,
            HSTS, and SOC2-aligned operational practices.</li>
        </ul>

        <h2>Who builds it</h2>
        <p>
          AlphaSight AI is built by a small team of engineers and traders who got tired of
          rebuilding the same analysis spreadsheet every morning. We&apos;re based in Bangalore
          and San Francisco, ship from a single codebase, and care deeply about correctness in a
          domain where bad output costs real money.
        </p>

        <h2>Our stack</h2>
        <p>
          Next.js 16 · React 19 · TypeScript · Tailwind · Supabase Postgres + Auth · Mistral AI ·
          Groq · Yahoo Finance · Vercel Edge.
        </p>

        <h2>Talk to us</h2>
        <p>
          Partnerships, press, hiring, feedback —{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. Or open the app and just
          ask the assistant about us; it&apos;s briefed.
        </p>

        <p className="mt-8">
          <Link href={siteConfig.url}>Open the app →</Link>
        </p>
      </LegalPage>
    </>
  );
}

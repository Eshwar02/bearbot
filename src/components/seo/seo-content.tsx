import { siteConfig } from '@/lib/seo';

/**
 * Crawler-visible semantic content for GEO/SEO.
 *
 * The main app is a client-rendered workspace, so search engines and AI
 * crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) see no headings or
 * factual content on the root URL. This block ships an H1, supporting
 * H2s, a short brand description, and outbound social links in the
 * server-rendered HTML so engines can extract entity facts.
 *
 * Hidden visually with `sr-only` — content is still in the DOM and indexed.
 */
export function SeoContent() {
  return (
    <div className="sr-only" aria-hidden="false">
      <h1>{siteConfig.name} — {siteConfig.tagline}</h1>
      <p>{siteConfig.longDescription}</p>

      <h2>What AlphaSight AI does</h2>
      <p>
        AlphaSight AI is an AI-first stock intelligence workspace combining
        streaming large language model chat, real-time market data from Yahoo
        Finance and Finnhub, portfolio analytics, custom watchlists, and
        personalized daily market briefs.
      </p>

      <h2>Who it is for</h2>
      <p>
        Retail investors, active traders, and professional analysts who want
        institutional-grade equity research, fundamentals, technicals, and
        sentiment analysis without institutional cost.
      </p>

      <h2>Core features</h2>
      <ul>
        <li>AI chat for stock research with streaming responses</li>
        <li>Real-time quotes for NSE, BSE, NYSE, and NASDAQ</li>
        <li>Portfolio tracker with live P&amp;L and allocation</li>
        <li>Watchlists with alerts and AI-generated context</li>
        <li>Personalized daily market brief</li>
        <li>Fundamental and technical analysis on demand</li>
        <li>Confidence-scored AI answers grounded in live data</li>
      </ul>

      <h2>Follow AlphaSight AI</h2>
      <ul>
        <li>
          <a href="https://twitter.com/alphasightai" rel="me noopener" target="_blank">
            Twitter / X
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/company/alphasightai" rel="me noopener" target="_blank">
            LinkedIn
          </a>
        </li>
        <li>
          <a href="https://github.com/alphasightai" rel="me noopener" target="_blank">
            GitHub
          </a>
        </li>
        <li>
          <a href={`mailto:${siteConfig.email}`}>Email support</a>
        </li>
      </ul>
    </div>
  );
}

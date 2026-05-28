'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { InsightsSearch } from './insights-search';

const POPULAR_TICKERS: Array<{ symbol: string; name: string; market: 'IN' | 'US' }> = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', market: 'IN' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', market: 'IN' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', market: 'IN' },
  { symbol: 'INFY.NS', name: 'Infosys', market: 'IN' },
  { symbol: 'AAPL', name: 'Apple', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet', market: 'US' },
];

export function InsightsLanding() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-borderSubtle bg-elevated px-3 py-1 text-xs text-secondary">
          <TrendingUp size={12} className="text-accent-brand" />
          AlphaSight Insights
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Analyze any listed company.
        </h1>
        <p className="max-w-2xl text-sm text-secondary sm:text-base">
          Search a ticker to see live price, fundamentals, ratios, peer comparison and an
          AI-generated take. Indian (NSE/BSE) and US listings supported.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <label htmlFor="insights-search" className="text-xs font-medium text-secondary">
          Company or ticker
        </label>
        <InsightsSearch inputId="insights-search" />
        <p className="text-[11px] text-muted">
          Try <span className="font-mono">RELIANCE.NS</span>, <span className="font-mono">TCS.NS</span>, <span className="font-mono">AAPL</span>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Popular
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {POPULAR_TICKERS.map((t) => (
            <Link
              key={t.symbol}
              href={`/insights/${encodeURIComponent(t.symbol)}`}
              className="group flex flex-col gap-1 rounded-xl border border-borderSubtle bg-canvas p-3 transition-colors hover:border-accent-brand hover:bg-elevated"
            >
              <span className="font-mono text-xs text-muted group-hover:text-accent-brand">
                {t.symbol}
              </span>
              <span className="text-sm font-medium text-primary">{t.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">
                {t.market === 'IN' ? 'India · NSE' : 'US'}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

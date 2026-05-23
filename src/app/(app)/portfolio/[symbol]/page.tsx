'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { PriceChart, type Range } from '@/components/portfolio/price-chart';
import type {
  StockQuote,
  StockHistory,
  CompanyInfoFull,
  NewsItem,
  FundamentalsExtended,
} from '@/types/stock';

type FullQuote = StockQuote & FundamentalsExtended;

interface DetailResponse {
  quote: FullQuote | null;
  history: StockHistory;
  sparkline: StockHistory;
  info: CompanyInfoFull | null;
  news: NewsItem[];
  range: Range;
}

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const rawSymbol = params?.symbol;
  const symbol = useMemo(
    () => (Array.isArray(rawSymbol) ? rawSymbol[0] : rawSymbol) ?? '',
    [rawSymbol]
  );

  const [range, setRange] = useState<Range>('1M');
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    const isInitial = data === null;
    if (isInitial) setLoading(true);
    else setRangeLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/stock/details/${encodeURIComponent(symbol)}?range=${range}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Failed to load');
        const payload = (await res.json()) as DetailResponse;
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRangeLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, range]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="mb-3 h-10 w-72" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="text-right">
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (error || !data?.quote) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="mb-4 text-lg text-primary">Couldn&apos;t load {symbol}</p>
        <p className="mb-6 text-sm text-muted">{error || 'No data available for this symbol.'}</p>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-green/15 px-4 py-2 text-sm font-medium text-accent-green hover:bg-accent-green/25"
        >
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>
      </div>
    );
  }

  const q = data.quote;
  const isUp = q.change >= 0;
  const currency = q.currency || 'USD';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/portfolio"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to portfolio
      </Link>

      {/* Hero */}
      <header className="mb-8 flex flex-col gap-6 border-b border-borderSubtle pb-8 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-4xl font-bold tracking-tight text-primary">
            {q.name || q.symbol}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="gray" className="text-xs font-semibold uppercase tracking-wide">
              {q.symbol}
            </Badge>
            {q.exchange && (
              <Badge variant="blue" className="text-xs">
                {q.exchange}
              </Badge>
            )}
            {data.info?.sector && data.info.sector !== 'Unknown' && (
              <Badge variant="gray" className="text-xs">
                {data.info.sector}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted">Current price</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {formatCurrency(q.price, currency)}
          </p>
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium',
              isUp
                ? 'bg-accent-green/15 text-accent-green'
                : 'bg-accent-red/15 text-accent-red'
            )}
          >
            {isUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {isUp ? '+' : ''}
            {formatCurrency(Math.abs(q.change), currency)} ({formatPercent(q.changePercent)})
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Market Cap" value={q.marketCap > 0 ? `${currency === 'USD' ? '$' : '₹'}${formatNumber(q.marketCap)}` : '—'} />
        <KpiTile
          label="Volume"
          value={q.volume > 0 ? formatNumber(q.volume) : '—'}
        />
        <KpiTile
          label="Day High"
          value={formatCurrency(q.dayHigh, currency)}
          accent="green"
        />
        <KpiTile
          label="Day Low"
          value={formatCurrency(q.dayLow, currency)}
          accent="red"
        />
      </section>

      {/* Chart */}
      <section className="mb-8">
        <PriceChart
          series={data.history.map((h) => ({
            date: h.date,
            close: h.close,
            open: h.open,
            high: h.high,
            low: h.low,
            volume: h.volume,
          }))}
          currency={currency}
          range={range}
          onRangeChange={setRange}
          loading={rangeLoading}
        />
      </section>

      {/* Price stats */}
      <section className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Price stats
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="52W High" value={formatCurrency(q.high52, currency)} />
          <KpiTile label="52W Low" value={formatCurrency(q.low52, currency)} />
          <KpiTile label="Open" value={formatCurrency(q.open, currency)} />
          <KpiTile label="Prev. Close" value={formatCurrency(q.previousClose, currency)} />
        </div>
      </section>

      {/* Valuation */}
      <section className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Valuation
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="P/E Ratio" value={fmtRatio(q.pe)} />
          <KpiTile label="EPS" value={fmtRatio(q.eps)} />
          <KpiTile label="Price/Book" value={fmtRatio(q.priceToBook)} />
          <KpiTile label="Book Value" value={q.bookValue != null ? formatCurrency(q.bookValue, currency) : '—'} />
          <KpiTile label="Enterprise Value" value={fmtBig(q.enterpriseValue, currency)} />
          <KpiTile label="EBITDA" value={fmtBig(q.ebitda, currency)} />
          <KpiTile label="Beta" value={fmtRatio(q.beta)} />
          <KpiTile label="Shares Out" value={fmtBig(q.sharesOutstanding, '')} />
        </div>
      </section>

      {/* Profitability + Growth */}
      <section className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Profitability & growth
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="ROE" value={fmtPct(q.roe)} />
          <KpiTile label="ROA" value={fmtPct(q.returnOnAssets)} />
          <KpiTile label="Profit Margin" value={fmtPct(q.profitMargins)} />
          <KpiTile label="Revenue Growth" value={fmtPct(q.revenueGrowth)} accent={q.revenueGrowth != null && q.revenueGrowth >= 0 ? 'green' : 'red'} />
          <KpiTile label="Earnings Growth" value={fmtPct(q.earningsGrowth)} accent={q.earningsGrowth != null && q.earningsGrowth >= 0 ? 'green' : 'red'} />
          <KpiTile label="Revenue" value={fmtBig(q.revenue, currency)} />
          <KpiTile label="Gross Profit" value={fmtBig(q.grossProfit, currency)} />
          <KpiTile label="Avg Volume" value={fmtBig(q.averageVolume, '')} />
        </div>
      </section>

      {/* Balance sheet + cash flow */}
      <section className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Balance sheet & cash flow
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="Debt/Equity" value={fmtRatio(q.debtToEquity)} />
          <KpiTile label="Current Ratio" value={fmtRatio(q.currentRatio)} />
          <KpiTile label="Total Cash" value={fmtBig(q.totalCash, currency)} />
          <KpiTile label="Free Cash Flow" value={fmtBig(q.freeCashflow, currency)} />
          <KpiTile label="Operating Cash" value={fmtBig(q.operatingCashflow, currency)} />
          <KpiTile label="Dividend Yield" value={fmtPct(q.dividendYield)} />
          <KpiTile label="Dividend Rate" value={q.dividendRate != null ? formatCurrency(q.dividendRate, currency) : '—'} />
          <KpiTile label="Payout Ratio" value={fmtPct(q.payoutRatio)} />
        </div>
      </section>

      {/* Company info + News two-col */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {data.info && (
          <div className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-md lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-primary">
              <Building2 className="h-4 w-4 text-accent-blue" />
              About {data.info.longName || q.name || q.symbol}
            </h2>
            {data.info.description && (
              <p className="mb-4 text-sm leading-relaxed text-secondary line-clamp-6">
                {data.info.description}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              {data.info.industry && data.info.industry !== 'Unknown' && (
                <Stat label="Industry" value={data.info.industry} />
              )}
              {data.info.ceo && <Stat label="CEO" value={data.info.ceo} />}
              {data.info.employees != null && (
                <Stat
                  label="Employees"
                  value={formatNumber(data.info.employees)}
                  icon={<Users className="h-3.5 w-3.5" />}
                />
              )}
              {(data.info.city || data.info.state || data.info.country) && (
                <Stat
                  label="Headquarters"
                  value={[data.info.city, data.info.state, data.info.country]
                    .filter(Boolean)
                    .join(', ')}
                />
              )}
              {data.info.ipoDate && <Stat label="IPO Date" value={data.info.ipoDate} />}
              {data.info.exchange && <Stat label="Exchange" value={data.info.exchange} />}
              {data.info.exchangeTimezone && (
                <Stat label="Timezone" value={data.info.exchangeTimezone} />
              )}
              {data.info.currency && <Stat label="Currency" value={data.info.currency} />}
              {data.info.quoteType && <Stat label="Type" value={data.info.quoteType} />}
              {data.info.fundFamily && <Stat label="Fund Family" value={data.info.fundFamily} />}
              {data.info.fundCategory && (
                <Stat label="Fund Category" value={data.info.fundCategory} />
              )}
              {data.info.legalType && <Stat label="Legal Type" value={data.info.legalType} />}
              {data.info.phone && <Stat label="Phone" value={data.info.phone} />}
              {data.info.address && <Stat label="Address" value={data.info.address} />}
              {data.info.website && (
                <Stat
                  label="Website"
                  value={
                    <a
                      href={data.info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent-brand hover:underline"
                    >
                      {new URL(data.info.website).hostname.replace(/^www\./, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                  icon={<Globe className="h-3.5 w-3.5" />}
                />
              )}
            </dl>
          </div>
        )}

        <div className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-md">
          <h2 className="mb-4 text-base font-semibold text-primary">Latest news</h2>
          {data.news.length === 0 ? (
            <p className="text-sm text-muted">No recent news for this symbol.</p>
          ) : (
            <ul className="space-y-3">
              {data.news.slice(0, 6).map((n, i) => (
                <li key={i}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-primary group-hover:text-accent-brand">
                      {n.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {n.source} ·{' '}
                      {new Date(n.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function fmtRatio(v: number | null | undefined): string {
  return v != null && Number.isFinite(v) ? v.toFixed(2) : '—';
}

function fmtPct(v: number | null | undefined): string {
  return v != null && Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : '—';
}

function fmtBig(v: number | null | undefined, currency: string): string {
  if (v == null || !Number.isFinite(v) || v === 0) return '—';
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency ? `${currency} ` : '';
  return `${sym}${formatNumber(v)}`;
}

function KpiTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red';
}) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-xl font-bold',
          accent === 'green' && 'text-accent-green',
          accent === 'red' && 'text-accent-red',
          !accent && 'text-primary'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-primary">{value}</dd>
    </div>
  );
}

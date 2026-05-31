import type { CompanyOverview } from '@/lib/insights/server';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
  overview: CompanyOverview;
}

function isIndianSymbol(symbol: string): boolean {
  return /\.(NS|BO)$/i.test(symbol);
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '';
  }
}

function fmtLarge(value: number | null, currency: string, indian: boolean): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const sym = currencySymbol(currency);
  if (indian) {
    if (abs >= 1e7) return `${sign}${sym}${(abs / 1e7).toFixed(0)} Cr.`;
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(2)} L`;
    return `${sign}${sym}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  return `${sign}${sym}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtMoney(value: number | null, currency: string): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sym = currencySymbol(currency);
  return `${sym} ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function fmtRatio(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

function fmtPercent(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)} %`;
}

function fmtHighLow(
  high: number | null,
  low: number | null,
  currency: string,
): string {
  if (high == null && low == null) return '—';
  const sym = currencySymbol(currency);
  const fmt = (n: number | null) =>
    n != null && Number.isFinite(n) ? Math.round(n).toString() : '—';
  return `${sym} ${fmt(high)} / ${fmt(low)}`;
}

interface Cell {
  label: string;
  value: string;
}

export function MetricsGrid({ overview }: MetricsGridProps) {
  const { ratios, profile, quote, symbol } = overview;
  const indian = isIndianSymbol(symbol);
  const currency = quote.currency;

  // Three column groups matching the screener layout: each column is a stack
  // of related metrics rather than a tight grid of square cards.
  const columns: Cell[][] = [
    [
      { label: 'Market Cap', value: fmtLarge(profile.marketCap, currency, indian) },
      { label: 'Stock P/E', value: fmtRatio(ratios.trailingPE) },
      { label: 'ROCE', value: fmtPercent(ratios.returnOnAssets) },
    ],
    [
      { label: 'Current Price', value: fmtMoney(quote.price, currency) },
      { label: 'Book Value', value: fmtRatio(ratios.priceToBook != null && quote.price != null ? quote.price / ratios.priceToBook : null) },
      { label: 'ROE', value: fmtPercent(ratios.returnOnEquity) },
    ],
    [
      { label: 'High / Low', value: fmtHighLow(ratios.fiftyTwoWeekHigh, ratios.fiftyTwoWeekLow, currency) },
      { label: 'Dividend Yield', value: fmtPercent(ratios.dividendYield) },
      { label: 'Face Value', value: '—' },
    ],
  ];

  return (
    <section className="mt-4 rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-sm md:p-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
        {columns.map((col, ci) => (
          <div key={ci} className="space-y-3">
            {col.map((cell, i) => (
              <div
                key={cell.label}
                className={cn(
                  'flex items-baseline justify-between gap-3 border-b border-borderSubtle/60 pb-3 last:border-b-0 last:pb-0',
                  i === col.length - 1 && 'border-b-0 pb-0'
                )}
              >
                <span className="text-sm text-secondary">{cell.label}</span>
                <span className="text-right text-base font-semibold tabular-nums text-primary">
                  {cell.value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-borderSubtle pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-3 text-sm">
          <span className="font-medium text-primary">Add ratio to table</span>
          <input
            type="text"
            placeholder="eg. Promoter holding"
            disabled
            className="min-w-0 flex-1 cursor-not-allowed rounded-lg border border-borderSubtle bg-canvas px-3 py-2 text-sm text-muted placeholder:text-muted/70"
          />
        </label>
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-accent-brand/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-accent-brand/70"
        >
          ✎ Edit ratios
        </button>
      </div>
    </section>
  );
}

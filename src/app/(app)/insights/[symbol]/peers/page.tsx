import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyOverview, getCompanyPeers } from '@/lib/insights/server';

interface PeersPageProps {
  params: Promise<{ symbol: string }>;
}

type RecommendationRow = {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

const segmentStyles: Array<{
  key: keyof Omit<RecommendationRow, 'period'>;
  label: string;
  className: string;
  swatch: string;
}> = [
  {
    key: 'strongBuy',
    label: 'Strong buy',
    className: 'bg-emerald-500',
    swatch: 'bg-emerald-500',
  },
  {
    key: 'buy',
    label: 'Buy',
    className: 'bg-emerald-300',
    swatch: 'bg-emerald-300',
  },
  {
    key: 'hold',
    label: 'Hold',
    className: 'bg-slate-400',
    swatch: 'bg-slate-400',
  },
  {
    key: 'sell',
    label: 'Sell',
    className: 'bg-rose-400',
    swatch: 'bg-rose-400',
  },
  {
    key: 'strongSell',
    label: 'Strong sell',
    className: 'bg-rose-600',
    swatch: 'bg-rose-600',
  },
];

function formatPeriodLabel(period: string): string {
  if (/^-?\d+m$/i.test(period)) {
    const n = parseInt(period.replace(/m$/i, ''), 10);
    if (n === 0) return 'Current month';
    const months = Math.abs(n);
    return `${months}mo ago`;
  }
  return period || '—';
}

function totalFor(row: RecommendationRow): number {
  return row.strongBuy + row.buy + row.hold + row.sell + row.strongSell;
}

function fmtCr(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return (v / 1e7).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtRatio(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const INDEX_CHIPS = ['BSE Sensex', 'Nifty 50', 'BSE 500', 'BSE FMCG', 'BSE 100'];

const TABLE_HEADERS = [
  { label: 'S.No.', align: 'left' as const },
  { label: 'Name', align: 'left' as const },
  { label: 'CMP Rs.', align: 'right' as const },
  { label: 'P/E', align: 'right' as const },
  { label: 'Mar Cap Rs.Cr.', align: 'right' as const },
  { label: 'Div Yld %', align: 'right' as const },
  { label: 'NP Qtr Rs.Cr.', align: 'right' as const },
  { label: 'Qtr Profit Var %', align: 'right' as const },
  { label: 'Sales Qtr Rs.Cr.', align: 'right' as const },
  { label: 'Qtr Sales Var %', align: 'right' as const },
  { label: 'ROCE %', align: 'right' as const },
];

export default async function PeersPage({ params }: PeersPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const [overview, peers] = await Promise.all([
    getCompanyOverview(symbol),
    getCompanyPeers(symbol),
  ]);
  const trend = (peers?.trend ?? []) as RecommendationRow[];

  const profile = overview?.profile;
  const ratios = overview?.ratios;
  const quote = overview?.quote;

  const sector = profile?.sector?.trim();
  const industry = profile?.industry?.trim();
  const hasSectorData = Boolean(sector || industry);

  const currentName = profile?.longName || symbol;
  const currentCmp = fmtRatio(quote?.price ?? null);
  const currentPE = fmtRatio(ratios?.trailingPE ?? null);
  const currentMarCap = fmtCr(profile?.marketCap ?? null);
  const currentDivYld = fmtPct(
    ratios?.dividendYield != null ? ratios.dividendYield * 100 : null,
  );
  const currentRoce = fmtPct(
    ratios?.returnOnEquity != null ? ratios.returnOnEquity * 100 : null,
  );

  const placeholderRows = [1, 2, 3, 4].map((i) => ({
    name: `Peer ${i}`,
    cells: Array(9).fill('—'),
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-borderSubtle bg-elevated shadow-sm">
        <header className="border-b border-borderSubtle px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-primary sm:text-base">
                Peer comparison
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                {hasSectorData ? (
                  <>
                    <span>{sector || '—'}</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    <span>{industry || '—'}</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    <span>{industry || '—'}</span>
                  </>
                ) : (
                  <span>Sector data pending</span>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled
              className={cn(
                'rounded-md border border-accentBrand/40 px-3 py-1.5 text-xs font-medium text-accentBrand',
                'cursor-not-allowed opacity-60',
              )}
            >
              Edit Columns
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Part of:</span>
            {INDEX_CHIPS.map((chip) => (
              <span
                key={chip}
                className={cn(
                  'rounded-full border border-borderSubtle bg-canvas px-2.5 py-0.5 text-xs text-secondary',
                  'cursor-not-allowed opacity-70',
                )}
              >
                {chip}
              </span>
            ))}
            <span className="cursor-not-allowed text-xs text-muted opacity-70 underline-offset-2 hover:underline">
              show all
            </span>
          </div>
        </header>

        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-borderSubtle text-xs uppercase tracking-wide text-muted">
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h.label}
                    className={cn(
                      'whitespace-nowrap px-2 py-2 font-medium',
                      h.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-borderSubtle/60 font-semibold text-primary">
                <td className="px-2 py-2 text-left tabular-nums">1.</td>
                <td className="px-2 py-2 text-left">{currentName}</td>
                <td className="px-2 py-2 text-right tabular-nums">{currentCmp}</td>
                <td className="px-2 py-2 text-right tabular-nums">{currentPE}</td>
                <td className="px-2 py-2 text-right tabular-nums">{currentMarCap}</td>
                <td className="px-2 py-2 text-right tabular-nums">{currentDivYld}</td>
                <td className="px-2 py-2 text-right tabular-nums">—</td>
                <td className="px-2 py-2 text-right tabular-nums">—</td>
                <td className="px-2 py-2 text-right tabular-nums">—</td>
                <td className="px-2 py-2 text-right tabular-nums">—</td>
                <td className="px-2 py-2 text-right tabular-nums">{currentRoce}</td>
              </tr>
              {placeholderRows.map((row, idx) => (
                <tr
                  key={row.name}
                  className="border-b border-borderSubtle/60 text-secondary"
                >
                  <td className="px-2 py-2 text-left tabular-nums">{idx + 2}.</td>
                  <td className="px-2 py-2 text-left">{row.name}</td>
                  {row.cells.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-2 py-2 text-right tabular-nums text-muted"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-canvas/50 text-xs font-medium text-secondary">
                <td className="px-2 py-2 text-left" />
                <td className="px-2 py-2 text-left">Median: 5 Co.</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">—</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label
              htmlFor="detailed-compare"
              className="text-xs font-medium text-secondary"
            >
              Detailed Comparison with:
            </label>
            <input
              id="detailed-compare"
              type="text"
              disabled
              placeholder="eg. Infosys"
              className={cn(
                'rounded-md border border-borderSubtle bg-canvas px-3 py-1.5 text-xs text-secondary placeholder:text-muted',
                'cursor-not-allowed opacity-70',
              )}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-borderSubtle bg-elevated shadow-sm">
        <header className="border-b border-borderSubtle px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-primary sm:text-base">
            Analyst recommendations (last 4 months)
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Distribution of analyst ratings from Yahoo Finance.
          </p>
        </header>

        <div className="min-h-64 p-4 sm:p-5">
          {trend.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted">
              No analyst recommendation data available.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-secondary">
                {segmentStyles.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm ${s.swatch}`} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              <ul className="space-y-3">
                {trend.map((row) => {
                  const total = totalFor(row);
                  return (
                    <li key={row.period} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-secondary">
                          {formatPeriodLabel(row.period)}
                        </span>
                        <span className="tabular-nums text-muted">
                          {total} {total === 1 ? 'analyst' : 'analysts'}
                        </span>
                      </div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-canvas">
                        {total === 0 ? (
                          <div className="h-full w-full bg-borderSubtle/40" />
                        ) : (
                          segmentStyles.map((s) => {
                            const value = row[s.key];
                            if (!value) return null;
                            const pct = (value / total) * 100;
                            return (
                              <div
                                key={s.key}
                                className={`${s.className} h-full`}
                                style={{ width: `${pct}%` }}
                                title={`${s.label}: ${value}`}
                              />
                            );
                          })
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

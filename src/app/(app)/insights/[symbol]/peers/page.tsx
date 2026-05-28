import { getCompanyPeers } from '@/lib/insights/server';

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
  // Yahoo periods look like "0m", "-1m", "-2m", "-3m" relative to today.
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

export default async function PeersPage({ params }: PeersPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const peers = await getCompanyPeers(symbol);
  const trend = (peers?.trend ?? []) as RecommendationRow[];

  return (
    <div className="space-y-4">
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

      <p className="rounded-lg border border-dashed border-borderSubtle bg-canvas px-4 py-3 text-xs text-muted">
        Peer comparison is in development — for now we surface the analyst recommendation distribution from Yahoo Finance.
      </p>
    </div>
  );
}

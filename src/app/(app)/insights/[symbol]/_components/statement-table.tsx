import { cn } from '@/lib/utils';

export type StatementTableRow = {
  endDate: string;
  [metric: string]: number | string | null;
};

export type StatementTableMetric = {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'percent';
};

interface StatementTableProps {
  title: string;
  periods: StatementTableRow[];
  metrics: StatementTableMetric[];
  currency?: string;
  className?: string;
}

const currencyPrefix = (code: string | undefined): string => {
  const c = (code || 'USD').toUpperCase();
  if (c === 'INR') return '₹';
  if (c === 'USD') return '$';
  return `${c} `;
};

const formatAbbrev = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
};

const formatValue = (
  value: number | string | null,
  format: 'currency' | 'number' | 'percent' | undefined,
  currencySym: string,
): string => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return typeof value === 'string' ? value : '—';

  if (format === 'percent') {
    const pct = Math.abs(num) <= 1.5 ? num * 100 : num;
    return `${pct.toFixed(2)}%`;
  }
  if (format === 'currency') {
    const abs = Math.abs(num);
    if (abs >= 1e6) {
      const sign = num < 0 ? '-' : '';
      return `${sign}${currencySym}${formatAbbrev(abs)}`;
    }
    return `${num < 0 ? '-' : ''}${currencySym}${Math.abs(num).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }
  // number
  if (Math.abs(num) >= 1e6) return formatAbbrev(num);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatPeriodHeader = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};

export function StatementTable({
  title,
  periods,
  metrics,
  currency,
  className,
}: StatementTableProps) {
  const currencySym = currencyPrefix(currency);
  const sortedPeriods = [...periods].sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
  const isEmpty = sortedPeriods.length === 0 || metrics.length === 0;

  return (
    <section
      className={cn(
        'rounded-xl border border-borderSubtle bg-elevated shadow-sm',
        className,
      )}
    >
      <header className="border-b border-borderSubtle px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-primary sm:text-base">{title}</h3>
        {currency ? (
          <p className="mt-0.5 text-xs text-muted">Values in {currency.toUpperCase()}</p>
        ) : null}
      </header>

      <div className="min-h-64">
        {isEmpty ? (
          <div className="flex h-64 items-center justify-center px-4 text-sm text-muted">
            No statement data available.
          </div>
        ) : (
          <>
            {/* Desktop / tablet: scrollable table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-borderSubtle text-left">
                    <th className="sticky left-0 z-10 bg-elevated px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Metric
                    </th>
                    {sortedPeriods.map((p) => (
                      <th
                        key={p.endDate}
                        className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted whitespace-nowrap"
                      >
                        {formatPeriodHeader(p.endDate)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, idx) => (
                    <tr
                      key={m.key}
                      className={cn(
                        idx !== metrics.length - 1 && 'border-b border-borderSubtle/60',
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-elevated px-4 py-3 font-medium text-secondary whitespace-nowrap">
                        {m.label}
                      </td>
                      {sortedPeriods.map((p) => (
                        <td
                          key={`${m.key}-${p.endDate}`}
                          className="px-4 py-3 text-right tabular-nums text-primary whitespace-nowrap"
                        >
                          {formatValue(p[m.key] ?? null, m.format, currencySym)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: per-period card stack */}
            <div className="space-y-4 p-4 sm:hidden">
              {sortedPeriods.map((p) => (
                <div
                  key={p.endDate}
                  className="rounded-lg border border-borderSubtle bg-canvas p-3"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {formatPeriodHeader(p.endDate)}
                  </div>
                  <dl className="space-y-1.5">
                    {metrics.map((m) => (
                      <div
                        key={`${p.endDate}-${m.key}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <dt className="text-secondary">{m.label}</dt>
                        <dd className="tabular-nums text-primary">
                          {formatValue(p[m.key] ?? null, m.format, currencySym)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

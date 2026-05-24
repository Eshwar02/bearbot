'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { FlaskConical, TrendingUp, TrendingDown, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { usePrefs } from '@/lib/hooks/use-prefs';

// ── Types mirrored from engine output ────────────────────────────────

interface EquityPoint {
  date: string;
  value: number;
}

interface BacktestMetrics {
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  volatility: number;
}

interface BacktestResult {
  equityCurve: EquityPoint[];
  metrics: BacktestMetrics;
}

function fmt(n: number): string {
  return formatPercent(n * 100);
}

// ── Metric card ───────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean | null;
}) {
  const color =
    positive === null
      ? 'text-accent-blue'
      : positive
      ? 'text-accent-green'
      : 'text-accent-red';

  return (
    <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
      <p className="mb-1 text-xs uppercase tracking-wide text-dark-400">{label}</p>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-dark-700 bg-dark-800/95 px-3 py-2 shadow-xl">
      <p className="text-xs text-dark-400">{label}</p>
      <p className="text-sm font-semibold text-gray-100">
        {formatCurrency(payload[0].value, currency, { compact: false })}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function BacktestPanel() {
  const prefs = usePrefs();
  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/portfolio/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = (await res.json()) as BacktestResult & { error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Backtest failed. Please try again.');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const metrics = result?.metrics;
  const curve = result?.equityCurve ?? [];

  // Downsample if curve is very large (> 500 pts) for performance
  const displayCurve =
    curve.length > 500
      ? curve.filter((_, i) => i % Math.ceil(curve.length / 500) === 0)
      : curve;

  return (
    <div
      id="backtest-panel"
      className="mb-8 rounded-2xl border border-dark-700/70 bg-gradient-to-br from-dark-800/95 via-dark-850/85 to-dark-900/80 p-6 shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <FlaskConical className="h-5 w-5 text-accent-brand" />
            Portfolio Backtesting
          </h2>
          <p className="mt-1 text-sm text-dark-400">
            Simulate your current holdings over a historical date range.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-dark-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent-brand/70" />
            <span className="absolute inset-0 rounded-full bg-accent-brand" />
          </span>
          <Activity className="h-3 w-3 text-accent-brand" />
          Powered by Yahoo Finance v8
        </div>
      </div>

      {/* Controls */}
      <div
        className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        aria-label="Backtest date range controls"
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="backtest-start-date"
            className="text-xs text-dark-400"
          >
            Start Date
          </label>
          <input
            id="backtest-start-date"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="backtest-end-date"
            className="text-xs text-dark-400"
          >
            End Date
          </label>
          <input
            id="backtest-end-date"
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/30"
          />
        </div>

        <Button
          id="backtest-run-btn"
          onClick={() => void handleRun()}
          disabled={loading}
          size="sm"
          className="sm:self-end"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <FlaskConical className="mr-2 h-4 w-4" />
              Run Backtest
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Metrics */}
          {metrics && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="Total Return"
                value={fmt(metrics.totalReturn)}
                positive={metrics.totalReturn >= 0}
              />
              <MetricCard
                label="CAGR"
                value={fmt(metrics.cagr)}
                positive={metrics.cagr >= 0}
              />
              <MetricCard
                label="Max Drawdown"
                value={fmt(metrics.maxDrawdown)}
                positive={metrics.maxDrawdown >= 0}
              />
              <MetricCard
                label="Volatility (Ann.)"
                value={fmt(metrics.volatility)}
                positive={null}
              />
            </div>
          )}

          {/* Equity Curve */}
          {displayCurve.length > 1 ? (
            <div className="rounded-xl border border-dark-700 bg-dark-900/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-100">Equity Curve</p>
                {metrics && (
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      metrics.totalReturn >= 0
                        ? 'text-accent-green'
                        : 'text-accent-red'
                    )}
                  >
                    {metrics.totalReturn >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {fmt(metrics.totalReturn)} over period
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={displayCurve}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(v: string) => v.slice(0, 7)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      formatCurrency(v, prefs.currency, { compact: true })
                    }
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip currency={prefs.currency} />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      metrics && metrics.totalReturn >= 0
                        ? '#22c55e'
                        : '#ef4444'
                    }
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dark-700 bg-dark-900/40 py-8 text-sm text-dark-400">
              No price data found for the selected date range.
            </div>
          )}
        </>
      )}
    </div>
  );
}

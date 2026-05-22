'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';

const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as const;
type Range = (typeof RANGES)[number];

interface PricePoint {
  date: string;
  close: number;
}

interface PriceChartProps {
  series: PricePoint[];
  currency?: string;
  range: Range;
  onRangeChange: (r: Range) => void;
  loading?: boolean;
}

function ChartTooltip(props: unknown, currency: string) {
  // Recharts content callback gets a loosely-typed object; read what we need
  // and ignore the rest.
  const p = props as {
    active?: boolean;
    payload?: ReadonlyArray<{ value?: number | string }>;
    label?: string | number;
  };
  if (!p.active || !p.payload || p.payload.length === 0) return null;
  const raw = p.payload[0].value;
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) return null;
  const label = p.label;
  // Yahoo date strings come as YYYY-MM-DD for daily, full ISO for intraday.
  const d = new Date(label as string);
  const formatted = Number.isNaN(d.getTime())
    ? String(label)
    : d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(String(label).includes('T') && { hour: '2-digit', minute: '2-digit' }),
      });

  return (
    <div className="rounded-lg border border-borderSubtle bg-canvas/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="mb-0.5 text-muted">{formatted}</p>
      <p className="font-semibold text-primary">
        {formatCurrency(value, currency)}
      </p>
    </div>
  );
}

function PriceChart({ series, currency = 'USD', range, onRangeChange, loading }: PriceChartProps) {
  const [hovered, setHovered] = useState<PricePoint | null>(null);

  const { data, isUp, min, max } = useMemo(() => {
    if (!series || series.length === 0) {
      return { data: [], isUp: true, min: 0, max: 0 };
    }
    const closes = series.map((p) => p.close);
    return {
      data: series,
      isUp: series[series.length - 1].close >= series[0].close,
      min: Math.min(...closes),
      max: Math.max(...closes),
    };
  }, [series]);

  const color = isUp ? 'var(--accent-green)' : 'var(--accent-red)';
  const gradientId = `chartFill-${isUp ? 'up' : 'down'}`;

  // Y-axis padding so the line doesn't touch the top/bottom edges.
  const pad = (max - min) * 0.08 || max * 0.02;
  const yDomain: [number, number] = [Math.max(0, min - pad), max + pad];

  return (
    <div className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Price history</p>
          {hovered ? (
            <p className="mt-1 text-lg font-semibold text-primary">
              {formatCurrency(hovered.close, currency)}
              <span className="ml-2 text-xs font-normal text-muted">
                {new Date(hovered.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-lg font-semibold text-primary">
              {data.length > 0
                ? formatCurrency(data[data.length - 1].close, currency)
                : '—'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-canvas p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                range === r
                  ? 'bg-elevated text-primary shadow-sm'
                  : 'text-muted hover:text-primary'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[340px] w-full">
        {loading || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {loading ? 'Loading price history…' : 'No price data available'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
              onMouseMove={(state: unknown) => {
                // Recharts 3.x has a loosely-typed state; we read the active
                // payload defensively.
                const s = state as {
                  isTooltipActive?: boolean;
                  activePayload?: Array<{ payload?: PricePoint }>;
                };
                if (s.isTooltipActive && s.activePayload?.[0]?.payload) {
                  setHovered(s.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border-subtle)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  if (Number.isNaN(d.getTime())) return v;
                  // Intraday formats vs daily
                  if (range === '1D') {
                    return d.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                  }
                  if (range === '1W') {
                    return d.toLocaleDateString('en-US', {
                      weekday: 'short',
                    });
                  }
                  if (range === '5Y' || range === 'ALL') {
                    return d.toLocaleDateString('en-US', { year: 'numeric' });
                  }
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={(v: number) => formatCurrency(v, currency, { compact: true })}
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={64}
                orientation="right"
              />
              <Tooltip
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                content={(props) => ChartTooltip(props, currency)}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-elevated)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export { PriceChart, RANGES };
export type { Range };

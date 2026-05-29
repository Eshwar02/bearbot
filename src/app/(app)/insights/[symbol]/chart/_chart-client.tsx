'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { PriceChart, type Range } from '@/components/portfolio/price-chart';
import { cn } from '@/lib/utils';

interface ChartClientProps {
  symbol: string;
  currency: string;
}

interface PricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface DetailsHistoryItem {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

const SCREENER_RANGES: Array<{ label: string; range: Range }> = [
  { label: '1M', range: '1M' },
  { label: '6M', range: '6M' },
  { label: '1Yr', range: '1Y' },
  { label: '3Yr', range: '5Y' },
  { label: '5Yr', range: '5Y' },
  { label: '10Yr', range: 'ALL' },
  { label: 'Max', range: 'ALL' },
];

type ChartMode = 'price' | 'pe' | 'more';

export function ChartClient({ symbol, currency }: ChartClientProps) {
  const [rangeLabel, setRangeLabel] = useState('1Yr');
  const [series, setSeries] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ChartMode>('price');
  const [overlays, setOverlays] = useState({
    priceNse: true,
    dma50: false,
    dma200: false,
    volume: true,
  });

  const activeRange = useMemo<Range>(
    () => SCREENER_RANGES.find((r) => r.label === rangeLabel)?.range ?? '1Y',
    [rangeLabel],
  );

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/stock/details/${encodeURIComponent(symbol)}?range=${activeRange}&sparkline=false`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as { history?: DetailsHistoryItem[] };
        if (!cancelled) {
          setSeries(
            (data.history ?? []).map((h) => ({
              date: h.date,
              close: h.close,
              open: h.open,
              high: h.high,
              low: h.low,
              volume: h.volume,
            })),
          );
        }
      } catch {
        if (!cancelled) setSeries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, activeRange]);

  return (
    <section className="rounded-2xl border border-borderSubtle bg-elevated p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-borderSubtle bg-canvas p-1">
          {SCREENER_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRangeLabel(r.label)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                rangeLabel === r.label
                  ? 'bg-accent-brand/15 text-accent-brand'
                  : 'text-secondary hover:text-primary'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-borderSubtle bg-canvas p-1">
            {(
              [
                { id: 'price' as ChartMode, label: 'Price' },
                { id: 'pe' as ChartMode, label: 'PE Ratio' },
                { id: 'more' as ChartMode, label: 'More' },
              ]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                disabled={m.id !== 'price'}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  mode === m.id
                    ? 'bg-accent-brand/15 text-accent-brand'
                    : 'text-secondary hover:text-primary disabled:cursor-not-allowed disabled:text-muted'
                )}
              >
                {m.label}
                {m.id === 'more' && <ChevronDown className="h-3 w-3" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-borderSubtle bg-canvas px-3 py-1.5 text-xs font-semibold text-secondary"
          >
            <Bell className="h-3.5 w-3.5" />
            Alerts
          </button>
        </div>
      </div>

      <PriceChart
        series={series}
        currency={currency}
        range={activeRange}
        onRangeChange={() => {
          /* range controlled by SCREENER_RANGES buttons above */
        }}
        loading={loading}
      />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-borderSubtle pt-3 text-xs text-secondary">
        <ToggleCheckbox
          checked={overlays.priceNse}
          onChange={(v) => setOverlays((s) => ({ ...s, priceNse: v }))}
          label="Price on NSE"
          swatch="bg-accent-brand"
        />
        <ToggleCheckbox
          checked={overlays.dma50}
          onChange={(v) => setOverlays((s) => ({ ...s, dma50: v }))}
          label="50 DMA"
          disabled
        />
        <ToggleCheckbox
          checked={overlays.dma200}
          onChange={(v) => setOverlays((s) => ({ ...s, dma200: v }))}
          label="200 DMA"
          disabled
        />
        <ToggleCheckbox
          checked={overlays.volume}
          onChange={(v) => setOverlays((s) => ({ ...s, volume: v }))}
          label="Volume"
          swatch="bg-accent-blue/70"
        />
      </div>
    </section>
  );
}

function ToggleCheckbox({
  checked,
  onChange,
  label,
  swatch,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  swatch?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-1.5',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="h-3.5 w-3.5 rounded border-borderSubtle text-accent-brand focus:ring-accent-brand"
      />
      {swatch && <span className={cn('h-2 w-2 rounded-sm', swatch)} />}
      <span>{label}</span>
    </label>
  );
}

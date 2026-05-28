'use client';

import { useEffect, useState } from 'react';
import { PriceChart, type Range } from '@/components/portfolio/price-chart';

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

export function ChartClient({ symbol, currency }: ChartClientProps) {
  const [range, setRange] = useState<Range>('1M');
  const [series, setSeries] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/stock/details/${encodeURIComponent(symbol)}?range=${range}&sparkline=false`,
          { cache: 'no-store' }
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
            }))
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
  }, [symbol, range]);

  return (
    <PriceChart
      series={series}
      currency={currency}
      range={range}
      onRangeChange={setRange}
      loading={loading}
    />
  );
}

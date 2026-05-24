'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useMemo } from 'react';

interface SparklineProps {
  /** Series of price points. Only `close` is read. */
  data: Array<{ close: number }> | undefined | null;
  /** If positive trend force a color; otherwise auto-derive from first vs last. */
  positive?: boolean;
  className?: string;
  height?: number;
  width?: number | string;
}

/**
 * Minimalist row-level price sparkline. Auto-colors green/red based on the
 * series' open-to-close direction unless `positive` is passed explicitly.
 * No axes, no grid, no tooltip — purely shape, like the screenshot.
 */
function Sparkline({
  data,
  positive,
  className,
  height = 40,
  width = '100%',
}: SparklineProps) {
  const { trimmed, isUp } = useMemo(() => {
    if (!data || data.length === 0) return { trimmed: [], isUp: true };
    // Downsample to ~32 points so the line stays smooth at any width.
    const target = 32;
    const step = Math.max(1, Math.floor(data.length / target));
    const pts: Array<{ close: number }> = [];
    for (let i = 0; i < data.length; i += step) pts.push(data[i]);
    if (pts[pts.length - 1] !== data[data.length - 1]) pts.push(data[data.length - 1]);
    const up = pts[pts.length - 1].close >= pts[0].close;
    return { trimmed: pts, isUp: positive ?? up };
  }, [data, positive]);

  if (trimmed.length === 0) {
    return (
      <div
        className={className}
        style={{ height, width }}
        aria-label="No sparkline data"
      />
    );
  }

  const stroke = isUp ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <div className={className} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trimmed} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          {/* Pad domain a little so the line isn't flush against edges. */}
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="close"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { Sparkline };

'use client';

import { Plus } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { getInsightsCompanyUrl } from '@/lib/url/client-origin';
import { Sparkline } from './sparkline';
import type { PortfolioHolding } from '@/types/stock';

type EnrichedHolding = PortfolioHolding & {
  livePrice: number | null;
  liveValue: number;
  livePnl: number;
  livePnlPct: number;
  previousClose: number | null;
};

interface PortfolioTableProps {
  holdings: EnrichedHolding[];
  sparklines: Record<string, Array<{ date: string; close: number }>>;
  onBuyMore: (h: EnrichedHolding) => void;
}

/**
 * Compact Groww-style table of holdings. Each row links to the symbol's
 * detail page. The plus button on the right opens the Buy More modal
 * scoped to that holding (stops propagation so the row click doesn't fire).
 *
 * Columns:
 *   Company (name + qty + avg buy)
 *   Sparkline (1D intraday)
 *   Market price (current + day change abs/% in red/green)
 *   Returns (% from buy)
 *   Current value (current value + invested)
 *
 * Mobile (<md): each row becomes a stacked card.
 */
function PortfolioTable({ holdings, sparklines, onBuyMore }: PortfolioTableProps) {
  return (
    <div 
      className="overflow-hidden rounded-2xl border border-borderSubtle bg-elevated shadow-md"
      role="table"
      aria-label="Portfolio holdings"
    >
      {/* Header — desktop only */}
      <div 
        className="hidden grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_56px] gap-4 border-b border-borderSubtle bg-canvas/60 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted md:grid"
        role="row"
      >
        <span role="columnheader">Company</span>
        <span className="text-center" role="columnheader">1D Trend</span>
        <span className="text-right" role="columnheader">Market price (1D %)</span>
        <span className="text-right" role="columnheader">Returns (%)</span>
        <span className="text-right" role="columnheader">Current (Invested)</span>
        <span className="sr-only" role="columnheader">Actions</span>
      </div>

      <ul 
        className="divide-y divide-borderSubtle"
        role="rowgroup"
      >
        {holdings.map((h) => {
          const dayChange = h.livePrice != null ? h.livePrice - (h.previousClose ?? h.livePrice) : 0;
          const dayChangePct =
            h.livePrice != null && h.previousClose
              ? (dayChange / h.previousClose) * 100
              : 0;
          const dayUp = dayChange >= 0;
          const returnsUp = h.livePnlPct >= 0;
          const invested = h.quantity * h.avg_buy_price;
          // Portfolio rows deep-link to the insights subdomain so users get
          // the full screener-style company view instead of the legacy
          // portfolio-symbol detail page.
          const detailHref = getInsightsCompanyUrl(h.symbol);

          return (
            <li
              key={h.id}
              className="group transition-colors hover:bg-elevated-hover"
              role="row"
            >
              <a
                href={detailHref}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_56px] md:items-center md:gap-4"
              >
                {/* Company */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary group-hover:text-accent-brand">
                    {h.name || h.symbol}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {h.quantity} share{h.quantity === 1 ? '' : 's'} · Avg {formatCurrency(h.avg_buy_price)}
                  </p>
                </div>

                {/* Sparkline */}
                <div className="hidden md:block">
                  <Sparkline data={sparklines[h.symbol]} positive={dayUp} height={36} />
                </div>

                {/* Market price + 1D change */}
                <div className="md:text-right">
                  <p className="font-medium text-primary">
                    {h.livePrice != null ? formatCurrency(h.livePrice) : '—'}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      dayUp ? 'text-accent-green' : 'text-accent-red'
                    )}
                  >
                    {dayUp ? '+' : ''}
                    {formatCurrency(Math.abs(dayChange))} ({formatPercent(dayChangePct)})
                  </p>
                </div>

                {/* Returns % */}
                <div className="md:text-right">
                  <p
                    className={cn(
                      'font-medium',
                      returnsUp ? 'text-accent-green' : 'text-accent-red'
                    )}
                  >
                    {returnsUp ? '+' : ''}
                    {formatCurrency(Math.abs(h.livePnl))}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      returnsUp ? 'text-accent-green' : 'text-accent-red'
                    )}
                  >
                    {formatPercent(h.livePnlPct)}
                  </p>
                </div>

                {/* Current / Invested */}
                <div className="md:text-right">
                  <p className="font-medium text-primary">{formatCurrency(h.liveValue)}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatCurrency(invested)}</p>
                </div>

                {/* Plus button — stop propagation so it doesn't navigate */}
                <div className="flex md:justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBuyMore(h);
                    }}
                    title={`Buy more ${h.symbol}`}
                    aria-label={`Buy more ${h.symbol}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/15 text-accent-green transition-colors hover:bg-accent-green/25"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { PortfolioTable };

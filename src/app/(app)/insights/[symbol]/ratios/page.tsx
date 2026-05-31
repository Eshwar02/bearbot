import Link from 'next/link';
import { getCompanyOverview } from '@/lib/insights/server';
import { RatiosGrid } from '../_components/ratios-grid';

interface RatiosTabPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function RatiosTabPage({ params }: RatiosTabPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const overview = await getCompanyOverview(symbol);

  if (!overview) {
    return (
      <div className="rounded-2xl border border-borderSubtle bg-elevated p-8 text-center">
        <p className="text-sm text-secondary">
          Ratios are not available for{' '}
          <span className="font-mono text-primary">{symbol}</span>.{' '}
          <Link href="/insights" className="text-accent-brand hover:underline">
            Try another ticker
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-primary sm:text-lg">
          Financial Ratios
        </h2>
        <p className="text-xs text-secondary sm:text-sm">
          Profitability, efficiency, liquidity and leverage indicators.
        </p>
      </div>

      <RatiosGrid
        ratios={overview.ratios}
        symbol={overview.symbol}
        currency={overview.quote.currency}
      />

      <div className="rounded-xl border border-borderSubtle bg-elevated p-6 text-center text-sm text-secondary shadow-sm">
        <p className="font-semibold text-primary">
          Efficiency Ratios (Asset Turnover, Inventory Days, Debtor Days)
        </p>
        <p className="mt-1 text-xs text-muted">
          Data source pending — derived ratios will appear here once historical
          financials feed is wired.
        </p>
      </div>
    </div>
  );
}

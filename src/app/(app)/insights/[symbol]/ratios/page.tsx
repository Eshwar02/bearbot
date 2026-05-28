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
    <RatiosGrid
      ratios={overview.ratios}
      symbol={overview.symbol}
      currency={overview.quote.currency}
    />
  );
}

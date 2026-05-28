import { getCompanyOverview } from '@/lib/insights/server';
import { ChartClient } from './_chart-client';

interface ChartTabPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function ChartTabPage({ params }: ChartTabPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const overview = await getCompanyOverview(symbol);
  const currency = overview?.quote.currency ?? 'USD';

  return (
    <div className="min-h-96">
      <ChartClient symbol={symbol} currency={currency} />
    </div>
  );
}

import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getCompanyOverview } from '@/lib/insights/server';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyHeader } from './_components/company-header';
import { TabNav } from './_components/tab-nav';

interface InsightsSymbolLayoutProps {
  children: ReactNode;
  params: Promise<{ symbol: string }>;
}

export default async function InsightsSymbolLayout({
  children,
  params,
}: InsightsSymbolLayoutProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const overview = symbol ? await getCompanyOverview(symbol) : null;

  if (!overview) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-borderSubtle bg-elevated p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-primary">
            We could not find that ticker
          </h1>
          <p className="mb-6 text-sm text-secondary">
            {symbol ? (
              <>
                No company data is available for{' '}
                <span className="font-mono text-primary">{symbol}</span>.
              </>
            ) : (
              'Try searching for a company you want to research.'
            )}
          </p>
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-brand/15 px-4 py-2 text-sm font-medium text-accent-brand transition-colors hover:bg-accent-brand/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
      <CompanyHeader overview={overview} />
      <TabNav symbol={overview.symbol} />
      <Suspense
        fallback={
          <div className="mt-6 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <div className="mt-6">{children}</div>
      </Suspense>
    </div>
  );
}

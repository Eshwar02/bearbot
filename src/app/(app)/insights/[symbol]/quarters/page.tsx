import { getCompanyFinancials, isIndianTicker } from '@/lib/insights/server';
import { StatementTable } from '../_components/statement-table';
import type {
  StatementTableMetric,
  StatementTableRow,
} from '../_components/statement-table';

interface QuartersPageProps {
  params: Promise<{ symbol: string }>;
}

const quarterlyMetrics: StatementTableMetric[] = [
  { key: 'totalRevenue', label: 'Sales', format: 'currency' },
  { key: 'costOfRevenue', label: 'Expenses', format: 'currency' },
  { key: 'operatingIncome', label: 'Operating Profit', format: 'currency' },
  { key: 'operatingMargin', label: 'OPM %', format: 'percent' },
  { key: 'otherIncome', label: 'Other Income', format: 'currency' },
  { key: 'interestExpense', label: 'Interest', format: 'currency' },
  { key: 'depreciation', label: 'Depreciation', format: 'currency' },
  { key: 'pretaxIncome', label: 'Profit before tax', format: 'currency' },
  { key: 'taxRate', label: 'Tax %', format: 'percent' },
  { key: 'netIncome', label: 'Net Profit', format: 'currency' },
  { key: 'eps', label: 'EPS in Rs', format: 'number' },
];

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6 text-center text-sm text-secondary shadow-sm">
      {message}
    </div>
  );
}

export default async function QuartersPage({ params }: QuartersPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const financials = await getCompanyFinancials(symbol);

  const incomeRows = (financials?.income.quarterly ?? []) as unknown as StatementTableRow[];

  if (!financials || incomeRows.length === 0) {
    return <EmptyCard message="No quarterly statement data available." />;
  }

  const currency = isIndianTicker(symbol) ? 'INR' : 'USD';

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary sm:text-lg">
            Quarterly Results
          </h2>
        </div>
        <StatementTable
          title="Quarterly Results"
          periods={incomeRows}
          metrics={quarterlyMetrics}
          currency={currency}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-accent-brand/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-brand opacity-70"
        >
          Product Segments
        </button>
      </div>
    </div>
  );
}

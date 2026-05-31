import { getCompanyFinancials, isIndianTicker } from '@/lib/insights/server';
import { StatementTable } from '../_components/statement-table';
import type {
  StatementTableMetric,
  StatementTableRow,
} from '../_components/statement-table';

interface BalanceSheetPageProps {
  params: Promise<{ symbol: string }>;
}

const assetMetrics: StatementTableMetric[] = [
  { key: 'fixedAssets', label: 'Fixed Assets', format: 'currency' },
  { key: 'investments', label: 'Investments', format: 'currency' },
  { key: 'inventory', label: 'Inventory', format: 'currency' },
  { key: 'receivables', label: 'Receivables', format: 'currency' },
  { key: 'cash', label: 'Cash & equivalents', format: 'currency' },
  { key: 'totalAssets', label: 'Total Assets', format: 'currency' },
];

const liabilityMetrics: StatementTableMetric[] = [
  { key: 'totalEquity', label: 'Equity Capital', format: 'currency' },
  { key: 'reserves', label: 'Reserves', format: 'currency' },
  { key: 'totalDebt', label: 'Borrowings', format: 'currency' },
  { key: 'payables', label: 'Payables', format: 'currency' },
  { key: 'totalLiabilities', label: 'Total Liabilities', format: 'currency' },
];

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6 text-center text-sm text-secondary shadow-sm">
      {message}
    </div>
  );
}

export default async function BalanceSheetPage({ params }: BalanceSheetPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const financials = await getCompanyFinancials(symbol);

  const balanceRows = (financials?.balance.annual ?? []) as unknown as StatementTableRow[];

  if (!financials || balanceRows.length === 0) {
    return (
      <EmptyCard
        message={
          isIndianTicker(symbol)
            ? 'No balance sheet data available yet for this ticker.'
            : "Balance sheet isn't available on the free tier for US tickers."
        }
      />
    );
  }

  const currency = isIndianTicker(symbol) ? 'INR' : 'USD';

  return (
    <div className="space-y-6">
      <StatementTable
        title="Assets"
        periods={balanceRows}
        metrics={assetMetrics}
        currency={currency}
      />
      <StatementTable
        title="Liabilities & Equity"
        periods={balanceRows}
        metrics={liabilityMetrics}
        currency={currency}
      />
    </div>
  );
}

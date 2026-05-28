import { getCompanyFinancials, isIndianTicker } from '@/lib/insights/server';
import { StatementTable } from '../_components/statement-table';
import type {
  StatementTableMetric,
  StatementTableRow,
} from '../_components/statement-table';

interface QuartersPageProps {
  params: Promise<{ symbol: string }>;
}

const incomeMetrics: StatementTableMetric[] = [
  { key: 'totalRevenue', label: 'Revenue', format: 'currency' },
  { key: 'grossProfit', label: 'Gross profit', format: 'currency' },
  { key: 'operatingIncome', label: 'Operating income', format: 'currency' },
  { key: 'netIncome', label: 'Net income', format: 'currency' },
  { key: 'ebitda', label: 'EBITDA', format: 'currency' },
  { key: 'eps', label: 'EPS', format: 'number' },
];

const balanceMetrics: StatementTableMetric[] = [
  { key: 'totalAssets', label: 'Total assets', format: 'currency' },
  { key: 'totalLiabilities', label: 'Total liabilities', format: 'currency' },
  { key: 'totalEquity', label: 'Equity', format: 'currency' },
  { key: 'totalDebt', label: 'Total debt', format: 'currency' },
  { key: 'cash', label: 'Cash', format: 'currency' },
];

const cashflowMetrics: StatementTableMetric[] = [
  { key: 'operatingCashflow', label: 'Operating CF', format: 'currency' },
  { key: 'investingCashflow', label: 'Investing CF', format: 'currency' },
  { key: 'financingCashflow', label: 'Financing CF', format: 'currency' },
  { key: 'capex', label: 'Capex', format: 'currency' },
  { key: 'freeCashflow', label: 'Free CF', format: 'currency' },
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
  const balanceRows = (financials?.balance.quarterly ?? []) as unknown as StatementTableRow[];
  const cashflowRows = (financials?.cashflow.quarterly ?? []) as unknown as StatementTableRow[];

  const allEmpty =
    incomeRows.length === 0 && balanceRows.length === 0 && cashflowRows.length === 0;

  if (!financials || allEmpty) {
    if (!isIndianTicker(symbol)) {
      return (
        <EmptyCard message="Statement-level data isn't available on the free tier for US tickers. See Ratios for fundamentals." />
      );
    }
    return <EmptyCard message="No quarterly statement data available." />;
  }

  // Yahoo doesn't always expose statement-level currency; default to profile-level USD,
  // but for Indian tickers it is always INR.
  const currency = isIndianTicker(symbol) ? 'INR' : 'USD';

  return (
    <div className="space-y-6">
      <StatementTable
        title="Quarterly income statement"
        periods={incomeRows}
        metrics={incomeMetrics}
        currency={currency}
      />
      <StatementTable
        title="Quarterly balance sheet"
        periods={balanceRows}
        metrics={balanceMetrics}
        currency={currency}
      />
      <StatementTable
        title="Quarterly cash flow"
        periods={cashflowRows}
        metrics={cashflowMetrics}
        currency={currency}
      />
    </div>
  );
}

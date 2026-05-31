import { getCompanyFinancials, isIndianTicker } from '@/lib/insights/server';
import { StatementTable } from '../_components/statement-table';
import type {
  StatementTableMetric,
  StatementTableRow,
} from '../_components/statement-table';

interface CashFlowPageProps {
  params: Promise<{ symbol: string }>;
}

const cashflowMetrics: StatementTableMetric[] = [
  { key: 'operatingCashflow', label: 'Cash from Operating Activity', format: 'currency' },
  { key: 'investingCashflow', label: 'Cash from Investing Activity', format: 'currency' },
  { key: 'capex', label: 'Capital Expenditure', format: 'currency' },
  { key: 'financingCashflow', label: 'Cash from Financing Activity', format: 'currency' },
  { key: 'freeCashflow', label: 'Free Cash Flow', format: 'currency' },
  { key: 'netCashflow', label: 'Net Cash Flow', format: 'currency' },
];

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6 text-center text-sm text-secondary shadow-sm">
      {message}
    </div>
  );
}

export default async function CashFlowPage({ params }: CashFlowPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const financials = await getCompanyFinancials(symbol);

  const rows = (financials?.cashflow.annual ?? []) as unknown as StatementTableRow[];

  if (!financials || rows.length === 0) {
    return (
      <EmptyCard
        message={
          isIndianTicker(symbol)
            ? 'No cash flow data available yet for this ticker.'
            : "Cash flow data isn't available on the free tier for US tickers."
        }
      />
    );
  }

  const currency = isIndianTicker(symbol) ? 'INR' : 'USD';

  return (
    <div className="space-y-6">
      <StatementTable
        title="Cash Flow Statement"
        periods={rows}
        metrics={cashflowMetrics}
        currency={currency}
      />
    </div>
  );
}

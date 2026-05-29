import { getCompanyFinancials, isIndianTicker } from '@/lib/insights/server';
import { StatementTable } from '../_components/statement-table';
import type {
  StatementTableMetric,
  StatementTableRow,
} from '../_components/statement-table';

interface ProfitLossPageProps {
  params: Promise<{ symbol: string }>;
}

const incomeMetrics: StatementTableMetric[] = [
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

function CompoundedRow({
  label,
  values,
}: {
  label: string;
  values: Array<{ horizon: string; value: string }>;
}) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-canvas p-3">
      <p className="mb-2 text-sm font-semibold text-primary">{label}</p>
      <dl className="space-y-1 text-xs">
        {values.map((v) => (
          <div key={v.horizon} className="flex items-center justify-between">
            <dt className="text-muted">{v.horizon}</dt>
            <dd className="tabular-nums text-primary">{v.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function ProfitLossPage({ params }: ProfitLossPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const financials = await getCompanyFinancials(symbol);

  const incomeRows = (financials?.income.annual ?? []) as unknown as StatementTableRow[];

  if (!financials || incomeRows.length === 0) {
    return (
      <EmptyCard
        message={
          isIndianTicker(symbol)
            ? 'No annual income statement available for this ticker yet.'
            : "Statement-level data isn't available on the free tier for US tickers. See Ratios for fundamentals."
        }
      />
    );
  }

  const currency = isIndianTicker(symbol) ? 'INR' : 'USD';
  const placeholder = '—';

  return (
    <div className="space-y-6">
      <StatementTable
        title="Profit & Loss"
        periods={incomeRows}
        metrics={incomeMetrics}
        currency={currency}
      />

      <section className="rounded-xl border border-borderSubtle bg-elevated p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-primary">
          Long-term growth (placeholder)
        </h3>
        <p className="mb-4 text-xs text-muted">
          Compounded growth metrics will populate once historical-series math is
          wired to the Yahoo annual feed.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CompoundedRow
            label="Compounded Sales Growth"
            values={[
              { horizon: '10 Years', value: placeholder },
              { horizon: '5 Years', value: placeholder },
              { horizon: '3 Years', value: placeholder },
              { horizon: 'TTM', value: placeholder },
            ]}
          />
          <CompoundedRow
            label="Compounded Profit Growth"
            values={[
              { horizon: '10 Years', value: placeholder },
              { horizon: '5 Years', value: placeholder },
              { horizon: '3 Years', value: placeholder },
              { horizon: 'TTM', value: placeholder },
            ]}
          />
          <CompoundedRow
            label="Stock Price CAGR"
            values={[
              { horizon: '10 Years', value: placeholder },
              { horizon: '5 Years', value: placeholder },
              { horizon: '3 Years', value: placeholder },
              { horizon: '1 Year', value: placeholder },
            ]}
          />
          <CompoundedRow
            label="Return on Equity"
            values={[
              { horizon: '10 Years', value: placeholder },
              { horizon: '5 Years', value: placeholder },
              { horizon: '3 Years', value: placeholder },
              { horizon: 'Last Year', value: placeholder },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

import type { KeyRatios } from '@/lib/stock/fundamentals';

interface RatiosGridProps {
  ratios: KeyRatios;
  symbol: string;
  currency: string;
}

function isIndianSymbol(symbol: string): boolean {
  return /\.(NS|BO)$/i.test(symbol);
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '';
  }
}

function fmtLarge(value: number | null, currency: string, indian: boolean): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const sym = currencySymbol(currency);
  if (indian) {
    if (abs >= 1e7) return `${sign}${sym}${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(2)} L`;
    return `${sign}${sym}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${sym}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtMoney(value: number | null, currency: string): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sym = currencySymbol(currency);
  return `${sym}${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtRatio(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

// Yahoo returns margins/growth/yield as decimal fractions (e.g. 0.18 = 18%).
function fmtPercent(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

// debt/equity from Yahoo is reported as a percent-ish ratio (e.g. 48.2 means
// 48.2%). We render as ratio (0.48) for readability.
function fmtDebtToEquity(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return (value / 100).toFixed(2);
}

interface Card {
  label: string;
  value: string;
  hint?: string;
}

interface Section {
  title: string;
  cards: Card[];
}

export function RatiosGrid({ ratios, symbol, currency }: RatiosGridProps) {
  const indian = isIndianSymbol(symbol);

  const sections: Section[] = [
    {
      title: 'Valuation',
      cards: [
        { label: 'P/E (trailing)', value: fmtRatio(ratios.trailingPE) },
        { label: 'P/E (forward)', value: fmtRatio(ratios.forwardPE) },
        { label: 'Price / Book', value: fmtRatio(ratios.priceToBook) },
        { label: 'Price / Sales', value: fmtRatio(ratios.priceToSales) },
        { label: 'PEG', value: fmtRatio(ratios.pegRatio) },
        {
          label: 'EV / EBITDA',
          value: fmtRatio(ratios.enterpriseToEbitda),
        },
        {
          label: 'EV / Revenue',
          value: fmtRatio(ratios.enterpriseToRevenue),
        },
        {
          label: 'Enterprise value',
          value: fmtLarge(ratios.enterpriseValue, currency, indian),
        },
      ],
    },
    {
      title: 'Profitability',
      cards: [
        { label: 'Gross margin', value: fmtPercent(ratios.grossMargin) },
        { label: 'Operating margin', value: fmtPercent(ratios.operatingMargin) },
        { label: 'Profit margin', value: fmtPercent(ratios.profitMargin) },
        { label: 'Return on assets', value: fmtPercent(ratios.returnOnAssets) },
        { label: 'Return on equity', value: fmtPercent(ratios.returnOnEquity) },
      ],
    },
    {
      title: 'Financial health',
      cards: [
        { label: 'Debt / Equity', value: fmtDebtToEquity(ratios.debtToEquity) },
        { label: 'Current ratio', value: fmtRatio(ratios.currentRatio) },
        { label: 'Quick ratio', value: fmtRatio(ratios.quickRatio) },
      ],
    },
    {
      title: 'Growth',
      cards: [
        { label: 'Revenue growth (YoY)', value: fmtPercent(ratios.revenueGrowth) },
        { label: 'Earnings growth (YoY)', value: fmtPercent(ratios.earningsGrowth) },
      ],
    },
    {
      title: 'Returns & risk',
      cards: [
        { label: 'Dividend yield', value: fmtPercent(ratios.dividendYield) },
        { label: 'Payout ratio', value: fmtPercent(ratios.payoutRatio) },
        { label: 'Beta', value: fmtRatio(ratios.beta) },
        {
          label: '52w high',
          value: fmtMoney(ratios.fiftyTwoWeekHigh, currency),
        },
        {
          label: '52w low',
          value: fmtMoney(ratios.fiftyTwoWeekLow, currency),
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {section.title}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {section.cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-borderSubtle bg-elevated p-4 shadow-sm"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-1.5 text-xl font-semibold tabular-nums text-primary">
                  {card.value}
                </p>
                {card.hint && (
                  <p className="mt-0.5 text-xs text-secondary">{card.hint}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

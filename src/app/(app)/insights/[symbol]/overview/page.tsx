import { Building2, Layers, PieChart } from 'lucide-react';
import { getCompanyOverview } from '@/lib/insights/server';

interface OverviewPageProps {
  params: Promise<{ symbol: string }>;
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6 text-center text-sm text-secondary shadow-sm">
      {message}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-borderSubtle/60 py-2 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-right text-sm font-semibold tabular-nums text-primary">
        {value}
      </span>
    </div>
  );
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  const overview = await getCompanyOverview(symbol);

  if (!overview) {
    return <EmptyCard message="Overview not available for this ticker." />;
  }

  const { profile } = overview;
  const employees =
    profile.employees != null
      ? profile.employees.toLocaleString('en-IN')
      : '—';

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent-brand" />
          <h3 className="text-sm font-semibold text-primary sm:text-base">
            Business Overview
          </h3>
        </header>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <StatRow label="Sector" value={profile.sector || '—'} />
          <StatRow label="Industry" value={profile.industry || '—'} />
          <StatRow label="Headquarters" value={profile.country || '—'} />
          <StatRow label="Exchange" value={profile.exchange || '—'} />
          <StatRow label="Employees" value={employees} />
          <StatRow label="Currency" value={profile.currency || '—'} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-secondary">
          {profile.summary || 'Detailed business description not available.'}
        </p>
      </section>

      <section className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <header className="mb-2 flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent-brand" />
          <h3 className="text-sm font-semibold text-primary sm:text-base">
            Business Segments
          </h3>
        </header>
        <p className="text-xs text-muted">
          Segment-level revenue, profit and growth will appear here once
          segment-disclosure data is connected.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-borderSubtle bg-canvas p-4">
          <div className="flex flex-wrap gap-2">
            {['Segment A', 'Segment B', 'Segment C', 'Segment D', 'Segment E'].map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full border border-borderSubtle bg-elevated px-3 py-1 text-xs text-muted"
                >
                  {s} · —% revenue
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <header className="mb-2 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-accent-brand" />
          <h3 className="text-sm font-semibold text-primary sm:text-base">
            Revenue Breakdown
          </h3>
        </header>
        <p className="text-xs text-muted">
          Revenue mix by segment, geography and product line.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-borderSubtle bg-canvas p-6 text-center text-xs text-muted">
          Donut and stacked-bar visualizations will load here when segment feed
          is wired.
        </div>
      </section>
    </div>
  );
}

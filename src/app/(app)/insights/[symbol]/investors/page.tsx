interface InvestorsPageProps {
  params: Promise<{ symbol: string }>;
}

const shareholdingBuckets = [
  { label: 'Promoters', value: '—', color: 'bg-accent-brand/70' },
  { label: 'FIIs', value: '—', color: 'bg-accent-blue/70' },
  { label: 'DIIs', value: '—', color: 'bg-accent-green/70' },
  { label: 'Public', value: '—', color: 'bg-accent-amber/70' },
  { label: 'Government', value: '—', color: 'bg-accent-red/70' },
  { label: 'Others', value: '—', color: 'bg-secondary/60' },
];

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-primary sm:text-base">{title}</h3>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-4 rounded-lg border border-dashed border-borderSubtle bg-canvas p-4 text-center text-xs text-muted">
        Data source pending — wire up once filings API is selected.
      </div>
    </section>
  );
}

export default async function InvestorsPage({ params }: InvestorsPageProps) {
  await params;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-primary sm:text-base">
          Shareholding Pattern
        </h3>
        <p className="mt-1 text-xs text-muted">
          Latest quarter snapshot. Historical trend will plot here once data is connected.
        </p>
        <div className="mt-4 space-y-2">
          {shareholdingBuckets.map((b) => (
            <div key={b.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">{b.label}</span>
                <span className="tabular-nums text-muted">{b.value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                <div className={`h-full w-0 ${b.color}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <PlaceholderCard
        title="Institutional Holdings"
        description="Mutual funds, FIIs, DIIs, insurance and pension fund positions with quarter-over-quarter change."
      />

      <PlaceholderCard
        title="Top Shareholders"
        description="Name, holding %, shares held, change vs last quarter."
      />
    </div>
  );
}

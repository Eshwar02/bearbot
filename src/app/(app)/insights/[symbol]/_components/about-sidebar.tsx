import type { CompanyOverview } from '@/lib/insights/server';

interface AboutSidebarProps {
  overview: CompanyOverview;
}

export function AboutSidebar({ overview }: AboutSidebarProps) {
  const { profile } = overview;
  const summary = profile.summary || '';
  const truncated =
    summary.length > 380 ? `${summary.slice(0, 380).trim()}…` : summary;

  const keyPoints: Array<{ heading: string; body: string }> = [];
  if (profile.sector) {
    keyPoints.push({
      heading: 'Sector',
      body: profile.sector,
    });
  }
  if (profile.industry && profile.industry !== profile.sector) {
    keyPoints.push({
      heading: 'Industry',
      body: profile.industry,
    });
  }
  if (profile.country) {
    keyPoints.push({
      heading: 'Headquarters',
      body: profile.country,
    });
  }
  if (profile.employees != null) {
    keyPoints.push({
      heading: 'Employees',
      body: profile.employees.toLocaleString('en-IN'),
    });
  }

  return (
    <aside className="space-y-5">
      <section className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          About
        </h3>
        {truncated ? (
          <p className="mt-2 text-sm leading-relaxed text-secondary">{truncated}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Business description not available yet for this ticker.
          </p>
        )}
        {summary.length > 380 && (
          <button
            type="button"
            disabled
            className="mt-3 cursor-not-allowed text-xs font-semibold uppercase tracking-wide text-accent-brand/70"
          >
            Read more
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Key Points
        </h3>
        {keyPoints.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Business segments and revenue mix will appear here once company-segment
            data is connected.
          </p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {keyPoints.map((p) => (
              <li key={p.heading}>
                <p className="font-semibold text-primary">{p.heading}</p>
                <p className="mt-0.5 text-secondary">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

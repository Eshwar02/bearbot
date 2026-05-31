import { Suspense } from 'react';
import { InsightsLanding } from './_components/insights-landing';

export const dynamic = 'force-static';

export default function InsightsRootPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-sm text-muted">Loading…</div>}>
      <InsightsLanding />
    </Suspense>
  );
}

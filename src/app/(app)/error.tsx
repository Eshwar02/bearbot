'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('App route error boundary triggered', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-borderSubtle bg-elevated/60 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-primary">
          Something went wrong loading this view
        </h2>
        <p className="mb-4 text-sm text-muted">
          You can keep your conversation — just try again. If it keeps happening,
          refreshing usually fixes it.
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-accent-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-borderStrong px-4 py-2 text-sm text-primary hover:bg-borderSubtle"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="max-w-md rounded-2xl border border-dark-700 bg-dark-800/60 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-100">
          Something went wrong loading this view
        </h2>
        <p className="mb-4 text-sm text-dark-400">
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
            className="rounded-lg border border-dark-600 px-4 py-2 text-sm text-gray-200 hover:bg-dark-700"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightsSymbolErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InsightsSymbolError({ error, reset }: InsightsSymbolErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[insights/symbol] tab error', error);
    }
  }, [error]);

  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6 shadow-sm">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-red/10 text-accent-red">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-primary sm:text-base">
              Something went wrong loading this tab
            </h3>
            <p className="mt-1 text-sm text-secondary">
              The data source may be temporarily unavailable. You can retry without leaving the page.
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={reset}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}

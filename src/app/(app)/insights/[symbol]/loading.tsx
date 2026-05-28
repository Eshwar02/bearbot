import { Skeleton } from '@/components/ui/skeleton';

export default function InsightsSymbolTabLoading() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <section
          key={i}
          className="rounded-xl border border-borderSubtle bg-elevated shadow-sm"
        >
          <div className="border-b border-borderSubtle px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <div className="min-h-64 space-y-3 p-4 sm:p-5">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-20 sm:block" />
                <Skeleton className="hidden h-4 w-20 sm:block" />
                <Skeleton className="hidden h-4 w-20 sm:block" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="flex h-screen w-full">
      <div className="w-64 border-r border-borderSubtle p-3 space-y-2">
        <Skeleton variant="line" className="h-10" />
        <Skeleton variant="line" className="h-8" />
        <Skeleton variant="line" className="h-8" />
        <Skeleton variant="line" className="h-8" />
        <Skeleton variant="line" className="h-8" />
      </div>
      <div className="flex-1 flex flex-col p-6 space-y-4">
        <Skeleton variant="card" className="h-12 w-1/3" />
        <Skeleton variant="card" className="flex-1" />
      </div>
    </div>
  );
}

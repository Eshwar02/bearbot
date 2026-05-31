import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <Skeleton variant="card" className="h-12 w-1/3" />
      <Skeleton variant="card" className="flex-1" />
    </div>
  );
}

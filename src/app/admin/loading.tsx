import { Skeleton } from '@/components/ui/skeleton';

/** Paints while an admin page fetches. Content only, so it fits the KfcShell main and the old layout alike. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    </div>
  );
}

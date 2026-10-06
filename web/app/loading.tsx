import { Skeleton } from '@/components/ui/card';
export default function Loading(): JSX.Element {
  return (
    <div role="status" aria-label="Loading page" className="container-shell section">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-8 h-14 w-3/4" />
      <Skeleton className="mt-8 h-56 w-full" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div role="alert" className="container-shell section">
      <h1 className="text-3xl font-bold">Something didn’t load.</h1>
      <p className="my-6 text-slate-600">
        Please try again. Your account information is not shown in this error.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

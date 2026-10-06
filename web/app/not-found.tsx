import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound(): JSX.Element {
  return (
    <div className="container-shell section text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl font-bold">This page has moved on.</h1>
      <p className="my-6 text-slate-600">Let’s get you back to a clearer path.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}

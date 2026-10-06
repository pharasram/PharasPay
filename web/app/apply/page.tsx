import type { Metadata } from 'next';
import { ApplicationForm } from '@/components/application-form';
import { isDemo } from '@/lib/config';
export const metadata: Metadata = {
  title: 'Apply for a loan',
  robots: { index: false, follow: false },
};
export default function ApplyPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <div className="mb-10">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Let’s take the first step.</h1>
        <p className="mt-4 text-slate-600">Six simple steps. Your progress, always visible.</p>
      </div>
      <ApplicationForm demo={isDemo()} />
    </div>
  );
}

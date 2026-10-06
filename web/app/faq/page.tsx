import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { FaqAccordion } from '@/components/ui/accordion';
export const metadata: Metadata = { title: 'Frequently asked questions' };
export default function FaqPage(): JSX.Element {
  return (
    <div className="container-shell section max-w-4xl">
      <PageHeading
        eyebrow="HERE TO HELP"
        title="Good questions. Clear answers."
        description="The essentials on costs, eligibility, privacy, and repayment."
      />
      <div className="mt-10">
        <FaqAccordion />
      </div>
    </div>
  );
}

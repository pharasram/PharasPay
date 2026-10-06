import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { Card } from '@/components/ui/card';
export const metadata: Metadata = { title: 'About us' };
export default function AboutPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <PageHeading
        eyebrow="OUR PURPOSE"
        title="Clarity is a good place to start."
        description="We’re building a digital lending experience where understandable terms and responsible choices come first."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          [
            'Transparent by default',
            'Annual rates of 8%–12%, processing fees of 1%–2% + GST, and a clear explanation of your offer.',
          ],
          [
            'Designed for real life',
            'A mobile-first journey that helps you apply, understand your repayments, and ask for support.',
          ],
          [
            'Responsible at every step',
            'Consent-led verification, explainable decisions, and a production architecture designed for India-region data handling.',
          ],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{body}</p>
          </Card>
        ))}
      </div>
      <div className="prose-copy mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-900">A platform in development</h2>
        <p>
          This site is a working product demo. The regulated lending partner, operating entity,
          contact details, and independent certifications will be published after verification. We
          do not claim RBI endorsement or ISO certification.
        </p>
        <p>
          Before launch, the lender must approve the final product, Key Facts Statement, privacy
          notices, grievance process, and security controls.
        </p>
      </div>
    </div>
  );
}

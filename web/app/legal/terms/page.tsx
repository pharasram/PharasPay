import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
export const metadata: Metadata = { title: 'Terms of use' };
export default function TermsPage(): JSX.Element {
  return (
    <article className="container-shell section max-w-3xl">
      <PageHeading
        eyebrow="LEGAL"
        title="Terms of use"
        description="Development draft · must be approved by the operating entity and regulated lender before public launch."
      />
      <div className="prose-copy mt-10">
        <h2 className="text-xl font-bold text-slate-900">Using this experience</h2>
        <p>
          The demo provides illustrative calculations and simulated applications. It cannot approve,
          disburse, or service a real loan. Do not enter real personal, bank, or identity
          information in demo mode.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Loan terms</h2>
        <p>
          Product limits are ₹10,000–₹10,00,000, 6–60 months, 8%–12% annual interest, and 1%–2%
          processing fees plus GST. Approval is subject to assessment. A personalised Key Facts
          Statement must disclose APR, charges, cooling-off terms, prepayment terms, and the
          regulated lender before agreement.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Your account</h2>
        <p>
          Keep authentication information private. Do not share OTPs. Use accurate information
          during a live application and report unauthorised activity through verified support
          channels.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Before launch</h2>
        <p>
          The operating entity, jurisdiction, dispute process, liability terms, and lender-specific
          conditions remain pending legal review. This draft is not a substitute for the signed loan
          agreement.
        </p>
      </div>
    </article>
  );
}

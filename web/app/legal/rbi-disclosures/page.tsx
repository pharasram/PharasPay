import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { Card } from '@/components/ui/card';
export const metadata: Metadata = { title: 'Lender and RBI disclosures' };
export default function DisclosuresPage(): JSX.Element {
  return (
    <article className="container-shell section max-w-4xl">
      <PageHeading
        eyebrow="RESPONSIBLE LENDING"
        title="The details you deserve to know."
        description="PharasPay is in development. Regulated lender and operating details are pending verification. No RBI endorsement or independent certification is claimed."
      />
      <Card className="mt-10">
        <h2 className="text-xl font-bold">Product terms</h2>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {[
            ['Loan amount', '₹10,000–₹10,00,000'],
            ['Tenure', '6–60 months'],
            ['Annual interest rate', '8%–12% reducing balance'],
            ['Processing fee', '1%–2% of principal + GST'],
            ['APR', 'Personalised in the Key Facts Statement'],
            ['Decision explanation', 'Backend SHAP reason codes required'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="mt-1 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="prose-copy mt-10">
        <h2 className="text-xl font-bold text-slate-900">Identity and grievance contacts</h2>
        <p>
          Regulated lender: pending verification. Operating entity and LSP role: pending
          verification. Nodal grievance officer and contact details: pending appointment. These
          details must be prominently published before launch.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Before accepting</h2>
        <p>
          Review the Key Facts Statement, APR, all charges, signed agreement, cooling-off period,
          and payment instructions. A loan decision must include understandable reasons. Real
          disbursal and repayment must follow the regulated lender’s authorised process.
        </p>
        <p>
          For the regulatory source, see the{' '}
          <a
            className="text-primary underline"
            href="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12848&Mode=0"
          >
            RBI Digital Lending Directions, 2025
          </a>
          . For escalation, see{' '}
          <a className="text-primary underline" href="https://cms.rbi.org.in/">
            RBI CMS
          </a>{' '}
          and the{' '}
          <a className="text-primary underline" href="https://sachet.rbi.org.in/">
            Sachet portal
          </a>
          . Applicable escalation criteria and the lender’s grievance process must be explained in
          the final policy.
        </p>
      </div>
    </article>
  );
}

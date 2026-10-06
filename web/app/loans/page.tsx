import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProductCards } from '@/components/product-cards';
import { Card } from '@/components/ui/card';
export const metadata: Metadata = { title: 'Loan products' };
export default function LoansPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <PageHeading
        eyebrow="BORROW WITH CLARITY"
        title="Find the right fit for your plans."
        description="Simple choices. Transparent terms. Explore borrowing that fits your next step."
      />
      <div className="mt-12">
        <ProductCards />
      </div>
      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">Compare at a glance</h2>
        <div className="overflow-x-auto rounded-card border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Loan product comparison</caption>
            <thead className="bg-slate-50">
              <tr>
                {['Feature', 'Personal loan', 'Business loan', 'Credit line'].map((label) => (
                  <th scope="col" className="p-4" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Amount', '₹10,000–₹10,00,000', '₹10,000–₹10,00,000', 'To be announced'],
                ['Interest', '8%–12% p.a.', '8%–12% p.a.', 'To be announced'],
                ['Tenure', '6–60 months', '6–60 months', 'To be announced'],
                ['Processing fee', '1%–2% + GST', '1%–2% + GST', 'To be announced'],
                ['Availability', 'Subject to assessment', 'Subject to assessment', 'Coming soon'],
              ].map((row) => (
                <tr key={row[0]} className="border-t">
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th className="p-4 font-medium" scope="row" key={cell}>
                        {cell}
                      </th>
                    ) : (
                      <td className="p-4 text-slate-600" key={`${index}-${cell}`}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Eligibility essentials</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">
            <li>Adult applicants residing in India.</li>
            <li>Verifiable income and a suitable repayment capacity.</li>
            <li>Valid identity and bank account verification.</li>
            <li>
              Final eligibility is determined by the regulated lender. No guaranteed approvals.
            </li>
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Documents to keep ready</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">
            <li>PAN and authorised identity verification.</li>
            <li>Address verification as required by the lender.</li>
            <li>Income evidence and bank statements.</li>
            <li>Business documents for self-employed applicants.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

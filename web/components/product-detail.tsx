import Link from 'next/link';
import { Check, ArrowUpRight } from 'lucide-react';
import { PageHeading } from './page-heading';
import { EmiCalculator } from './emi-calculator';
import { Button } from './ui/button';
export function ProductDetail({ business = false }: { business?: boolean }): JSX.Element {
  return (
    <div className="container-shell section">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <PageHeading
            eyebrow={business ? 'BUSINESS LOANS' : 'PERSONAL LOANS'}
            title={business ? 'Back your next big idea.' : 'For the things that matter to you.'}
            description={
              business
                ? 'Predictable repayments for working capital, equipment, and the next chapter of your business.'
                : 'Education, a home improvement, or an unexpected expense. Plan it with clear terms.'
            }
          />
          <dl className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <dt className="text-sm text-slate-500">Amount</dt>
              <dd className="mt-1 text-xl font-bold">₹10K–₹10L</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Annual interest</dt>
              <dd className="mt-1 text-xl font-bold text-primary">8%–12%</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Tenure</dt>
              <dd className="mt-1 text-xl font-bold">6–60 months</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Processing fee</dt>
              <dd className="mt-1 text-xl font-bold">1%–2% + GST</dd>
            </div>
          </dl>
          <Button asChild className="mt-8">
            <Link href="/apply">
              Start application <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
        <EmiCalculator compact />
      </div>
      <section className="mt-16 rounded-card bg-slate-50 p-8">
        <h2 className="text-2xl font-bold">Know before you borrow</h2>
        <ul className="mt-6 grid gap-5 text-sm leading-7 text-slate-600 md:grid-cols-2">
          {[
            'Review the lender identity and Key Facts Statement.',
            'Choose an EMI that leaves room in your budget.',
            'Fees, GST, APR and all terms are disclosed before acceptance.',
            'Approval is subject to verification and affordability checks.',
          ].map((text) => (
            <li key={text} className="flex gap-3">
              <Check size={18} className="mt-1 shrink-0 text-emerald-700" />
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

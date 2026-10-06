import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';
import { ContactForm } from '@/components/contact-form';
import { Card } from '@/components/ui/card';
export const metadata: Metadata = { title: 'Contact and support' };
export default function ContactPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <PageHeading
            eyebrow="WE’RE HERE TO HELP"
            title="Let’s clear the way forward."
            description="Questions about applying, repayments, or your information? Start here."
          />
          <Card className="mt-8 bg-slate-50 shadow-none">
            <h2 className="text-lg font-bold">Support & grievances</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Verified support hours, telephone, email, and the nodal grievance officer will be
              published before launch. This demo form does not send messages.
            </p>
            <Link
              href="/legal/rbi-disclosures"
              className="mt-4 inline-block text-sm font-semibold text-primary"
            >
              View lender and grievance disclosures →
            </Link>
          </Card>
          <p className="mt-6 text-sm text-slate-600">
            For common questions, visit our{' '}
            <Link href="/faq" className="text-primary underline">
              FAQ
            </Link>
            .
          </p>
        </div>
        <Card className="p-7 sm:p-9">
          <h2 className="mb-6 text-xl font-bold">Send a request</h2>
          <ContactForm />
        </Card>
      </div>
    </div>
  );
}

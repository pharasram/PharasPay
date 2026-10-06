import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
export const metadata: Metadata = { title: 'Privacy notice' };
export default function PrivacyPage(): JSX.Element {
  return (
    <article className="container-shell section max-w-3xl">
      <PageHeading
        eyebrow="YOUR INFORMATION"
        title="Privacy, with clarity."
        description="Development draft · final purposes, processors, retention periods and contact details require approval before launch."
      />
      <div className="prose-copy mt-10">
        <h2 className="text-xl font-bold text-slate-900">What the demo does</h2>
        <p>
          The local experience uses fictional data. It stores a session cookie and a non-personal
          application progress cookie. Demo drafts do not retain identity or bank fields. There is
          no real KYC, credit assessment, or payment.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Live applications</h2>
        <p>
          Identity, contact, income, and bank information are used only for disclosed verification,
          eligibility, servicing, and legal purposes. Consent must be recorded at each stage. You
          must be able to request correction, withdraw optional consent, and request deletion
          subject to applicable retention requirements.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Where data belongs</h2>
        <p>
          Production personal information must remain in AWS Mumbai or Hyderabad, encrypted at rest
          using KMS and in transit with TLS 1.2 or later. The backend must implement access
          controls, retention schedules, incident response, and immutable audit records. The browser
          does not persist application PII.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Optional analytics</h2>
        <p>
          GA4 and Meta Pixel are disabled by default. They may be enabled only after data residency
          and consent review. Account and application pages are excluded. You can decline analytics
          or withdraw consent from public pages.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Questions and rights</h2>
        <p>
          Use the privacy category on the contact page during development. A verified Data
          Protection contact, grievance officer, processor list, purpose-specific retention periods
          and rights process must be published before collecting real information.
        </p>
      </div>
    </article>
  );
}

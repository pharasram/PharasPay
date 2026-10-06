import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export function SiteFooter(): JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-heading text-2xl font-bold">
            Pharas<span className="text-primary">Pay</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
            A clearer way forward.
            <br />
            Responsible lending, built around you.
          </p>
          <p className="mt-5 text-xs text-slate-500">
            ₹10,000–₹10,00,000 · 6–60 months
            <br />
            8%–12% p.a. · 1%–2% processing fee + GST
          </p>
        </div>
        {[
          {
            title: 'Explore',
            links: [
              ['Loan products', '/loans'],
              ['EMI calculator', '/calculator'],
              ['Apply now', '/apply'],
              ['Dashboard', '/dashboard'],
            ],
          },
          {
            title: 'Company',
            links: [
              ['About us', '/about'],
              ['Contact', '/contact'],
              ['FAQs', '/faq'],
              ['Journal', '/blog'],
            ],
          },
          {
            title: 'Legal & safety',
            links: [
              ['Terms', '/legal/terms'],
              ['Privacy', '/legal/privacy'],
              ['RBI disclosures', '/legal/rbi-disclosures'],
            ],
          },
        ].map((group) => (
          <div key={group.title}>
            <h2 className="mb-4 text-sm font-semibold">{group.title}</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link className="hover:text-primary" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-shell border-t border-slate-200 py-6 text-xs leading-6 text-slate-600">
        <div className="flex flex-wrap justify-between gap-4">
          <p>© {new Date().getFullYear()} PharasPay. All rights reserved.</p>
          <a href="https://cms.rbi.org.in/" className="inline-flex items-center gap-1 text-primary">
            RBI complaint management <ArrowUpRight size={12} />
          </a>
        </div>
        <p className="mt-3">
          Loans are subject to eligibility and lender approval. PharasPay’s lender identity,
          grievance officer, certifications, and final policies must be verified before public
          launch. No RBI endorsement is implied. Review your Key Facts Statement before accepting an
          offer.
        </p>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  Zap,
  BadgeIndianRupee,
  Smartphone,
  LockKeyhole,
  Quote,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmiCalculator } from '@/components/emi-calculator';
import { ProductCards } from '@/components/product-cards';
import { FaqAccordion } from '@/components/ui/accordion';
import { Reveal } from '@/components/reveal';
export default function HomePage(): JSX.Element {
  return (
    <>
      <section className="relative overflow-hidden bg-[#f7faff]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-48 top-8 size-[660px] rounded-full border-[80px] border-blue-100/50"
        />
        <div className="container-shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-24">
          <div>
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700">
              <Sparkles size={14} /> A clearer way forward
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.14] tracking-[-0.04em] sm:text-5xl lg:text-[58px]">
              Personal Loans at <span className="text-primary">8%–12% p.a.</span>
              <span className="mt-4 block text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Transparent. Fast. Digital.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
              Big plans shouldn’t come with small print. Find a loan that fits your life, with clear
              costs and a simple digital journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="px-7">
                <Link href="/apply">
                  Check my eligibility <ArrowUpRight size={18} />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/loans">Explore loans</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
              {['No hidden fees', 'No branch visits', 'Clear loan decisions'].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check className="text-emerald-700" size={14} />
                  {text}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500">
              ₹10,000–₹10,00,000 · Processing fee 1%–2% + GST
              <br />
              Approval subject to eligibility and verification.
            </p>
          </div>
          <Reveal>
            <EmiCalculator compact />
          </Reveal>
        </div>
      </section>
      <div className="border-y border-slate-100">
        <div className="container-shell grid gap-6 py-6 sm:grid-cols-3">
          {[
            {
              Icon: ShieldCheck,
              label: 'Responsible lending',
              detail: 'RBI-aligned disclosures · status pending verification',
            },
            {
              Icon: LockKeyhole,
              label: 'Privacy by design',
              detail: 'KMS encryption required for production data',
            },
            {
              Icon: Check,
              label: 'Security standards',
              detail: 'ISO 27001 certification not yet verified',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.Icon className="shrink-0 text-primary" size={22} />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-[11px] text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <section className="section container-shell">
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">WHY PHARASPAY</p>
          <h2 className="heading mt-4">
            Less uncertainty.
            <br />
            More possibility.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Borrowing should feel straightforward. We put the information you need right where you
            need it.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: BadgeIndianRupee,
              title: 'Rates that make sense',
              body: '8%–12% p.a., with a personalised offer you can understand.',
            },
            {
              Icon: Zap,
              title: 'A faster first step',
              body: 'Apply online, track your progress, and know what comes next.',
            },
            {
              Icon: ShieldCheck,
              title: 'Nothing hidden',
              body: 'A clear fee breakdown and APR before you make a commitment.',
            },
            {
              Icon: Smartphone,
              title: 'Digital, start to finish',
              body: 'From your application to repayments, all in one place.',
            },
          ].map((item) => (
            <Card key={item.title} className="shadow-none">
              <item.Icon size={25} className="mb-7 text-primary" />
              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="section bg-slate-50">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2 className="heading mt-4">Four steps. One fresh start.</h2>
          </div>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Make it yours', 'Choose your loan amount and a comfortable tenure.'],
              ['Tell us about you', 'Complete your application and authorised KYC.'],
              ['Review with confidence', 'See your offer, APR, fees, and decision reasons.'],
              ['Take the next step', 'Accept your agreement and track your loan digitally.'],
            ].map(([title, body], index) => (
              <li key={title} className="relative">
                <span className="mb-5 grid size-11 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-white">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section container-shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">A LOAN FOR YOUR NEXT</p>
            <h2 className="heading mt-4">Different plans. The same clarity.</h2>
          </div>
          <Link
            href="/loans"
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all products <ArrowRight size={16} />
          </Link>
        </div>
        <ProductCards />
      </section>
      <section className="section bg-[#f7faff]">
        <div className="container-shell">
          <div className="mb-10 text-center">
            <p className="eyebrow">THE EXPERIENCE WE’RE BUILDING</p>
            <h2 className="heading mt-4">A little peace of mind matters.</h2>
            <p className="mt-4 text-sm text-slate-500">
              Illustrative testimonials · examples of the intended experience, not customer reviews.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [
                '“I could see the full cost before deciding. That made the choice feel easier.”',
                'A first-time borrower',
                'Clear costs',
              ],
              [
                '“The monthly breakdown helped me find a repayment plan that worked for my budget.”',
                'A careful planner',
                'Simple planning',
              ],
              [
                '“Knowing where my application stood took away the guesswork.”',
                'A digital customer',
                'Visible progress',
              ],
            ].map(([quote, name, tag]) => (
              <Card key={name}>
                <Quote size={22} className="mb-6 text-primary" />
                <blockquote className="min-h-28 text-base leading-7">{quote}</blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-sm font-bold text-primary">
                    {name.charAt(2)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="mt-1 text-xs text-slate-500">{tag} · Illustrative</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="section container-shell grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</p>
          <h2 className="heading mt-4">Let’s clear things up.</h2>
          <p className="mt-5 leading-7 text-slate-600">
            Understand the essentials before you apply.
          </p>
          <Button variant="outline" asChild className="mt-6">
            <Link href="/faq">
              All frequently asked questions <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
        <FaqAccordion limit={5} />
      </section>
      <section className="container-shell pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-7 py-12 text-white sm:px-12">
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">
                YOUR NEXT CHAPTER STARTS HERE
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Make room for what’s next.</h2>
              <p className="mt-4 text-sm text-white">
                A transparent loan. A plan that works for you.
              </p>
            </div>
            <Button variant="outline" asChild className="border-white">
              <Link href="/apply">
                Start my application <ArrowUpRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

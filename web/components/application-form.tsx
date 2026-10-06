'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn, useSession } from 'next-auth/react';
import { Check, ArrowLeft, ArrowRight, Save, ShieldCheck } from 'lucide-react';
import { applicationSchema, stepFields, type Application } from '@/lib/schemas';
import { api } from '@/lib/api';
import { calculateLoan } from '@/lib/loan';
import { currency } from '@/lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
const titles = [
  'Verify your mobile',
  'A little about you',
  'Verify your identity',
  'Your work & income',
  'Your bank details',
  'Review your application',
];
const shortTitles = ['Mobile', 'Details', 'KYC', 'Income', 'Bank', 'Review'];
export function ApplicationForm({ demo }: { demo: boolean }): JSX.Element {
  const { status } = useSession();
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [kycLink, setKycLink] = useState('');
  const [pendingKycReference, setPendingKycReference] = useState('');
  const submitKey = useRef<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useForm<Application>({
    resolver: zodResolver(applicationSchema),
    mode: 'onTouched',
    defaultValues: {
      mobile: demo ? '9999999999' : '',
      name: demo ? 'Demo Customer' : '',
      email: demo ? 'customer@example.test' : '',
      dob: demo ? '1995-01-15' : '',
      pan: demo ? 'ABCDE1234F' : '',
      aadhaarConsent: false,
      kycReference: '',
      employment: 'Salaried',
      income: demo ? 50_000 : undefined,
      account: demo ? '123456789012' : '',
      ifsc: demo ? 'DEMO0123456' : '',
      amount: 250_000,
      tenure: 24,
      purpose: 'Other',
      consent: false,
    },
  });
  const values = form.watch();
  const estimate =
    values.amount >= 10_000 &&
    values.amount <= 1_000_000 &&
    Number.isInteger(Number(values.tenure)) &&
    values.tenure >= 6 &&
    values.tenure <= 60
      ? calculateLoan(Number(values.amount), Number(values.tenure))
      : null;
  function go(next: number): void {
    setStep(next);
    setMessage('');
    setTimeout(() => heading.current?.focus(), 0);
  }
  async function action(task: () => Promise<void>): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function sendOtp(): Promise<void> {
    if (!(await form.trigger('mobile'))) return;
    await action(async () => {
      await api('otp', { mobile: values.mobile });
      setSent(true);
      setMessage(
        demo ? 'Demo code: 123456. No SMS was sent.' : 'OTP requested. Check your messages.',
      );
    });
  }
  async function next(): Promise<void> {
    if (!(await form.trigger(stepFields[step]))) return;
    if (step === 0 && status !== 'authenticated') {
      if (!/^\d{6}$/.test(otp)) {
        setMessage('Enter your 6-digit OTP.');
        return;
      }
      await action(async () => {
        const response = await signIn('mobile-otp', {
          mobile: values.mobile,
          otp,
          redirect: false,
        });
        if (!response?.ok) throw new Error('OTP verification failed.');
        go(1);
      });
      return;
    }
    go(Math.min(5, step + 1));
  }
  async function save(): Promise<void> {
    await action(async () => {
      const cleaned = Object.fromEntries(
        Object.entries(form.getValues()).filter(([, value]) => value !== '' && value !== undefined),
      );
      await api('draft', { step: Math.max(1, step), values: cleaned });
      setMessage(
        demo
          ? 'Progress saved. Demo resume restores fictional defaults, not personal fields.'
          : 'Your draft was saved securely. Sign in to resume.',
      );
    });
  }
  async function resume(): Promise<void> {
    await action(async () => {
      const result = await api<{ step: number; values: Partial<Application> }>('draft');
      const parsed = applicationSchema
        .omit({ aadhaarConsent: true, consent: true })
        .partial()
        .safeParse(result.values);
      if (!parsed.success) throw new Error('The saved draft could not be loaded.');
      form.reset({
        ...form.getValues(),
        ...parsed.data,
        aadhaarConsent: false,
        consent: false,
        kycReference: '',
      });
      go(1);
      setMessage(
        'Draft resumed. Review your details and reconfirm identity consent before submission.',
      );
    });
  }
  async function verifyKyc(): Promise<void> {
    if (!(await form.trigger(['pan', 'aadhaarConsent']))) return;
    await action(async () => {
      const result = await api<{ verified: boolean; reference: string; redirectUrl?: string }>(
        'kyc',
        {
          pan: values.pan,
          consent: values.aadhaarConsent,
          ...(pendingKycReference ? { reference: pendingKycReference } : {}),
        },
      );
      if (result.verified) {
        form.setValue('kycReference', result.reference, { shouldValidate: true });
        setMessage(
          demo
            ? 'Simulated PAN and Aadhaar KYC completed. No real verification occurred.'
            : 'Identity verification completed.',
        );
      } else {
        setPendingKycReference(result.reference);
        if (result.redirectUrl) {
          const destination = new URL(result.redirectUrl);
          if (
            destination.protocol !== 'https:' ||
            destination.origin !== process.env.NEXT_PUBLIC_KYC_ORIGIN
          )
            throw new Error('The identity provider has not been approved for this deployment.');
          setKycLink(destination.href);
        }
        setMessage(
          'Complete identity verification with the authorised provider, then check status.',
        );
      }
    });
  }
  async function submit(data: Application): Promise<void> {
    await action(async () => {
      submitKey.current ??= crypto.randomUUID();
      const result = await api<{ id: string; reasons: string[] }>(
        'application',
        data,
        submitKey.current,
      );
      setSubmitted(result.id);
    });
  }
  function showInvalidStep(): void {
    const errors = applicationSchema.safeParse(form.getValues());
    if (!errors.success) {
      const field = String(errors.error.issues[0].path[0]);
      const index = stepFields.findIndex((fields) => fields.includes(field as keyof Application));
      go(Math.max(0, index));
      setMessage('Please complete the highlighted details before submitting.');
    }
  }
  function field(
    name: FieldPath<Application>,
    label: string,
    type = 'text',
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ): JSX.Element {
    const error = form.formState.errors[name];
    return (
      <div>
        <label className="field-label" htmlFor={`apply-${name}`}>
          {label}
        </label>
        <Input
          id={`apply-${name}`}
          type={type}
          {...form.register(
            name,
            ['amount', 'tenure', 'income'].includes(name) ? { valueAsNumber: true } : {},
          )}
          {...extra}
          aria-invalid={!!error}
          aria-describedby={error ? `error-${name}` : undefined}
        />
        {error && (
          <p id={`error-${name}`} role="alert" className="mt-2 text-xs text-red-700">
            {error.message}
          </p>
        )}
      </div>
    );
  }
  if (submitted)
    return (
      <Card className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Check />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Application received.</h1>
        <p className="mt-4 text-slate-600">Reference: {submitted}</p>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          {demo
            ? 'This was a simulated application. No credit decision or real loan was created.'
            : 'Your application is under review. A decision will include explanatory reason codes.'}
        </p>
        <Button asChild className="mt-7">
          <Link href="/dashboard">
            Go to dashboard <ArrowRight size={16} />
          </Link>
        </Button>
      </Card>
    );
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <ol aria-label="Application progress" className="mb-8 grid grid-cols-6 gap-1">
          {shortTitles.map((title, index) => (
            <li key={title} aria-current={index === step ? 'step' : undefined}>
              <div
                className={`mb-3 h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-slate-200'}`}
              />
              <span
                className={`text-[10px] sm:text-xs ${index === step ? 'font-bold text-primary' : 'text-slate-500'}`}
              >
                {index + 1}. {title}
              </span>
            </li>
          ))}
        </ol>
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">STEP {step + 1} OF 6</p>
            {status === 'authenticated' && (
              <button
                type="button"
                className="min-h-11 text-xs font-semibold text-primary"
                disabled={busy}
                onClick={() => void resume()}
              >
                Resume saved draft
              </button>
            )}
          </div>
          <h2 ref={heading} tabIndex={-1} className="mt-3 text-2xl font-bold outline-none">
            {titles[step]}
          </h2>
          <form onSubmit={form.handleSubmit(submit, showInvalidStep)} className="mt-7 space-y-6">
            {step === 0 && (
              <>
                {field('mobile', 'Indian mobile number', 'tel', {
                  maxLength: 10,
                  autoComplete: 'tel-national',
                })}
                {status === 'authenticated' ? (
                  <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    Your session is verified. Continue to your details.
                  </p>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void sendOtp()}
                    >
                      {sent ? 'Request another code' : 'Send OTP'}
                    </Button>
                    {sent && (
                      <div>
                        <label className="field-label" htmlFor="apply-otp">
                          One-time code
                        </label>
                        <Input
                          id="apply-otp"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                          value={otp}
                          onChange={(event) => setOtp(event.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {field('name', 'Full name', 'text', { autoComplete: 'name' })}
                {field('email', 'Email address', 'email', { autoComplete: 'email' })}
                {field('dob', 'Date of birth', 'date', { autoComplete: 'bday' })}
              </div>
            )}
            {step === 2 && (
              <>
                {field('pan', 'PAN', 'text', {
                  maxLength: 10,
                  className: 'uppercase',
                  onChange: (event) => {
                    form.setValue('pan', event.target.value.toUpperCase());
                    form.setValue('kycReference', '');
                    setPendingKycReference('');
                    setKycLink('');
                  },
                })}
                <div className="rounded-lg bg-blue-50 p-4 text-sm leading-7 text-slate-700">
                  <ShieldCheck size={22} className="mb-2 text-primary" />
                  Aadhaar OTP verification happens through an authorised provider. We do not collect
                  an Aadhaar number or Aadhaar OTP in this form.
                </div>
                <label className="flex gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    {...form.register('aadhaarConsent')}
                  />
                  I consent to PAN and Aadhaar identity verification for this application, as
                  explained in the privacy notice.
                </label>
                {form.formState.errors.aadhaarConsent && (
                  <p role="alert" className="text-xs text-red-700">
                    {form.formState.errors.aadhaarConsent.message}
                  </p>
                )}
                <Button
                  variant="outline"
                  type="button"
                  disabled={busy}
                  onClick={() => void verifyKyc()}
                >
                  {kycLink ? 'Check verification status' : 'Verify identity'}
                </Button>
                {kycLink && (
                  <a
                    href={kycLink}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="ml-4 text-sm font-semibold text-primary"
                  >
                    Open authorised KYC flow ↗
                  </a>
                )}
                {values.kycReference && (
                  <p className="text-sm text-emerald-800">
                    Verification reference: {values.kycReference}
                  </p>
                )}
                {form.formState.errors.kycReference && (
                  <p role="alert" className="text-xs text-red-700">
                    {form.formState.errors.kycReference.message}
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <div>
                  <label className="field-label" htmlFor="apply-employment">
                    Employment type
                  </label>
                  <select
                    id="apply-employment"
                    className="input-select"
                    {...form.register('employment')}
                  >
                    <option>Salaried</option>
                    <option>Self-employed</option>
                  </select>
                </div>
                {field('income', 'Monthly income (₹)', 'number', { min: 1, max: 10_000_000 })}
                <p className="text-xs leading-6 text-slate-500">
                  Income is used to assess affordability. Supporting evidence may be required.
                </p>
              </>
            )}
            {step === 4 && (
              <>
                {field('account', 'Bank account number', 'text', {
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  maxLength: 18,
                })}
                {field('ifsc', 'IFSC code', 'text', {
                  maxLength: 11,
                  onChange: (event) => form.setValue('ifsc', event.target.value.toUpperCase()),
                })}
                <p className="text-xs leading-6 text-slate-500">
                  The regulated lender will verify ownership before disbursal. No money moves during
                  this application.
                </p>
              </>
            )}
            {step === 5 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field('amount', 'Loan amount (₹)', 'number', {
                    min: 10_000,
                    max: 1_000_000,
                    step: 1000,
                  })}
                  {field('tenure', 'Tenure (months)', 'number', { min: 6, max: 60 })}
                </div>
                <div>
                  <label className="field-label" htmlFor="apply-purpose">
                    Purpose
                  </label>
                  <select className="input-select" id="apply-purpose" {...form.register('purpose')}>
                    {['Education', 'Medical', 'Home improvement', 'Business', 'Other'].map(
                      (purpose) => (
                        <option key={purpose}>{purpose}</option>
                      ),
                    )}
                  </select>
                </div>
                <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <dt>Name</dt>
                    <dd>{values.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Mobile</dt>
                    <dd>••••••{values.mobile.slice(-4)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Income</dt>
                    <dd>{currency(values.income)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Bank account</dt>
                    <dd>•••• {values.account.slice(-4)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>KYC</dt>
                    <dd>{values.kycReference ? 'Verified' : 'Incomplete'}</dd>
                  </div>
                </dl>
                <label className="flex gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    {...form.register('consent')}
                  />
                  <span>
                    I confirm these details and consent to application processing and eligibility
                    assessment under the{' '}
                    <Link href="/legal/privacy" className="text-primary underline">
                      privacy notice
                    </Link>{' '}
                    and{' '}
                    <Link href="/legal/terms" className="text-primary underline">
                      terms
                    </Link>
                    . No marketing consent is required.
                  </span>
                </label>
                {form.formState.errors.consent && (
                  <p role="alert" className="text-xs text-red-700">
                    {form.formState.errors.consent.message}
                  </p>
                )}
              </>
            )}
            <p role="status" className="text-sm leading-6 text-slate-700">
              {message}
            </p>
            <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
              {step > 0 ? (
                <Button variant="ghost" type="button" onClick={() => go(step - 1)} disabled={busy}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < 5 ? (
                <Button
                  key="continue"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void next();
                  }}
                  disabled={busy}
                >
                  Continue <ArrowRight size={16} />
                </Button>
              ) : (
                <Button key="submit" type="submit" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit application'}
                  <ArrowRight size={16} />
                </Button>
              )}
            </div>
            {status === 'authenticated' && step > 0 && (
              <Button
                variant="outline"
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void save()}
              >
                <Save size={16} />
                Save and resume later
              </Button>
            )}
          </form>
        </Card>
      </div>
      <aside>
        <Card className="sticky top-28 bg-[#f7faff] shadow-none">
          <p className="eyebrow">YOUR LOAN, AT A GLANCE</p>
          <p className="mt-6 text-sm text-slate-500">Illustrative monthly EMI at 10% p.a.</p>
          <p className="mt-2 text-3xl font-extrabold text-primary">
            {estimate ? currency(estimate.emi) : '—'}
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt>Annual rate range</dt>
              <dd className="font-semibold">8%–12%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Processing fee</dt>
              <dd className="font-semibold">1%–2% + GST</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tenure</dt>
              <dd>{values.tenure} months</dd>
            </div>
          </dl>
          <p className="mt-6 border-t pt-5 text-xs leading-6 text-slate-500">
            The final offer, APR, and charges appear in your Key Facts Statement. Submitting an
            application does not guarantee approval.
          </p>
        </Card>
      </aside>
    </div>
  );
}

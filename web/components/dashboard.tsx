'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Download, CalendarDays, ShieldCheck } from 'lucide-react';
import { api, getDashboard, type DashboardData } from '@/lib/api';
import { calculateLoan } from '@/lib/loan';
import { currency, csv, download } from '@/lib/utils';
import { Card, Skeleton } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
type View = 'overview' | 'loan' | 'repayment' | 'profile';
const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(150),
  notifications: z.boolean(),
});
const bankSchema = z.object({
  account: z.string().regex(/^\d{9,18}$/),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
});
function Profile({ data }: { data: DashboardData }): JSX.Element {
  const [message, setMessage] = useState('');
  const query = useQueryClient();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: data.profile.name, email: data.profile.email, notifications: true },
  });
  const bank = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues: { account: '', ifsc: '' },
  });
  const update = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      api<{ message?: string }>('profile', values),
    onSuccess: (result) => {
      setMessage(result.message ?? 'Profile updated.');
      void query.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => setMessage(error.message),
  });
  const updateBank = useMutation({
    mutationFn: (values: z.infer<typeof bankSchema>) => api<{ message?: string }>('bank', values),
    onSuccess: (result) => {
      setMessage(result.message ?? 'Bank verification requested.');
      bank.reset();
    },
    onError: (error) => setMessage(error.message),
  });
  async function document(id: string): Promise<void> {
    try {
      const result = await api<{ demo?: boolean; content?: string; url?: string }>('document', {
        id,
      });
      if (result.demo)
        download(
          result.content ?? 'Illustrative document. No actual agreement exists.',
          'pharaspay-demo-document.txt',
          'text/plain',
        );
      else if (result.url) {
        const url = new URL(result.url);
        if (url.protocol !== 'https:' || !/\.s3\.ap-south-[12]\.amazonaws\.com$/.test(url.hostname))
          throw new Error('Invalid document location.');
        window.location.assign(url.href);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Download failed.');
    }
  }
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Personal details</h2>
          <form
            className="mt-6 space-y-5"
            onSubmit={form.handleSubmit((values) => update.mutate(values))}
          >
            <div>
              <label className="field-label" htmlFor="profile-name">
                Full name
              </label>
              <Input id="profile-name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="profile-email">
                Email
              </label>
              <Input id="profile-email" type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                {...form.register('notifications')}
              />
              Receive optional product notifications
            </label>
            <p className="text-xs leading-6 text-slate-500">
              Essential servicing messages remain enabled. Marketing is optional.
            </p>
            <Button disabled={update.isPending} type="submit">
              Save details
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Bank account</h2>
          <p className="mt-5 text-sm text-slate-600">
            {data.profile.bank} · {data.profile.maskedAccount}
          </p>
          <form
            className="mt-6 space-y-5"
            onSubmit={bank.handleSubmit((values) => updateBank.mutate(values))}
          >
            <div>
              <label className="field-label" htmlFor="bank-account">
                New account number
              </label>
              <Input
                id="bank-account"
                inputMode="numeric"
                autoComplete="off"
                {...bank.register('account')}
              />
              {bank.formState.errors.account && (
                <p role="alert" className="text-xs text-red-700">
                  Enter 9–18 digits.
                </p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="bank-ifsc">
                IFSC
              </label>
              <Input id="bank-ifsc" maxLength={11} {...bank.register('ifsc')} />
              {bank.formState.errors.ifsc && (
                <p role="alert" className="text-xs text-red-700">
                  Enter a valid IFSC.
                </p>
              )}
            </div>
            <Button variant="outline" disabled={updateBank.isPending} type="submit">
              Request bank verification
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            Ownership verification is required before changing disbursal details.
          </p>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-bold">Document vault</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['Agreement', 'agreement'],
            ['Key Facts Statement', 'kfs'],
          ].map(([label, id]) => (
            <Button variant="outline" key={id} onClick={() => void document(id)}>
              <Download size={16} />
              {label}
              {data.demo ? ' (sample)' : ''}
            </Button>
          ))}
        </div>
      </Card>
      <p role="status" className="mt-5 text-sm text-slate-700">
        {message}
      </p>
    </>
  );
}
export function Dashboard({ view = 'overview' }: { view?: View }): JSX.Element {
  const result = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const [method, setMethod] = useState('UPI');
  const [message, setMessage] = useState('');
  const key = useRef<string>();
  const payment = useMutation({
    mutationFn: (loanId: string) => {
      key.current ??= crypto.randomUUID();
      return api<{ message?: string; redirectUrl?: string; demo?: boolean }>(
        'payment',
        { loanId, method },
        key.current,
      );
    },
    onSuccess: (data) => {
      setMessage(data.message ?? 'Payment session created.');
      if (data.redirectUrl) {
        const url = new URL(data.redirectUrl);
        const allowed = process.env.NEXT_PUBLIC_PAYMENT_ORIGIN;
        if (!allowed || url.origin !== allowed || url.protocol !== 'https:') {
          setMessage('Payment gateway has not been approved for this deployment.');
          return;
        }
        window.location.assign(url.href);
      }
    },
    onError: (error) => setMessage(error.message),
  });
  if (result.isPending)
    return (
      <div role="status" aria-label="Loading your account" className="grid gap-6 md:grid-cols-3">
        <span className="sr-only">Loading your account</span>
        {[1, 2, 3].map((index) => (
          <Card key={index}>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-5 h-12 w-44" />
            <Skeleton className="mt-7 h-5 w-full" />
          </Card>
        ))}
      </div>
    );
  if (result.isError)
    return (
      <Card role="alert">
        <h1 className="text-2xl font-bold">We couldn’t load your account.</h1>
        <p className="my-5 text-sm text-slate-600">{result.error.message}</p>
        <Button onClick={() => void result.refetch()}>Try again</Button>
        <Button asChild variant="ghost">
          <Link href="/login">Sign in again</Link>
        </Button>
      </Card>
    );
  const data = result.data;
  const loan = calculateLoan(data.amount, data.tenure, data.rate, data.feePercent);
  async function statement(): Promise<void> {
    try {
      const statement = await api<{
        rows: { id: string; date: string; amount: number; status: string }[];
      }>('statement');
      download(
        csv([
          ['Statement', data.demo ? 'DEMO ONLY' : 'Loan payment history'],
          ['Reference', 'Date', 'Amount INR', 'Status'],
          ...statement.rows.map((row) => [row.id, row.date, row.amount.toFixed(2), row.status]),
        ]),
        'pharaspay-statement.csv',
      );
      setMessage('Statement downloaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Download failed.');
    }
  }
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-bold">
            {view === 'overview'
              ? `Welcome back, ${data.profile.name}.`
              : {
                  loan: 'Your loan, with clarity.',
                  repayment: 'Stay one step ahead.',
                  profile: 'Your details. Your preferences.',
                }[view]}
          </h1>
        </div>
        {view !== 'profile' && (
          <Button variant="outline" onClick={() => void statement()}>
            <Download size={16} />
            Download statement
          </Button>
        )}
      </div>
      {data.demo && (
        <p className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Illustrative account · balances, score, reason codes, and history are sample data.
        </p>
      )}
      {view === 'profile' ? (
        <Profile data={data} />
      ) : (
        <>
          {(view === 'overview' || view === 'loan') && (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="bg-primary text-white lg:col-span-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                        ACTIVE PERSONAL LOAN
                      </p>
                      <h2 className="mt-3 text-3xl font-bold">{currency(data.amount)}</h2>
                      <p className="mt-2 text-xs text-blue-100">{data.loanId}</p>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
                      Active{data.demo ? ' · Demo' : ''}
                    </span>
                  </div>
                  <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-white/20 pt-5">
                    <div>
                      <dt className="text-xs text-blue-100">Next EMI</dt>
                      <dd className="mt-2 text-lg font-semibold">{currency(loan.emi)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-blue-100">Due date</dt>
                      <dd className="mt-2 text-sm font-semibold">
                        {new Date(`${data.nextDue}T00:00:00+05:30`).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Kolkata',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-blue-100">Outstanding principal</dt>
                      <dd className="mt-2 text-lg font-semibold">{currency(data.outstanding)}</dd>
                    </div>
                  </dl>
                </Card>
                <Card>
                  <p className="text-sm font-semibold">Credit score</p>
                  <p className="mt-5 font-heading text-5xl font-bold text-primary">
                    {data.creditScore ?? '—'}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {data.demo
                      ? 'Illustrative score · not a bureau report'
                      : 'Provided by your authorised bureau service'}
                  </p>
                  <div className="mt-6 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-3/4 rounded-full bg-success" />
                  </div>
                  <p className="mt-4 text-xs leading-6 text-slate-500">
                    Review your credit report to understand the contributing factors.
                  </p>
                </Card>
              </div>
              <div className="my-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Pay EMI', '/dashboard/repayment'],
                  ['View schedule', '/dashboard/loan'],
                  ['Get support', '/contact'],
                ].map(([label, href]) => (
                  <Button variant="outline" asChild key={href}>
                    <Link href={href}>
                      {label}
                      <ArrowUpRight size={16} />
                    </Link>
                  </Button>
                ))}
              </div>
            </>
          )}
          {view === 'loan' && (
            <Card className="mb-6">
              <h2 className="text-xl font-bold">Your offer breakdown</h2>
              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                {[
                  ['Annual interest', `${data.rate}% p.a.`],
                  ['Illustrative APR', `${loan.apr.toFixed(2)}%`],
                  ['Processing fee', `${currency(loan.fee)} (${data.feePercent}%)`],
                  ['GST on fee', currency(loan.gst)],
                  ['Total EMI repayment', currency(loan.totalPayable)],
                  ['Net disbursal', currency(loan.netDisbursal)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-2 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7 border-t pt-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={18} className="text-primary" />
                  Why this decision?
                </h3>
                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  {data.reasons.map((reason) => (
                    <li key={reason.code}>
                      <span className="font-semibold text-slate-800">{reason.code}</span>:{' '}
                      {reason.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">
                  {data.demo
                    ? 'Sample explanations. Live decisions must return SHAP-derived reason codes.'
                    : 'Reason codes are supplied by the lender’s explainable decision service.'}
                </p>
              </div>
            </Card>
          )}
          {view === 'repayment' && (
            <Card className="mb-6">
              <h2 className="text-xl font-bold">Make a repayment</h2>
              <p className="mt-3 text-sm text-slate-600">
                Next EMI: <strong>{currency(loan.emi)}</strong>. Complete payments only through the
                verified lender gateway.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="min-w-48">
                  <label className="field-label" htmlFor="payment-method">
                    Payment method
                  </label>
                  <select
                    id="payment-method"
                    className="input-select"
                    value={method}
                    onChange={(event) => {
                      setMethod(event.target.value);
                      key.current = undefined;
                    }}
                  >
                    {['UPI', 'Netbanking', 'Debit card', 'Auto-debit', 'Prepayment'].map(
                      (option) => (
                        <option key={option}>{option}</option>
                      ),
                    )}
                  </select>
                </div>
                <Button
                  className="self-end"
                  disabled={payment.isPending}
                  onClick={() => payment.mutate(data.loanId)}
                >
                  {payment.isPending
                    ? 'Opening payment…'
                    : method === 'Auto-debit'
                      ? 'Set up auto-debit'
                      : method === 'Prepayment'
                        ? 'Request prepayment quote'
                        : 'Pay now'}
                </Button>
              </div>
              <p role="status" className="mt-4 text-sm text-slate-700">
                {message}
              </p>
            </Card>
          )}
          {(view === 'loan' || view === 'repayment') && (
            <Card className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <CalendarDays size={20} className="text-primary" />
                EMI schedule
              </h2>
              <div className="mt-6 max-h-96 overflow-auto">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <caption className="sr-only">Loan EMI schedule</caption>
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      {['Instalment', 'EMI', 'Principal', 'Interest', 'Status'].map((label) => (
                        <th scope="col" className="py-3 pr-4" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loan.schedule.map((row) => (
                      <tr className="border-t" key={row.month}>
                        <th scope="row" className="py-4 pr-4 font-normal">
                          Month {row.month}
                        </th>
                        <td className="pr-4">{currency(row.payment)}</td>
                        <td className="pr-4">{currency(row.principal)}</td>
                        <td className="pr-4">{currency(row.interest)}</td>
                        <td className="text-xs text-slate-600">
                          {row.month <= data.paidMonths
                            ? 'Paid'
                            : row.month === data.paidMonths + 1
                              ? 'Next due'
                              : 'Upcoming'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {view !== 'loan' && (
            <Card>
              <h2 className="text-xl font-bold">Payment history</h2>
              <div className="mt-5 overflow-auto">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <caption className="sr-only">Your payment history</caption>
                  <thead>
                    <tr>
                      {['Reference', 'Date', 'Amount', 'Status'].map((label) => (
                        <th
                          className="pb-4 pr-4 text-xs font-medium text-slate-500"
                          scope="col"
                          key={label}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((row) => (
                      <tr className="border-t" key={row.id}>
                        <th scope="row" className="py-4 pr-4 font-medium">
                          {row.id}
                        </th>
                        <td className="pr-4">{row.date}</td>
                        <td className="pr-4">{currency(row.amount)}</td>
                        <td>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {view !== 'repayment' && (
            <p role="status" className="mt-4 text-sm text-slate-700">
              {message}
            </p>
          )}
        </>
      )}
    </>
  );
}

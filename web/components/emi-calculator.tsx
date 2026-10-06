'use client';
import { useState } from 'react';
import { ArrowUpRight, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { calculateLoan, LOAN_RULES } from '@/lib/loan';
import { currency, csv, download } from '@/lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
export function EmiCalculator({
  compact = false,
  initial,
}: {
  compact?: boolean;
  initial?: { amount: number; tenure: number; rate: number };
}): JSX.Element {
  const [amount, setAmount] = useState(initial?.amount ?? 250_000);
  const [tenure, setTenure] = useState(initial?.tenure ?? 24);
  const [rate, setRate] = useState(initial?.rate ?? 10);
  const [message, setMessage] = useState('');
  const valid =
    Number.isFinite(amount) &&
    amount >= 10_000 &&
    amount <= 1_000_000 &&
    Number.isInteger(tenure) &&
    tenure >= 6 &&
    tenure <= 60 &&
    rate >= 8 &&
    rate <= 12;
  const result = valid ? calculateLoan(amount, tenure, rate) : null;
  const prefix = compact ? 'mini' : 'full';
  async function share(): Promise<void> {
    const url = new URL('/calculator', location.origin);
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('tenure', String(tenure));
    url.searchParams.set('rate', String(rate));
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage('Calculator link copied.');
    } catch {
      setMessage(`Share this link: ${url.href}`);
    }
  }
  function exportSchedule(): void {
    if (!result) return;
    download(
      csv([
        ['Illustration only', `Annual rate ${rate}%`, 'Processing fee 1.5% + 18% GST'],
        ['Month', 'Principal', 'Interest', 'EMI', 'Balance'],
        ...result.schedule.map((row) => [
          row.month,
          row.principal.toFixed(2),
          row.interest.toFixed(2),
          row.payment.toFixed(2),
          row.balance.toFixed(2),
        ]),
      ]),
      'pharaspay-emi-illustration.csv',
    );
  }
  return (
    <div
      className={
        compact ? 'rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8' : ''
      }
    >
      {compact && (
        <div className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Your plans. Your EMI.</h2>
            <p className="mt-1 text-xs text-slate-500">A little planning goes a long way.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            EMI calculator
          </span>
        </div>
      )}
      <div className={compact ? '' : 'grid gap-10 lg:grid-cols-2'}>
        <div className="space-y-7">
          <div>
            <label className="field-label" htmlFor={`${prefix}-amount`}>
              Loan amount
            </label>
            <Input
              id={`${prefix}-amount`}
              type="number"
              min={LOAN_RULES.minAmount}
              max={LOAN_RULES.maxAmount}
              step={1000}
              value={Number.isFinite(amount) ? amount : ''}
              onChange={(event) => setAmount(event.target.valueAsNumber)}
              aria-describedby={`${prefix}-amount-hint`}
            />
            <input
              className="mt-4 h-6 w-full"
              aria-label="Loan amount slider"
              type="range"
              min={10_000}
              max={1_000_000}
              step={1000}
              value={Number.isFinite(amount) ? amount : 10_000}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
            <div
              id={`${prefix}-amount-hint`}
              className="flex justify-between text-xs text-slate-500"
            >
              <span>₹10,000</span>
              <span>₹10,00,000</span>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor={`${prefix}-tenure`}>
              Tenure <span className="font-normal text-slate-500">(months)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                className="h-6 flex-1"
                aria-label="Tenure slider"
                type="range"
                min={6}
                max={60}
                value={Number.isFinite(tenure) ? tenure : 6}
                onChange={(event) => setTenure(Number(event.target.value))}
              />
              <Input
                className="w-20"
                id={`${prefix}-tenure`}
                type="number"
                min={6}
                max={60}
                value={Number.isFinite(tenure) ? tenure : ''}
                onChange={(event) => setTenure(event.target.valueAsNumber)}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>6 months</span>
              <span>60 months</span>
            </div>
          </div>
          {!compact && (
            <div>
              <label className="field-label" htmlFor={`${prefix}-rate`}>
                Illustrative annual interest rate (8%–12%)
              </label>
              <Input
                id={`${prefix}-rate`}
                type="number"
                min={8}
                max={12}
                step={0.1}
                value={Number.isFinite(rate) ? rate : ''}
                onChange={(event) => setRate(event.target.valueAsNumber)}
              />
            </div>
          )}
          {compact && (
            <p className="text-xs text-slate-500">
              Illustration at 10% p.a. · Offers range from 8%–12% p.a.
            </p>
          )}
        </div>
        <div className={compact ? 'mt-7 rounded-xl bg-blue-50 p-5' : 'rounded-2xl bg-slate-50 p-7'}>
          {result ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">Your monthly EMI</p>
                  <p
                    aria-live="polite"
                    className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-primary"
                  >
                    {currency(result.emi)}
                  </p>
                </div>
                {!compact && (
                  <div
                    role="img"
                    aria-label={`Principal ${currency(amount)}, interest ${currency(result.totalInterest)}`}
                    className="grid size-24 shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#0A5CFF ${(amount / result.totalPayable) * 100}%, #00C48C 0)`,
                    }}
                  >
                    <div className="size-16 rounded-full bg-slate-50" />
                  </div>
                )}
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Total interest</dt>
                  <dd className="font-semibold">{currency(result.totalInterest)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Total EMI repayment</dt>
                  <dd className="font-semibold">{currency(result.totalPayable)}</dd>
                </div>
                {!compact && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Processing fee (1.5% illustration)</dt>
                      <dd>{currency(result.fee)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">GST on fee (18%)</dt>
                      <dd>{currency(result.gst)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                      <dt>Overall cost incl. fee + GST</dt>
                      <dd className="font-semibold">
                        {currency(result.totalPayable + result.fee + result.gst)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Net disbursal after fees</dt>
                      <dd>{currency(result.netDisbursal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Illustrative APR</dt>
                      <dd>{result.apr.toFixed(2)}%</dd>
                    </div>
                  </>
                )}
              </dl>
            </>
          ) : (
            <p role="alert" className="text-red-700">
              Enter ₹10,000–₹10,00,000, 6–60 whole months, and a rate of 8%–12%.
            </p>
          )}
          {compact && (
            <Button asChild className="mt-6 w-full">
              <Link href="/apply">
                Find my loan <ArrowUpRight size={16} />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">
        For illustration only. Processing fee: 1%–2% + GST. Your final APR and charges are set out
        in the lender’s Key Facts Statement. EMI totals exclude upfront fees.
      </p>
      {!compact && result && (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Your repayment, month by month</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void share()}>
                <Share2 size={16} />
                Share
              </Button>
              <Button variant="outline" onClick={exportSchedule}>
                <Download size={16} />
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Print / PDF
              </Button>
            </div>
          </div>
          <p role="status" className="mb-3 break-all text-sm text-blue-700">
            {message}
          </p>
          <div className="max-h-[460px] overflow-auto rounded-card border border-slate-200">
            <table className="w-full min-w-[600px] text-right text-sm">
              <caption className="sr-only">Illustrative amortization schedule</caption>
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  {['Month', 'Principal', 'Interest', 'Payment', 'Balance'].map((label) => (
                    <th scope="col" className="p-4 font-medium" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr className="border-t border-slate-100" key={row.month}>
                    <th scope="row" className="p-4 font-normal">
                      {row.month}
                    </th>
                    <td className="p-4">{currency(row.principal)}</td>
                    <td className="p-4">{currency(row.interest)}</td>
                    <td className="p-4">{currency(row.payment)}</td>
                    <td className="p-4">{currency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

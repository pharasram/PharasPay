import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { EmiCalculator } from '@/components/emi-calculator';
export const metadata: Metadata = { title: 'EMI calculator' };
export default function CalculatorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): JSX.Element {
  const bounded = (name: string, min: number, max: number, fallback: number): number => {
    const value = Number(searchParams[name]);
    return Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (name !== 'tenure' || Number.isInteger(value))
      ? value
      : fallback;
  };
  const initial = {
    amount: bounded('amount', 10_000, 1_000_000, 250_000),
    tenure: bounded('tenure', 6, 60, 24),
    rate: bounded('rate', 8, 12, 10),
  };
  return (
    <div className="container-shell section">
      <PageHeading
        eyebrow="PLAN WITH CONFIDENCE"
        title="Make the numbers work for you."
        description="Adjust your amount and tenure to find a monthly repayment that fits. Explore annual rates from 8% to 12%."
      />
      <div className="mt-12">
        <EmiCalculator initial={initial} />
      </div>
    </div>
  );
}

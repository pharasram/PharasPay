export const LOAN_RULES = {
  minAmount: 10_000,
  maxAmount: 1_000_000,
  minTenure: 6,
  maxTenure: 60,
  minRate: 8,
  maxRate: 12,
  minFee: 1,
  maxFee: 2,
  gstRate: 18,
} as const;
export interface Instalment {
  month: number;
  opening: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}
export interface LoanCalculation {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  fee: number;
  gst: number;
  netDisbursal: number;
  apr: number;
  schedule: Instalment[];
}
export function calculateLoan(
  amount: number,
  tenure: number,
  rate = 10,
  feePercent = 1.5,
): LoanCalculation {
  if (
    !Number.isFinite(amount) ||
    amount < LOAN_RULES.minAmount ||
    amount > LOAN_RULES.maxAmount ||
    !Number.isInteger(tenure) ||
    tenure < 6 ||
    tenure > 60 ||
    !Number.isFinite(rate) ||
    rate < 8 ||
    rate > 12 ||
    !Number.isFinite(feePercent) ||
    feePercent < 1 ||
    feePercent > 2
  )
    throw new RangeError('Loan inputs are outside the permitted limits.');
  const monthly = rate / 1200;
  const emi = (amount * monthly) / (1 - (1 + monthly) ** -tenure);
  let balance = amount;
  const schedule: Instalment[] = Array.from({ length: tenure }, (_, index) => {
    const interest = balance * monthly;
    const principal = index === tenure - 1 ? balance : Math.min(emi - interest, balance);
    const opening = balance;
    balance = Math.max(0, balance - principal);
    return {
      month: index + 1,
      opening,
      principal,
      interest,
      payment: principal + interest,
      balance,
    };
  });
  const totalPayable = schedule.reduce((sum, row) => sum + row.payment, 0);
  const fee = (amount * feePercent) / 100;
  const gst = (fee * LOAN_RULES.gstRate) / 100;
  const netDisbursal = amount - fee - gst;
  // Cash-flow IRR including upfront processing fee and GST, annualised nominally.
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 100; iteration++) {
    const midpoint = (low + high) / 2;
    const presentValue = schedule.reduce(
      (sum, row) => sum + row.payment / (1 + midpoint) ** row.month,
      0,
    );
    if (presentValue > netDisbursal) low = midpoint;
    else high = midpoint;
  }
  return {
    emi,
    totalInterest: totalPayable - amount,
    totalPayable,
    fee,
    gst,
    netDisbursal,
    apr: ((low + high) / 2) * 1200,
    schedule,
  };
}

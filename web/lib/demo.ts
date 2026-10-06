import { calculateLoan } from './loan';
export const demoLoan = calculateLoan(250_000, 24, 10, 1.5);
export const demoDashboard = {
  demo: true,
  loanId: 'DEMO-24001',
  amount: 250_000,
  tenure: 24,
  rate: 10,
  feePercent: 1.5,
  outstanding: demoLoan.schedule[5].balance,
  paidMonths: 6,
  nextDue: '2026-11-05',
  creditScore: 742,
  reasons: [
    { code: 'AFFORDABILITY', text: 'Illustrative income supports the monthly repayment.' },
    { code: 'PAYMENT_HISTORY', text: 'Illustrative repayment history is consistent.' },
  ],
  payments: [
    { id: 'DEMO-P006', date: '2026-10-05', amount: demoLoan.emi, status: 'Completed' },
    { id: 'DEMO-P005', date: '2026-09-05', amount: demoLoan.emi, status: 'Completed' },
    { id: 'DEMO-P004', date: '2026-08-05', amount: demoLoan.emi, status: 'Completed' },
  ],
  profile: {
    name: 'Demo customer',
    email: 'customer@example.test',
    bank: 'Demo bank',
    maskedAccount: '•••• 4321',
  },
};

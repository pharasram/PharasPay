import { calculateLoan } from '@/lib/loan';
import { applicationSchema, mobileSchema, otpSchema, contactSchema } from '@/lib/schemas';
import { currency, cn, csv, download } from '@/lib/utils';
export const application = {
  mobile: '9999999999',
  name: 'Demo Customer',
  email: 'customer@example.test',
  dob: '1995-01-15',
  pan: 'ABCDE1234F',
  aadhaarConsent: true,
  kycReference: 'DEMO-KYC',
  employment: 'Salaried',
  income: 50000,
  account: '123456789012',
  ifsc: 'DEMO0123456',
  amount: 250000,
  tenure: 24,
  purpose: 'Other',
  consent: true,
};
describe('Loan calculations and product boundaries', () => {
  test('calculates a reducing-balance loan and accounts for every rupee', () => {
    const result = calculateLoan(250000, 24);
    expect(result.emi).toBeCloseTo(11536.23, 2);
    expect(result.schedule.at(-1)?.balance).toBe(0);
    expect(result.schedule.reduce((sum, row) => sum + row.principal, 0)).toBeCloseTo(250000, 5);
    expect(result.totalInterest + 250000).toBeCloseTo(result.totalPayable, 5);
    expect(result.fee).toBe(3750);
    expect(result.gst).toBe(675);
    expect(result.netDisbursal).toBe(245575);
    expect(result.apr).toBeGreaterThan(10);
  });
  test.each([
    [10000, 6, 8, 1],
    [1000000, 60, 12, 2],
  ])('accepts inclusive limits %s/%s/%s/%s', (amount, tenure, rate, fee) => {
    expect(calculateLoan(amount, tenure, rate, fee).schedule).toHaveLength(tenure);
  });
  test.each([
    [9999, 24, 10, 1.5],
    [1000001, 24, 10, 1.5],
    [NaN, 24, 10, 1.5],
    [250000, 5, 10, 1.5],
    [250000, 61, 10, 1.5],
    [250000, 6.5, 10, 1.5],
    [250000, 24, 7.99, 1.5],
    [250000, 24, 12.01, 1.5],
    [250000, 24, NaN, 1.5],
    [250000, 24, 10, 0.99],
    [250000, 24, 10, 2.01],
    [250000, 24, 10, NaN],
  ])('rejects invalid loan %s/%s/%s/%s', (...args) => {
    expect(() => calculateLoan(...(args as [number, number, number, number]))).toThrow(RangeError);
  });
  test('a longer tenure reduces EMI and increases total interest', () => {
    const short = calculateLoan(100000, 12, 8);
    const long = calculateLoan(100000, 60, 8);
    expect(long.emi).toBeLessThan(short.emi);
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
  });
});
describe('Validation and exports', () => {
  test('validates a full application', () => {
    expect(applicationSchema.parse(application).amount).toBe(250000);
  });
  test.each([
    { mobile: '123' },
    { dob: '2099-01-01' },
    { dob: '1899-01-01' },
    { dob: 'invalid' },
    { pan: 'wrong' },
    { aadhaarConsent: false },
    { kycReference: '' },
    { consent: false },
    { account: 'bad' },
    { ifsc: 'bad' },
    { income: 0 },
    { amount: 1000001 },
    { tenure: 61 },
  ])('rejects invalid application values %s', (patch) => {
    expect(applicationSchema.safeParse({ ...application, ...patch }).success).toBe(false);
  });
  test('validates phone, OTP and contact permission', () => {
    expect(mobileSchema.safeParse('9999999999').success).toBe(true);
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('123').success).toBe(false);
    expect(
      contactSchema.safeParse({
        name: 'Demo',
        email: 'demo@example.test',
        subject: 'Other',
        message: 'Please help with my application.',
        consent: true,
      }).success,
    ).toBe(true);
  });
  test('formats Indian amounts and CSV safely', () => {
    expect(currency(100000)).toBe('₹1,00,000');
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(csv([['a"b', 1]])).toBe('"a""b","1"');
  });
  test('neutralises spreadsheet formula injection in downloaded text', () => {
    expect(csv([['=SUM(A1)', '-cmd', '@formula', -1]])).toBe(
      '"\'=SUM(A1)","\'-cmd","\'@formula","-1"',
    );
  });
  test('downloads and releases its object URL', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    download('hello', 'test.csv');
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:demo');
    click.mockRestore();
  });
});

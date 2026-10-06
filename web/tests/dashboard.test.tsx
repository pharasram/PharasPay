import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '@/components/dashboard';
import { api, getDashboard } from '@/lib/api';
import { demoDashboard } from '@/lib/demo';
jest.mock('@/lib/api', () => ({ api: jest.fn(), getDashboard: jest.fn() }));
function mount(view: 'overview' | 'loan' | 'repayment' | 'profile' = 'overview'): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Dashboard view={view} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  (getDashboard as jest.Mock).mockResolvedValue(demoDashboard);
  (api as jest.Mock).mockResolvedValue({
    message: 'Simulated successfully.',
    demo: true,
    rows: demoDashboard.payments,
    content: 'Sample document',
  });
});
test('shows loading skeletons and a recoverable error state', async () => {
  (getDashboard as jest.Mock).mockRejectedValueOnce(new Error('Session expired.'));
  mount();
  expect(screen.getByRole('status', { name: 'Loading your account' })).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Session expired.');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
});
test('overview shows sample balances and downloads the statement', async () => {
  const user = userEvent.setup();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  mount();
  expect(await screen.findByText('742')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Pay EMI' })).toHaveAttribute(
    'href',
    '/dashboard/repayment',
  );
  await user.click(screen.getByRole('button', { name: 'Download statement' }));
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(screen.getByRole('status')).toHaveTextContent('Statement downloaded.');
  click.mockRestore();
});
test('loan view shows decision explanations, fees and the full schedule', async () => {
  mount('loan');
  expect(await screen.findByText('Why this decision?')).toBeInTheDocument();
  expect(screen.getByText('AFFORDABILITY')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Loan EMI schedule' })).toBeInTheDocument();
  expect(screen.getAllByText('Paid')).toHaveLength(6);
});
test('repayment supports each payment type and reports backend failures', async () => {
  const user = userEvent.setup();
  mount('repayment');
  await screen.findByText('Make a repayment');
  await user.click(screen.getByRole('button', { name: 'Pay now' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Simulated successfully.');
  for (const method of ['Netbanking', 'Debit card', 'Auto-debit', 'Prepayment']) {
    fireEvent.change(screen.getByLabelText('Payment method'), { target: { value: method } });
  }
  (api as jest.Mock).mockRejectedValueOnce(new Error('Payment unavailable'));
  await user.click(screen.getByRole('button', { name: 'Request prepayment quote' }));
  expect(await screen.findByText('Payment unavailable')).toBeInTheDocument();
});
test('rejects an unapproved payment redirect', async () => {
  const user = userEvent.setup();
  (api as jest.Mock).mockResolvedValueOnce({ redirectUrl: 'https://unapproved.example.test/pay' });
  mount('repayment');
  await screen.findByText('Make a repayment');
  await user.click(screen.getByRole('button', { name: 'Pay now' }));
  expect(await screen.findByText(/gateway has not been approved/)).toBeInTheDocument();
});
test('profile validates and updates preferences, bank verification and documents', async () => {
  const user = userEvent.setup();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  mount('profile');
  await screen.findByText('Personal details');
  await user.clear(screen.getByLabelText('Full name'));
  await user.click(screen.getByRole('button', { name: 'Save details' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Full name'), 'Updated Demo');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Save details' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Simulated successfully.');
  await user.click(screen.getByRole('button', { name: 'Request bank verification' }));
  expect(await screen.findAllByRole('alert')).toHaveLength(2);
  await user.type(screen.getByLabelText('New account number'), '123456789012');
  await user.type(screen.getByLabelText('IFSC'), 'DEMO0123456');
  await user.click(screen.getByRole('button', { name: 'Request bank verification' }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('bank', expect.objectContaining({ ifsc: 'DEMO0123456' })),
  );
  await user.click(screen.getByRole('button', { name: 'Agreement (sample)' }));
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});
test('statement failure is shown without exposing an empty download', async () => {
  const user = userEvent.setup();
  mount();
  await screen.findByText('742');
  (api as jest.Mock).mockRejectedValueOnce(new Error('Statement unavailable'));
  await user.click(screen.getByRole('button', { name: 'Download statement' }));
  expect(await screen.findByText('Statement unavailable')).toBeInTheDocument();
});

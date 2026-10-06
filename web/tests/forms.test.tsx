import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn, useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { AuthForm } from '@/components/auth-form';
import { ApplicationForm } from '@/components/application-form';
import { ContactForm } from '@/components/contact-form';
jest.mock('next-auth/react', () => ({ signIn: jest.fn(), useSession: jest.fn() }));
const push = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('@/lib/api', () => ({ api: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks();
  (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
  (signIn as jest.Mock).mockResolvedValue({ ok: true });
  (api as jest.Mock).mockImplementation((resource: string) =>
    Promise.resolve(
      resource === 'kyc'
        ? { verified: true, reference: 'DEMO-KYC' }
        : resource === 'application'
          ? { id: 'DEMO-APP-24001', reasons: ['demo'] }
          : { message: 'Request received.' },
    ),
  );
});
test('OTP login requests, validates and signs in', async () => {
  const user = userEvent.setup();
  render(<AuthForm demo />);
  await user.click(screen.getByRole('button', { name: 'Send OTP' }));
  expect(await screen.findByText(/Demo OTP:/)).toBeInTheDocument();
  await user.type(screen.getByLabelText('One-time code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  expect(signIn).toHaveBeenCalledWith(
    'mobile-otp',
    expect.objectContaining({ mobile: '9999999999', otp: '123456' }),
  );
});
test('registration reports verification failures, allows retry, then enters application', async () => {
  const user = userEvent.setup();
  render(<AuthForm demo register />);
  await user.click(screen.getByRole('button', { name: 'Send OTP' }));
  await user.click(screen.getByRole('button', { name: 'Request another code' }));
  await user.type(screen.getByLabelText('One-time code'), '000000');
  (signIn as jest.Mock).mockResolvedValueOnce({ ok: false });
  await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
  expect(await screen.findByText(/Verification failed/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/apply'));
});
test('invalid mobile numbers and service outages remain actionable', async () => {
  const user = userEvent.setup();
  render(<AuthForm />);
  await user.click(screen.getByRole('button', { name: 'Send OTP' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Mobile number'), '9999999999');
  (api as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable.'));
  await user.click(screen.getByRole('button', { name: 'Send OTP' }));
  expect(await screen.findByText('Service unavailable.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /secure Cognito/ }));
  expect(signIn).toHaveBeenCalledWith('cognito', { callbackUrl: '/dashboard' });
});
test('completes the six-step application with KYC consent and idempotent submission', async () => {
  const user = userEvent.setup();
  render(<ApplicationForm demo />);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('A little about you')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Verify your identity')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Verify identity' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Consent');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Verify identity' }));
  expect(await screen.findByText(/Simulated PAN/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Your work & income')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Your bank details')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Review your application')).toBeInTheDocument();
  expect(
    screen.queryByText('Please complete the highlighted details before submitting.'),
  ).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalledWith('application', expect.anything(), expect.anything());
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(await screen.findByRole('heading', { name: 'Application received.' })).toBeInTheDocument();
  expect(api).toHaveBeenCalledWith(
    'application',
    expect.objectContaining({ amount: 250000, consent: true }),
    '12345678-1234-4123-8123-123456789012',
  );
});
test('application saves progress and resumes with consent reconfirmation', async () => {
  const user = userEvent.setup();
  render(<ApplicationForm demo />);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Save and resume later' }));
  expect(await screen.findByText(/Progress saved/)).toBeInTheDocument();
  (api as jest.Mock).mockResolvedValueOnce({ step: 5, values: { name: 'Saved Demo' } });
  await user.click(screen.getByRole('button', { name: 'Resume saved draft' }));
  expect(await screen.findByText(/Draft resumed/)).toBeInTheDocument();
  expect(screen.getByLabelText('Full name')).toHaveValue('Saved Demo');
  await user.click(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByText('Verify your mobile')).toBeInTheDocument();
});
test('application OTP flow handles errors and unauthenticated sign-in', async () => {
  const user = userEvent.setup();
  (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' });
  render(<ApplicationForm demo />);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Enter your 6-digit OTP.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Send OTP' }));
  expect(await screen.findByText(/Demo code:/)).toBeInTheDocument();
  await user.type(screen.getByLabelText('One-time code'), '123456');
  (signIn as jest.Mock).mockResolvedValueOnce({ ok: false });
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('OTP verification failed.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('A little about you')).toBeInTheDocument();
});
test('application blocks invalid details and reports draft errors', async () => {
  const user = userEvent.setup();
  render(<ApplicationForm demo />);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '' } });
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  (api as jest.Mock).mockRejectedValueOnce(new Error('Draft unavailable'));
  await user.click(screen.getByRole('button', { name: 'Resume saved draft' }));
  expect(await screen.findByText('Draft unavailable')).toBeInTheDocument();
});
test('contact form requires consent and confirms its result', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);
  await user.type(screen.getByLabelText('Your name'), 'Demo Customer');
  await user.type(screen.getByLabelText('Email address'), 'customer@example.test');
  await user.type(screen.getByLabelText('Message'), 'Please help with my loan application.');
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('consent');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Request received.');
});
test('contact validation flags empty fields', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  expect(await screen.findAllByRole('alert')).toHaveLength(4);
});

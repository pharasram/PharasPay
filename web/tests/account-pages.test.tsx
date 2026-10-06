import { render, screen, cleanup } from '@testing-library/react';
import { getServerSession } from 'next-auth';
import DashboardLayout from '@/app/dashboard/layout';
import Overview from '@/app/dashboard/page';
import Loan from '@/app/dashboard/loan/page';
import Repayment from '@/app/dashboard/repayment/page';
import Profile from '@/app/dashboard/profile/page';
import Login from '@/app/login/page';
import Register from '@/app/register/page';
import Apply from '@/app/apply/page';
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('next/navigation', () => ({
  redirect: () => {
    throw new Error('REDIRECT_LOGIN');
  },
}));
jest.mock('@/components/dashboard-nav', () => ({
  DashboardNav: () => <nav aria-label="Account" />,
}));
jest.mock('@/components/dashboard', () => ({
  Dashboard: ({ view = 'overview' }: { view?: string }) => <h1>{view}</h1>,
}));
jest.mock('@/components/auth-form', () => ({
  AuthForm: ({ register }: { register?: boolean }) => <h1>{register ? 'Register' : 'Login'}</h1>,
}));
jest.mock('@/components/application-form', () => ({
  ApplicationForm: () => <p>Application flow</p>,
}));
test('protected layout checks sessions on the server', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  await expect(DashboardLayout({ children: <p>Private</p> })).rejects.toThrow('REDIRECT_LOGIN');
  (getServerSession as jest.Mock).mockResolvedValue({ error: 'expired' });
  await expect(DashboardLayout({ children: <p>Private</p> })).rejects.toThrow('REDIRECT_LOGIN');
  (getServerSession as jest.Mock).mockResolvedValue({ customerId: 'customer' });
  render(await DashboardLayout({ children: <p>Private</p> }));
  expect(screen.getByText('Private')).toBeInTheDocument();
});
test('account routes render their intended view', () => {
  for (const Page of [Overview, Loan, Repayment, Profile, Login, Register, Apply]) {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    cleanup();
  }
});

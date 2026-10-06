import { act, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signOut } from 'next-auth/react';
import { Providers } from '@/components/providers';
import { Analytics } from '@/components/analytics';
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
let pathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => pathname }));
jest.mock(
  'next/script',
  () =>
    function Script({ id, children }: { id?: string; children?: React.ReactNode }) {
      return <div data-testid={id}>{children}</div>;
    },
);
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  pathname = '/';
  (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' });
  delete process.env.NEXT_PUBLIC_ANALYTICS_APPROVED;
});
afterEach(() => {
  jest.useRealTimers();
});
test('providers render unauthenticated content without an inactivity timer', () => {
  render(
    <Providers>
      <p>Customer area</p>
    </Providers>,
  );
  expect(screen.getByText('Customer area')).toBeInTheDocument();
  expect(signOut).not.toHaveBeenCalled();
});
test('activity resets the 15 minute logout timer', () => {
  jest.useFakeTimers();
  (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
  const { unmount } = render(
    <Providers>
      <p>Customer area</p>
    </Providers>,
  );
  act(() => jest.advanceTimersByTime(14 * 60 * 1000));
  fireEvent.pointerDown(window);
  act(() => jest.advanceTimersByTime(14 * 60 * 1000));
  expect(signOut).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(60 * 1000));
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login?expired=1' });
  unmount();
});
test('analytics are disabled by default and suppressed on account pages', () => {
  const { rerender } = render(<Analytics />);
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  process.env.NEXT_PUBLIC_ANALYTICS_APPROVED = 'true';
  pathname = '/dashboard';
  rerender(<Analytics />);
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});
test('development analytics require explicit consent and valid IDs', async () => {
  process.env.NEXT_PUBLIC_ANALYTICS_APPROVED = 'true';
  process.env.NEXT_PUBLIC_GA_ID = 'G-DEMO123';
  process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456';
  const user = userEvent.setup();
  render(<Analytics />);
  expect(screen.queryByTestId('ga-init')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Accept analytics' }));
  expect(localStorage.getItem('pharaspay-analytics')).toBe('accepted');
  expect(screen.getByTestId('ga-init')).toBeInTheDocument();
  expect(screen.getByTestId('meta-init')).toBeInTheDocument();
});
test('invalid analytics IDs never inject scripts', () => {
  process.env.NEXT_PUBLIC_ANALYTICS_APPROVED = 'true';
  process.env.NEXT_PUBLIC_GA_ID = 'invalid';
  process.env.NEXT_PUBLIC_META_PIXEL_ID = 'invalid';
  localStorage.setItem('pharaspay-analytics', 'accepted');
  render(<Analytics />);
  expect(screen.queryByTestId('ga-init')).not.toBeInTheDocument();
  expect(screen.queryByTestId('meta-init')).not.toBeInTheDocument();
});

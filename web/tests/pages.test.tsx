import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import Home from '@/app/page';
import Loans from '@/app/loans/page';
import Personal from '@/app/loans/personal/page';
import Business from '@/app/loans/business/page';
import Calculator from '@/app/calculator/page';
import About from '@/app/about/page';
import Faq from '@/app/faq/page';
import Contact from '@/app/contact/page';
import Blog from '@/app/blog/page';
import Article, { generateMetadata, generateStaticParams } from '@/app/blog/[slug]/page';
import Terms from '@/app/legal/terms/page';
import Privacy from '@/app/legal/privacy/page';
import Disclosures from '@/app/legal/rbi-disclosures/page';
import NotFound from '@/app/not-found';
import ErrorPage from '@/app/error';
import Loading from '@/app/loading';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { DashboardNav } from '@/components/dashboard-nav';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: () => ({ status: 'unauthenticated' }),
}));
jest.mock('framer-motion', () => ({
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
  useReducedMotion: () => false,
}));
test.each([
  ['Home', Home],
  ['Loans', Loans],
  ['Personal', Personal],
  ['Business', Business],
  ['About', About],
  ['FAQ', Faq],
  ['Contact', Contact],
  ['Blog', Blog],
  ['Terms', Terms],
  ['Privacy', Privacy],
  ['Disclosures', Disclosures],
  ['404', NotFound],
] as const)('%s page provides a main heading and valid links', (_name, Page) => {
  render(<Page />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  for (const link of screen.queryAllByRole('link'))
    expect(link.getAttribute('href')).toMatch(/^(\/|https:\/\/)/);
});
test('shared calculator input is bounded and restored', () => {
  render(<Calculator searchParams={{ amount: '100000', tenure: '12', rate: '8' }} />);
  expect(screen.getByLabelText('Loan amount')).toHaveValue(100000);
  cleanup();
  render(<Calculator searchParams={{ amount: '-1', tenure: '6.5', rate: '99' }} />);
  expect(screen.getByLabelText('Loan amount')).toHaveValue(250000);
  expect(screen.getByLabelText('Tenure (months)')).toHaveValue(24);
});
test('blog content generates metadata and handles unknown articles', () => {
  const params = generateStaticParams();
  expect(params).toHaveLength(3);
  render(<Article params={params[0]} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('understanding your EMI');
  expect(generateMetadata({ params: params[0] }).description).toBeDefined();
  expect(generateMetadata({ params: { slug: 'missing' } }).title).toBe('Article not found');
  expect(() => Article({ params: { slug: 'missing' } })).toThrow('NOT_FOUND');
});
test('navigation is usable on mobile and closes on navigation', async () => {
  const user = userEvent.setup();
  render(<SiteHeader />);
  await user.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Open menu' }));
  const mobile = screen.getByRole('navigation', { name: 'Mobile' });
  await user.click(mobile.querySelector('a')!);
  expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
});
test('footer links include required legal and lender disclosures', () => {
  render(<SiteFooter />);
  expect(screen.getByRole('link', { name: 'RBI disclosures' })).toHaveAttribute(
    'href',
    '/legal/rbi-disclosures',
  );
  expect(screen.getByText(/No RBI endorsement/)).toBeInTheDocument();
});
test('dashboard logout clears cached customer data', async () => {
  const client = new QueryClient();
  client.setQueryData(['private'], { name: 'Demo' });
  render(
    <QueryClientProvider client={client}>
      <DashboardNav />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(client.getQueryData(['private'])).toBeUndefined();
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
});
test('error and loading pages provide accessible feedback', async () => {
  const reset = jest.fn();
  render(<ErrorPage error={new Error('private')} reset={reset} />);
  expect(screen.queryByText('private')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(reset).toHaveBeenCalled();
  cleanup();
  render(<Loading />);
  expect(screen.getByRole('status')).toHaveAccessibleName('Loading page');
});
test('SEO excludes customer paths from indexing', () => {
  expect(
    sitemap()
      .map((entry) => entry.url)
      .some((url) => url.endsWith('/dashboard')),
  ).toBe(false);
  expect(sitemap().map((entry) => entry.url)).toContain('http://localhost:3000/blog/fees-and-apr');
  expect(robots().rules).toEqual(
    expect.objectContaining({ disallow: expect.arrayContaining(['/dashboard', '/api/']) }),
  );
});

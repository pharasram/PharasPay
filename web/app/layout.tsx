import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@/components/analytics';
const inter = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2',
      weight: '500 900',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});
const manrope = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff2',
      weight: '400 600',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2',
      weight: '700 900',
      style: 'normal',
    },
  ],
  variable: '--font-manrope',
  display: 'swap',
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'PharasPay | A clearer way forward', template: '%s | PharasPay' },
  description:
    'Explore personal loans of ₹10,000–₹10,00,000 at 8%–12% p.a. Clear fees, a simple EMI calculator, and a digital application.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'PharasPay',
    title: 'PharasPay | A clearer way forward',
    description: 'Transparent. Fast. Digital. Explore loans at 8%–12% p.a.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'PharasPay: Transparent. Fast. Digital.',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
};
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <a href="#main-content" className="sr-only z-50 bg-white p-3 focus:not-sr-only focus:fixed">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <div className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
              Demo experience · Use fictional information only. No real loans, KYC, or payments.
            </div>
          )}
          <main id="main-content">{children}</main>
          <SiteFooter />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}

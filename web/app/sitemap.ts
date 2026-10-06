import type { MetadataRoute } from 'next';
import { articles } from '@/lib/content';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    '',
    '/loans',
    '/loans/personal',
    '/loans/business',
    '/calculator',
    '/about',
    '/contact',
    '/faq',
    '/blog',
    '/legal/terms',
    '/legal/privacy',
    '/legal/rbi-disclosures',
    ...articles.map((article) => `/blog/${article.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}

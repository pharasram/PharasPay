import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { PageHeading } from '@/components/page-heading';
import { Card } from '@/components/ui/card';
import { articles } from '@/lib/content';
export const metadata: Metadata = { title: 'The PharasPay journal' };
export default function BlogPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <PageHeading
        eyebrow="THE PHARASPAY JOURNAL"
        title="A little knowledge. More confidence."
        description="Plain-language guides to borrowing, repayments, and making informed choices."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {articles.map((article, index) => (
          <Card className="flex flex-col overflow-hidden p-0" key={article.slug}>
            <div
              aria-hidden
              className={`flex h-40 items-center justify-center ${['bg-blue-50', 'bg-emerald-50', 'bg-amber-50'][index]}`}
            >
              <BookOpen size={48} className="text-primary" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="eyebrow text-[10px]">{article.category}</p>
              <h2 className="mt-4 text-xl font-bold leading-8">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{article.intro}</p>
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-slate-500">{article.minutes} min read</span>
                <Link
                  aria-label={`Read ${article.title}`}
                  className="p-2 text-primary"
                  href={`/blog/${article.slug}`}
                >
                  <ArrowUpRight size={20} />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

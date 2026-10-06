import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles } from '@/lib/content';
export function generateStaticParams(): { slug: string }[] {
  return articles.map((article) => ({ slug: article.slug }));
}
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = articles.find((item) => item.slug === params.slug);
  return { title: article?.title ?? 'Article not found', description: article?.intro };
}
export default function ArticlePage({ params }: { params: { slug: string } }): JSX.Element {
  const article = articles.find((item) => item.slug === params.slug);
  if (!article) notFound();
  return (
    <article className="container-shell section max-w-3xl">
      <Link href="/blog" className="text-sm font-semibold text-primary">
        ← Back to the journal
      </Link>
      <p className="eyebrow mt-10">{article.category}</p>
      <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">{article.title}</h1>
      <p className="mt-5 text-sm text-slate-500">
        <time dateTime={article.date}>5 October 2026</time> · {article.minutes} min read
      </p>
      <p className="my-8 text-xl leading-8 text-slate-600">{article.intro}</p>
      <div className="prose-copy">
        {article.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <aside className="mt-12 rounded-card bg-blue-50 p-6 text-sm leading-7 text-slate-700">
        This article is general educational information. Review the regulated lender’s final offer
        and Key Facts Statement for your specific loan.
      </aside>
    </article>
  );
}

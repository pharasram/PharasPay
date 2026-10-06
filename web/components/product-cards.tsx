import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Heart, WalletCards } from 'lucide-react';
import { products } from '@/lib/content';
import { Card } from './ui/card';
export function ProductCards(): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {products.map((product, index) => {
        const Icon = [Heart, BriefcaseBusiness, WalletCards][index];
        return (
          <Card key={product.slug} className="flex flex-col p-7">
            <div className="mb-7 grid size-12 place-items-center rounded-xl bg-blue-50 text-primary">
              <Icon size={24} />
            </div>
            <p className="eyebrow text-[10px]">{product.tag}</p>
            <h3 className="mt-3 text-2xl font-bold">{product.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{product.description}</p>
            {product.available ? (
              <>
                <div className="my-6 border-y border-slate-100 py-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loan amount</span>
                    <span className="font-semibold">₹10K–₹10L</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-slate-500">Interest rate</span>
                    <span className="font-semibold text-primary">8%–12% p.a.</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-slate-500">Tenure</span>
                    <span>6–60 months</span>
                  </div>
                </div>
                <Link
                  href={`/loans/${product.slug}`}
                  className="flex items-center justify-between text-sm font-semibold text-primary"
                >
                  Explore {product.title.toLowerCase()}
                  <ArrowUpRight size={18} />
                </Link>
              </>
            ) : (
              <p className="mt-8 text-sm font-semibold text-slate-500">
                Coming soon · Not open for applications
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

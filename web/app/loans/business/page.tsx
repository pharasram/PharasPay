import type { Metadata } from 'next';
import { ProductDetail } from '@/components/product-detail';
export const metadata: Metadata = { title: 'Business loans' };
export default function Page(): JSX.Element {
  return <ProductDetail business />;
}

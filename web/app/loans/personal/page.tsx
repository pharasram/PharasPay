import type { Metadata } from 'next';
import { ProductDetail } from '@/components/product-detail';
export const metadata: Metadata = { title: 'Personal loans' };
export default function Page(): JSX.Element {
  return <ProductDetail />;
}

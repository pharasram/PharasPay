import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard-nav';
export const metadata: Metadata = {
  title: 'Your dashboard',
  robots: { index: false, follow: false },
};
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session || session.error) redirect('/login');
  return (
    <div className="container-shell py-10">
      <DashboardNav />
      <div className="py-9">{children}</div>
    </div>
  );
}

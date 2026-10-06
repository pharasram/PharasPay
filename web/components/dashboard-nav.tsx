'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, FileText, CreditCard, UserRound, LogOut } from 'lucide-react';
export function DashboardNav(): JSX.Element {
  const path = usePathname();
  const query = useQueryClient();
  return (
    <nav aria-label="Account navigation" className="flex flex-wrap gap-2 border-b pb-5">
      {[
        ['Overview', '/dashboard', LayoutDashboard],
        ['My loan', '/dashboard/loan', FileText],
        ['Repayment', '/dashboard/repayment', CreditCard],
        ['Profile', '/dashboard/profile', UserRound],
      ].map(([label, href, Icon]) => {
        const Component = Icon as typeof LayoutDashboard;
        return (
          <Link
            key={String(href)}
            href={String(href)}
            aria-current={path === href ? 'page' : undefined}
            className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-blue-50 aria-[current=page]:text-primary"
          >
            <Component size={17} />
            {String(label)}
          </Link>
        );
      })}
      <button
        className="ml-auto flex min-h-11 items-center gap-2 px-4 text-sm text-slate-600"
        onClick={() => {
          query.clear();
          void signOut({ callbackUrl: '/login' });
        }}
      >
        <LogOut size={17} />
        Log out
      </button>
    </nav>
  );
}

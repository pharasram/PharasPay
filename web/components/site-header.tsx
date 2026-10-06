'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
export function Brand(): JSX.Element {
  return (
    <Link
      href="/"
      aria-label="PharasPay home"
      className="flex items-center gap-2 text-xl font-bold tracking-tight"
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-xl bg-primary font-heading text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
          <path
            d="M7 19V5h6a4 4 0 0 1 0 8H7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        Pharas<span className="text-primary">Pay</span>
      </span>
    </Link>
  );
}
const links = [
  ['Loans', '/loans'],
  ['EMI calculator', '/calculator'],
  ['About us', '/about'],
  ['Resources', '/blog'],
] as const;
export function SiteHeader(): JSX.Element {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between">
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className="text-sm font-medium text-slate-600 hover:text-primary aria-[current=page]:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <Link className="text-sm font-semibold" href="/login">
            Log in
          </Link>
          <Button asChild>
            <Link href="/apply">
              Apply now <ArrowUpRight size={16} aria-hidden />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          className="lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="container-shell grid gap-1 pb-5 lg:hidden"
        >
          {[...links, ['Log in', '/login'], ['Apply now', '/apply']].map(([label, href]) => (
            <Link
              className="rounded-lg p-3 hover:bg-slate-50"
              onClick={() => setOpen(false)}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

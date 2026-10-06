import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('rounded-card border border-slate-200 bg-white p-6 shadow-card', className)}
      {...props}
    />
  );
}
export function Skeleton({ className }: { className?: string }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none', className)}
    />
  );
}

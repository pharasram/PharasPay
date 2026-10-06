'use client';
import { useState, type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
function SessionTimer(): null {
  const { status } = useSession();
  const pathname = usePathname();
  useEffect(() => {
    if (status !== 'authenticated') return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (): void => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          void signOut({ callbackUrl: '/login?expired=1' });
        },
        15 * 60 * 1000,
      );
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [status, pathname]);
  return null;
}
export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <SessionProvider refetchInterval={300}>
      <QueryClientProvider client={client}>
        <SessionTimer />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}

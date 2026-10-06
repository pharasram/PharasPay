import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { isDemo } from '@/lib/config';
export const metadata: Metadata = { title: 'Log in', robots: { index: false, follow: false } };
export default function LoginPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <AuthForm demo={isDemo()} />
    </div>
  );
}

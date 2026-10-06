import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { isDemo } from '@/lib/config';
export const metadata: Metadata = { title: 'Register', robots: { index: false, follow: false } };
export default function RegisterPage(): JSX.Element {
  return (
    <div className="container-shell section">
      <AuthForm register demo={isDemo()} />
    </div>
  );
}

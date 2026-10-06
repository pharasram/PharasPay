'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { mobileSchema, otpSchema } from '@/lib/schemas';
import { api } from '@/lib/api';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
const schema = z.object({ mobile: mobileSchema, otp: otpSchema });
export function AuthForm({
  register = false,
  demo = false,
}: {
  register?: boolean;
  demo?: boolean;
}): JSX.Element {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: demo ? '9999999999' : '', otp: '' },
  });
  async function send(): Promise<void> {
    if (!(await form.trigger('mobile'))) return;
    setBusy(true);
    setMessage('');
    try {
      await api('otp', { mobile: form.getValues('mobile') });
      setSent(true);
      setMessage(
        demo ? 'Demo OTP: 123456. No SMS was sent.' : 'OTP requested. Check your messages.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function submit(values: z.infer<typeof schema>): Promise<void> {
    setBusy(true);
    const result = await signIn('mobile-otp', { ...values, redirect: false });
    setBusy(false);
    if (result?.ok) {
      router.push(register ? '/apply' : '/dashboard');
      router.refresh();
    } else setMessage('Verification failed. Check the number and OTP, then try again.');
  }
  return (
    <Card className="mx-auto max-w-md p-8">
      <h1 className="text-3xl font-bold">
        {register ? 'Your next chapter starts here.' : 'Welcome back.'}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {register
          ? 'Verify your mobile to begin your application.'
          : 'Sign in securely with a one-time code.'}
      </p>
      {demo && (
        <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          Fictional demo number: 9999999999 · OTP: 123456
        </p>
      )}
      <form className="mt-7 space-y-5" onSubmit={form.handleSubmit(submit)}>
        <div>
          <label className="field-label" htmlFor="login-mobile">
            Mobile number
          </label>
          <Input
            id="login-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            {...form.register('mobile')}
            aria-invalid={!!form.formState.errors.mobile}
          />
          {form.formState.errors.mobile && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {form.formState.errors.mobile.message}
            </p>
          )}
        </div>
        {sent && (
          <div>
            <label className="field-label" htmlFor="login-otp">
              One-time code
            </label>
            <Input
              id="login-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...form.register('otp')}
            />
            {form.formState.errors.otp && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {form.formState.errors.otp.message}
              </p>
            )}
          </div>
        )}
        <p role="status" className="text-sm text-slate-700">
          {message}
        </p>
        {sent ? (
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify and continue'}
          </Button>
        ) : (
          <Button className="w-full" type="button" onClick={() => void send()} disabled={busy}>
            {busy ? 'Requesting code…' : 'Send OTP'}
          </Button>
        )}
        {sent && (
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-primary"
            disabled={busy}
            onClick={() => void send()}
          >
            Request another code
          </button>
        )}
        <p className="text-xs leading-6 text-slate-500">
          Never share your OTP. Sessions expire after 15 minutes of inactivity.
        </p>
      </form>
      {!demo && (
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => void signIn('cognito', { callbackUrl: '/dashboard' })}
        >
          Continue with secure Cognito sign-in
        </Button>
      )}
    </Card>
  );
}

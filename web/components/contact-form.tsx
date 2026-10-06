'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { contactSchema } from '@/lib/schemas';
import { api } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
export function ContactForm(): JSX.Element {
  const [message, setMessage] = useState('');
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: 'Application', message: '' },
  });
  async function submit(values: z.infer<typeof contactSchema>): Promise<void> {
    try {
      const result = await api<{ message?: string }>('contact', values);
      setMessage(result.message ?? 'Your request has been received. Keep a copy for your records.');
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    }
  }
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
      {(['name', 'email'] as const).map((name) => (
        <div key={name}>
          <label className="field-label" htmlFor={`contact-${name}`}>
            {name === 'name' ? 'Your name' : 'Email address'}
          </label>
          <Input
            id={`contact-${name}`}
            type={name === 'email' ? 'email' : 'text'}
            autoComplete={name}
            {...form.register(name)}
          />
          {form.formState.errors[name] && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              {form.formState.errors[name]?.message}
            </p>
          )}
        </div>
      ))}
      <div>
        <label className="field-label" htmlFor="contact-subject">
          How can we help?
        </label>
        <select id="contact-subject" className="input-select" {...form.register('subject')}>
          {['Application', 'Repayment', 'Privacy', 'Complaint', 'Other'].map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="input-select min-h-36"
          maxLength={2000}
          {...form.register('message')}
        />
        {form.formState.errors.message && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {form.formState.errors.message.message}
          </p>
        )}
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Do not include OTPs, Aadhaar numbers, card details, or passwords.
        </p>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          className="mt-1 size-4 accent-primary"
          type="checkbox"
          {...form.register('consent')}
        />
        I consent to using these details to respond to my request.
      </label>
      {form.formState.errors.consent && (
        <p role="alert" className="text-xs text-red-700">
          Please consent to processing this request.
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Sending…' : 'Send request'}
      </Button>
      <p role="status" className="text-sm leading-6 text-slate-700">
        {message}
      </p>
    </form>
  );
}

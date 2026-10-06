import { z } from 'zod';
export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.');
export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP.');
export const applicationSchema = z.object({
  mobile: mobileSchema,
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(150),
  dob: z.string().refine((value) => {
    const date = new Date(value);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
    return !Number.isNaN(date.getTime()) && date <= cutoff && date.getUTCFullYear() >= 1900;
  }, 'You must be at least 18.'),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must have 5 letters, 4 digits and 1 letter.'),
  aadhaarConsent: z
    .boolean()
    .refine((value) => value, 'Consent is required to begin the authorised KYC flow.'),
  kycReference: z.string().min(1, 'Complete KYC verification before continuing.'),
  employment: z.enum(['Salaried', 'Self-employed']),
  income: z.coerce.number().min(1).max(10_000_000),
  account: z.string().regex(/^\d{9,18}$/, 'Enter 9–18 digits.'),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC.'),
  amount: z.coerce.number().min(10_000).max(1_000_000),
  tenure: z.coerce.number().int().min(6).max(60),
  purpose: z.enum(['Education', 'Medical', 'Home improvement', 'Business', 'Other']),
  consent: z.boolean().refine((value) => value, 'Please review and consent to the application.'),
});
export type Application = z.infer<typeof applicationSchema>;
export const stepFields: (keyof Application)[][] = [
  ['mobile'],
  ['name', 'email', 'dob'],
  ['pan', 'aadhaarConsent', 'kycReference'],
  ['employment', 'income'],
  ['account', 'ifsc'],
  ['amount', 'tenure', 'purpose', 'consent'],
];
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(150),
  subject: z.enum(['Application', 'Repayment', 'Privacy', 'Complaint', 'Other']),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
});

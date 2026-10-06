import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBackendSession } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { isDemo, requireProductionConfiguration } from '@/lib/config';
import { applicationSchema, contactSchema, mobileSchema } from '@/lib/schemas';
import { demoDashboard } from '@/lib/demo';
const resources = [
  'otp',
  'dashboard',
  'draft',
  'kyc',
  'application',
  'payment',
  'profile',
  'bank',
  'document',
  'contact',
  'statement',
] as const;
const draftSchema = z.object({
  step: z.number().int().min(1).max(5),
  values: applicationSchema
    .omit({ aadhaarConsent: true, consent: true })
    .partial()
    .extend({ aadhaarConsent: z.boolean().optional(), consent: z.boolean().optional() }),
});
const inputs: Record<string, z.ZodTypeAny> = {
  otp: z.object({ mobile: mobileSchema }),
  draft: draftSchema,
  kyc: z.object({
    pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/),
    consent: z.literal(true),
    reference: z.string().max(200).optional(),
  }),
  application: applicationSchema,
  payment: z.object({
    loanId: z.string().min(1).max(100),
    method: z.enum(['UPI', 'Netbanking', 'Debit card', 'Auto-debit', 'Prepayment']),
  }),
  profile: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(150),
    notifications: z.boolean(),
  }),
  bank: z.object({
    account: z.string().regex(/^\d{9,18}$/),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  }),
  document: z.object({ id: z.enum(['agreement', 'kfs']) }),
  contact: contactSchema,
};
function reply(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function handle(
  request: NextRequest,
  { params }: { params: { resource: string } },
): Promise<NextResponse> {
  try {
    requireProductionConfiguration();
    const resource = params.resource;
    if (!(resources as readonly string[]).includes(resource))
      return reply({ error: 'Not found' }, 404);
    const write = request.method === 'POST';
    if (
      write &&
      request.headers.get('origin') !== new URL(process.env.NEXTAUTH_URL ?? request.url).origin
    )
      return reply({ error: 'Origin rejected' }, 403);
    if (!write && !['dashboard', 'draft', 'statement'].includes(resource))
      return reply({ error: 'Method not allowed' }, 405);
    if (write && !inputs[resource]) return reply({ error: 'Method not allowed' }, 405);
    const session = await getBackendSession();
    if (!['otp', 'contact'].includes(resource) && (!session || session.error))
      return reply({ error: 'Unauthorised' }, 401);
    if (Number(request.headers.get('content-length') ?? 0) > 20_000)
      return reply({ error: 'Too large' }, 413);
    const raw = write ? await request.text() : '';
    if (raw.length > 20_000) return reply({ error: 'Too large' }, 413);
    let unvalidated: unknown;
    try {
      unvalidated = write ? JSON.parse(raw) : undefined;
    } catch {
      return reply({ error: 'Invalid JSON' }, 400);
    }
    const body: unknown = write ? inputs[resource].parse(unvalidated) : undefined;
    if (isDemo()) {
      if (resource === 'otp')
        return reply({
          sent: true,
          message: 'Use the fictional number 9999999999 and OTP 123456.',
        });
      if (resource === 'dashboard') return reply(demoDashboard);
      if (resource === 'draft') {
        // Persist only non-PII progress in demo; personal fields are fictional defaults on resume.
        if (write) {
          const draft = draftSchema.parse(body);
          const response = reply({ saved: true });
          response.cookies.set('pharaspay-demo-step', String(draft.step), {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 86400,
            path: '/',
          });
          return response;
        }
        return reply({
          step: Math.min(
            5,
            Math.max(1, Number(request.cookies.get('pharaspay-demo-step')?.value) || 1),
          ),
          values: {},
          demo: true,
        });
      }
      if (resource === 'kyc')
        return reply({
          verified: true,
          reference: 'DEMO-KYC',
          message: 'Simulated PAN and Aadhaar verification. No real verification occurred.',
        });
      if (resource === 'application')
        return reply({
          id: 'DEMO-APP-24001',
          status: 'Submitted',
          demo: true,
          reasons: ['A real assessment has not been performed.'],
        });
      if (resource === 'payment')
        return reply({ demo: true, message: 'Payment flow simulated. No money moved.' });
      if (resource === 'profile')
        return reply({
          demo: true,
          message: 'Preview updated. No personal information was saved.',
        });
      if (resource === 'bank')
        return reply({
          demo: true,
          message: 'Bank verification simulated. Account details were not saved.',
        });
      if (resource === 'document')
        return reply({
          demo: true,
          content:
            'PHARASPAY DEMO DOCUMENT\nThis sample is not an agreement or a Key Facts Statement. No actual loan exists.\nLoan range: INR 10,000 to 10,00,000. Rate: 8% to 12%. Tenure: 6 to 60 months. Fee: 1% to 2% plus GST.',
        });
      if (resource === 'contact')
        return reply({
          demo: true,
          message: 'Message preview received. This demo does not send messages.',
        });
      if (resource === 'statement') return reply({ demo: true, rows: demoDashboard.payments });
    }
    if (session && !session.serverAccessToken) return reply({ error: 'Session expired' }, 401);
    const key = request.headers.get('idempotency-key') ?? undefined;
    if (
      write &&
      ['application', 'payment'].includes(resource) &&
      (!key || !/^[a-zA-Z0-9-]{16,100}$/.test(key))
    )
      return reply({ error: 'Idempotency key required' }, 400);
    const paths: Record<string, string> = {
      otp: '/auth/otp/request',
      dashboard: '/customers/me/dashboard',
      draft: '/customers/me/application-draft',
      kyc: '/kyc/session',
      application: '/applications',
      payment: '/payments/session',
      profile: '/customers/me/profile',
      bank: '/customers/me/bank-verification',
      document: '/customers/me/document-download',
      contact: '/support/requests',
      statement: '/customers/me/statements',
    };
    const result = await backend(paths[resource], {
      method: request.method,
      body,
      accessToken: session?.serverAccessToken,
      idempotencyKey: key,
    });
    const response = reply(result.data);
    response.headers.set('X-Audit-Id', result.auditId);
    return response;
  } catch (error) {
    return reply(
      { error: error instanceof z.ZodError ? 'Invalid input' : 'Service unavailable' },
      error instanceof z.ZodError ? 400 : 503,
    );
  }
}
export { handle as GET, handle as POST };

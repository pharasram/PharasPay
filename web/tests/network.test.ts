/** @jest-environment node */
import { apiBase, isDemo, requireProductionConfiguration } from '@/lib/config';
import { backend } from '@/lib/backend';
import { api, ApiError, dashboardSchema, getDashboard } from '@/lib/api';
import { demoDashboard } from '@/lib/demo';
const original = process.env;
beforeEach(() => {
  process.env = {
    ...original,
    NODE_ENV: 'test',
    MOCK_API: 'true',
    AWS_REGION: 'ap-south-1',
    API_BASE_URL: 'https://example.execute-api.ap-south-1.amazonaws.com/v1',
  };
  global.fetch = jest.fn();
});
afterAll(() => {
  process.env = original;
});
test('allows only India regional API endpoints', () => {
  expect(apiBase()).toMatch('/v1');
  expect(isDemo()).toBe(true);
  process.env.AWS_REGION = 'us-east-1';
  expect(apiBase).toThrow();
  process.env.AWS_REGION = 'ap-south-1';
  for (const url of [
    'http://example.execute-api.ap-south-1.amazonaws.com',
    'https://example.com',
    'https://user:pass@example.execute-api.ap-south-1.amazonaws.com',
    'https://example.execute-api.ap-south-1.amazonaws.com?a=b',
  ]) {
    process.env.API_BASE_URL = url;
    expect(apiBase).toThrow();
  }
});
test('production fails closed for demo, analytics, secrets and wrong regions', () => {
  requireProductionConfiguration();
  process.env = { ...process.env, NODE_ENV: 'production' };
  expect(isDemo()).toBe(false);
  expect(requireProductionConfiguration).toThrow('Demo');
  process.env.MOCK_API = 'false';
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  process.env.NEXT_PUBLIC_ANALYTICS_APPROVED = 'true';
  expect(requireProductionConfiguration).toThrow('tracking');
  process.env.NEXT_PUBLIC_ANALYTICS_APPROVED = 'false';
  delete process.env.NEXTAUTH_SECRET;
  expect(requireProductionConfiguration).toThrow('secret');
  process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
  process.env.NEXTAUTH_URL = 'http://example.test';
  expect(requireProductionConfiguration).toThrow('HTTPS');
  process.env.NEXTAUTH_URL = 'https://example.test';
  process.env.COGNITO_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/pool';
  expect(requireProductionConfiguration).toThrow('Cognito');
  process.env.COGNITO_ISSUER = 'https://cognito-idp.ap-south-1.amazonaws.com/pool';
  expect(requireProductionConfiguration).not.toThrow();
});
test('backend sends server credentials, requires an audit receipt, and disables caching', async () => {
  (fetch as jest.Mock).mockResolvedValue(
    new Response(JSON.stringify({ saved: true }), { headers: { 'x-audit-id': 'audit-1' } }),
  );
  expect(
    await backend('/draft', {
      method: 'POST',
      body: { amount: 10000 },
      accessToken: 'test-token',
      idempotencyKey: 'key',
    }),
  ).toEqual({ data: { saved: true }, auditId: 'audit-1' });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/v1/draft'),
    expect.objectContaining({
      cache: 'no-store',
      redirect: 'error',
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }),
  );
  (fetch as jest.Mock).mockResolvedValue(new Response('{}'));
  await expect(backend('/dashboard')).rejects.toThrow('audit');
});
test.each([401, 500])(
  'handles backend HTTP %s without exposing response content',
  async (status) => {
    (fetch as jest.Mock).mockResolvedValue(new Response('sensitive response', { status }));
    await expect(backend('/dashboard')).rejects.toThrow(
      status === 401 ? 'Session expired' : 'Service unavailable',
    );
  },
);
test('browser API validates dashboard responses', async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({ data: demoDashboard })));
  const result = await getDashboard();
  expect(result.loanId).toBe('DEMO-24001');
  expect(dashboardSchema.safeParse({ ...demoDashboard, rate: 15 }).success).toBe(false);
  expect(dashboardSchema.safeParse({ ...demoDashboard, reasons: [] }).success).toBe(false);
});
test('browser API posts a request with an idempotency key', async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response('{"data":{"ok":true}}'));
  expect(await api('payment', { method: 'UPI' }, 'unique-key')).toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    '/api/service/payment',
    expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      headers: expect.objectContaining({ 'Idempotency-Key': 'unique-key' }),
    }),
  );
});
test.each([401, 503])('browser API turns HTTP %s into an actionable error', async (status) => {
  (fetch as jest.Mock).mockResolvedValue(new Response('{}', { status }));
  await expect(api('dashboard')).rejects.toBeInstanceOf(ApiError);
});

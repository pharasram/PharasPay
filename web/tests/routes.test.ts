/** @jest-environment node */
import { NextRequest } from 'next/server';
import { getBackendSession } from '@/lib/auth';

import { backend } from '@/lib/backend';
import { GET, POST } from '@/app/api/service/[resource]/route';
import { GET as health } from '@/app/api/health/route';
import { GET as openapiRoute } from '@/app/api/openapi/route';
import { validApplication } from './fixtures';

jest.mock('@/lib/auth', () => ({ getBackendSession: jest.fn() }));
jest.mock('@/lib/backend', () => ({ backend: jest.fn() }));
const original = process.env;
beforeEach(() => {
  process.env = {
    ...original,
    NODE_ENV: 'test',
    MOCK_API: 'true',
    NEXTAUTH_URL: 'http://localhost:3000',
  };
  (getBackendSession as jest.Mock).mockResolvedValue({
    customerId: 'demo',
    serverAccessToken: 'test-token',
  });
  (backend as jest.Mock).mockResolvedValue({ data: { ok: true }, auditId: 'audit-123' });
});
afterAll(() => {
  process.env = original;
});
function request(
  resource: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<Response> {
  const req = new NextRequest(`http://localhost:3000/api/service/${resource}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin: 'http://localhost:3000', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (body === undefined ? GET : POST)(req, { params: { resource } });
}
test('health check distinguishes valid and invalid configuration', () => {
  expect(health().status).toBe(200);
  process.env = { ...process.env, NODE_ENV: 'production' };
  expect(health().status).toBe(503);
});
test('OpenAPI documents customer, authentication and health routes', async () => {
  const specification = await openapiRoute().json();
  expect(specification.openapi).toBe('3.0.3');
  expect(specification.paths['/api/service/application'].post.security).toBeDefined();
  expect(specification.paths['/api/service/otp'].post.security).toBeUndefined();
});
test('rejects unrecognised resources, wrong methods and cross-origin writes', async () => {
  expect((await request('missing')).status).toBe(404);
  expect((await request('otp')).status).toBe(405);
  expect((await request('dashboard', {})).status).toBe(405);
  expect(
    (await request('otp', { mobile: '9999999999' }, { origin: 'https://evil.test' })).status,
  ).toBe(403);
});
test('protects customer data and expires sessions', async () => {
  (getBackendSession as jest.Mock).mockResolvedValue(null);
  expect((await request('dashboard')).status).toBe(401);
  expect((await request('otp', { mobile: '9999999999' })).status).toBe(200);
  (getBackendSession as jest.Mock).mockResolvedValue({ error: 'expired' });
  expect((await request('draft')).status).toBe(401);
});
test('validates payloads, actual size and JSON syntax', async () => {
  expect((await request('otp', { mobile: 'bad' })).status).toBe(400);
  expect((await request('otp', {}, { 'content-length': '30000' })).status).toBe(413);
  expect((await request('otp', { mobile: '9'.repeat(30000) })).status).toBe(413);
  const bad = new NextRequest('http://localhost:3000/api/service/otp', {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    body: '{',
  });
  expect((await POST(bad, { params: { resource: 'otp' } })).status).toBe(400);
});
test('returns explicitly labelled sample dashboard and statement', async () => {
  const data = await (await request('dashboard')).json();
  expect(data.data.demo).toBe(true);
  expect((await (await request('statement')).json()).data.rows).toHaveLength(3);
});
test('persists only progress in demo drafts, clamps manipulated cookies', async () => {
  const saved = await request('draft', { step: 3, values: validApplication });
  expect(saved.headers.get('set-cookie')).toContain('pharaspay-demo-step=3');
  expect(saved.headers.get('set-cookie')).not.toContain('Customer');
  const restored = await request('draft', undefined, { cookie: 'pharaspay-demo-step=999' });
  expect((await restored.json()).data).toEqual({ step: 5, values: {}, demo: true });
  const empty = await request('draft');
  expect((await empty.json()).data.step).toBe(1);
});
test.each([
  ['kyc', { pan: 'ABCDE1234F', consent: true }],
  ['application', validApplication],
  ['payment', { loanId: 'DEMO-1', method: 'UPI' }],
  ['profile', { name: 'Demo', email: 'customer@example.test', notifications: false }],
  ['bank', { account: '123456789012', ifsc: 'DEMO0123456' }],
  ['document', { id: 'kfs' }],
  [
    'contact',
    {
      name: 'Demo',
      email: 'customer@example.test',
      subject: 'Other',
      message: 'Please help with this demo.',
      consent: true,
    },
  ],
])('simulates %s without a real external action', async (resource, body) => {
  const response = await request(String(resource), body);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(backend).not.toHaveBeenCalled();
});
test('forwards live requests only with a token and idempotency key', async () => {
  process.env.MOCK_API = 'false';
  (getBackendSession as jest.Mock).mockResolvedValue({ customerId: 'demo' });
  expect((await request('dashboard')).status).toBe(401);
  (getBackendSession as jest.Mock).mockResolvedValue({
    customerId: 'demo',
    serverAccessToken: 'test-token',
  });
  expect((await request('application', validApplication)).status).toBe(400);
  const response = await request('application', validApplication, {
    'idempotency-key': '12345678-1234-1234-1234-123456789012',
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('x-audit-id')).toBe('audit-123');
  expect(backend).toHaveBeenCalledWith(
    '/applications',
    expect.objectContaining({ accessToken: 'test-token' }),
  );
});
test('live public requests work without an authenticated user and backend failures are redacted', async () => {
  process.env.MOCK_API = 'false';
  (getBackendSession as jest.Mock).mockResolvedValue(null);
  expect((await request('otp', { mobile: '9999999999' })).status).toBe(200);
  (backend as jest.Mock).mockRejectedValue(new Error('private details'));
  const result = await request('otp', { mobile: '9999999999' });
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain('private details');
});

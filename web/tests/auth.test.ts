/** @jest-environment node */
import { authOptions, getBackendSession } from '@/lib/auth';
import { getServerSession } from 'next-auth';
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
import { backend } from '@/lib/backend';
jest.mock('@/lib/backend', () => ({ backend: jest.fn() }));
const original = process.env;
const provider = authOptions.providers[0] as unknown as {
  options: { authorize: (credentials: Record<string, string>) => Promise<{ id: string } | null> };
};
beforeEach(() => {
  process.env = { ...original, NODE_ENV: 'test', MOCK_API: 'true' };
});
afterAll(() => {
  process.env = original;
});
test('demo authentication accepts only the documented fictional identity', async () => {
  expect(await provider.options.authorize({ mobile: '9999999999', otp: '123456' })).toEqual({
    id: 'demo-customer',
    name: 'Demo customer',
  });
  expect(await provider.options.authorize({ mobile: '9999999999', otp: '000000' })).toBeNull();
  await expect(provider.options.authorize({ mobile: 'bad', otp: '123456' })).rejects.toThrow();
});
test('live OTP verifies using the backend, never the demo code', async () => {
  process.env.MOCK_API = 'false';
  (backend as jest.Mock).mockResolvedValue({
    data: { userId: 'live-id', accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600 },
  });
  expect(await provider.options.authorize({ mobile: '9999999999', otp: '123456' })).toEqual(
    expect.objectContaining({ id: 'live-id' }),
  );
});
test('JWT callbacks keep tokens out of the browser session', async () => {
  const jwt = authOptions.callbacks!.jwt!;
  const token = await jwt({
    token: {},
    user: { id: 'id', accessToken: 'private', refreshToken: 'private-refresh', expiresIn: 3600 },
  } as never);
  expect(token.accessToken).toBe('private');
  const session = await authOptions.callbacks!.session!({
    session: { expires: 'future' },
    token,
  } as never);
  expect(session).not.toHaveProperty('accessToken');
  expect(session).toHaveProperty('customerId', 'id');
  expect(await authOptions.callbacks!.signIn!({} as never)).toBe(true);
});
test('Cognito account expiry is respected and unchanged tokens survive', async () => {
  const token = await authOptions.callbacks!.jwt!({
    token: {},
    user: { id: 'id' },
    account: { access_token: 'cognito', refresh_token: 'refresh', expires_at: 9999999999 },
  } as never);
  expect(token.accessExpires).toBe(9999999999000);
  expect(await authOptions.callbacks!.jwt!({ token } as never)).toEqual(token);
  const session = await authOptions.callbacks!.session!({
    session: {},
    token: { sub: 'subject', error: 'SessionExpired' },
  } as never);
  expect(session).toHaveProperty('customerId', 'subject');
});
test('refreshes expired credentials and fails closed on refresh error', async () => {
  process.env.MOCK_API = 'false';
  const stale = { accessToken: 'old', refreshToken: 'refresh', accessExpires: 0 };
  (backend as jest.Mock).mockResolvedValueOnce({
    data: { userId: 'id', accessToken: 'new', refreshToken: 'new-refresh', expiresIn: 300 },
  });
  const updated = await authOptions.callbacks!.jwt!({ token: { ...stale } } as never);
  expect(updated.accessToken).toBe('new');
  (backend as jest.Mock).mockRejectedValueOnce(new Error('expired'));
  const failed = await authOptions.callbacks!.jwt!({ token: { ...stale } } as never);
  expect(failed.accessToken).toBeUndefined();
  expect(failed.error).toBe('SessionExpired');
});
test('structured auth logs omit error details', () => {
  const output = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  authOptions.logger!.error!('SESSION_ERROR', new Error('redacted'));
  authOptions.logger!.warn!('NO_SECRET');
  authOptions.logger!.debug!('DEBUG', {});
  expect(output).toHaveBeenCalledWith(expect.stringContaining('auth_error'));
  output.mockRestore();
});
test('BFF session reads the refreshed token only inside its private server callback', async () => {
  (getServerSession as jest.Mock).mockImplementation(async (options) =>
    options.callbacks.session({
      session: { expires: 'future' },
      token: { sub: 'id', accessToken: 'fresh-token' },
    }),
  );
  const session = await getBackendSession();
  expect(session?.serverAccessToken).toBe('fresh-token');
  expect(session?.customerId).toBe('id');
});

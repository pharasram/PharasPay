import { apiBase } from './config';
export interface BackendResponse<T> {
  data: T;
  auditId: string;
}
export async function backend<T>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string; idempotencyKey?: string } = {},
): Promise<BackendResponse<T>> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 ? 'Session expired.' : 'Service unavailable. Please try again.',
    );
  const auditId = response.headers.get('x-audit-id');
  if (!auditId) throw new Error('The service did not confirm its audit record.');
  return { data: (await response.json()) as T, auditId };
}

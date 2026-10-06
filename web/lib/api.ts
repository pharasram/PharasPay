import { z } from 'zod';
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  resource: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const response = await fetch(`/api/service/${resource}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok)
    throw new ApiError(
      response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : 'We could not complete this request. Please try again.',
      response.status,
    );
  const payload = (await response.json()) as { data: T };
  return payload.data;
}
export const dashboardSchema = z.object({
  demo: z.boolean(),
  loanId: z.string(),
  amount: z.number().min(10_000).max(1_000_000),
  tenure: z.number().int().min(6).max(60),
  rate: z.number().min(8).max(12),
  feePercent: z.number().min(1).max(2),
  outstanding: z.number().nonnegative(),
  paidMonths: z.number().int().nonnegative(),
  nextDue: z.string(),
  creditScore: z.number().nullable(),
  reasons: z.array(z.object({ code: z.string(), text: z.string() })).min(1),
  payments: z.array(
    z.object({ id: z.string(), date: z.string(), amount: z.number(), status: z.string() }),
  ),
  profile: z.object({
    name: z.string(),
    email: z.string(),
    bank: z.string(),
    maskedAccount: z.string(),
  }),
});
export type DashboardData = z.infer<typeof dashboardSchema>;
export async function getDashboard(): Promise<DashboardData> {
  return dashboardSchema.parse(await api('dashboard'));
}

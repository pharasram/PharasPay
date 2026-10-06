export function isDemo(): boolean {
  return process.env.MOCK_API === 'true' && process.env.NODE_ENV !== 'production';
}
export function apiBase(): string {
  const region = process.env.AWS_REGION;
  if (region !== 'ap-south-1' && region !== 'ap-south-2')
    throw new Error('Unsupported data region.');
  const url = new URL(process.env.API_BASE_URL ?? '');
  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith(`.execute-api.${region}.amazonaws.com`) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Configure a regional HTTPS API Gateway endpoint.');
  return url.href.replace(/\/$/, '');
}
export function requireProductionConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.MOCK_API === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true')
    throw new Error('Demo mode is prohibited in production.');
  if (process.env.NEXT_PUBLIC_ANALYTICS_APPROVED === 'true')
    throw new Error('Direct GA4 and Meta tracking cannot satisfy the India-only storage policy.');
  apiBase();
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32)
    throw new Error('A deployment secret is required.');
  const authUrl = new URL(process.env.NEXTAUTH_URL ?? '');
  if (authUrl.protocol !== 'https:') throw new Error('HTTPS authentication URL required.');
  const issuer = new URL(process.env.COGNITO_ISSUER ?? '');
  if (
    issuer.protocol !== 'https:' ||
    issuer.hostname !== `cognito-idp.${process.env.AWS_REGION}.amazonaws.com`
  )
    throw new Error('Cognito must use the configured India region.');
}

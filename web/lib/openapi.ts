const secured = [{ sessionCookie: [] }];
const response = {
  description: 'JSON data envelope; errors contain no private details',
  content: {
    'application/json': { schema: { type: 'object', properties: { data: { type: 'object' } } } },
  },
};
const operation = (
  summary: string,
  schema?: Record<string, unknown>,
  auth = true,
): Record<string, unknown> => ({
  summary,
  ...(auth ? { security: secured } : {}),
  ...(schema
    ? { requestBody: { required: true, content: { 'application/json': { schema } } } }
    : {}),
  responses: {
    '200': response,
    '400': { description: 'Invalid request' },
    '401': { description: 'Session expired or absent' },
    '403': { description: 'Origin rejected' },
    '413': { description: 'Request body too large' },
    '503': { description: 'Service unavailable or missing audit receipt' },
  },
});
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
): Record<string, unknown> => ({ type: 'object', properties, required });
const string = { type: 'string' };
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'PharasPay Web BFF',
    version: '1.0.0',
    description:
      'Session-protected proxy to India-region FastAPI services. All successful live backend responses must include X-Audit-Id. POSTs require same-origin requests. Demo is development-only.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: '__Secure-next-auth.session-token',
        description:
          'Encrypted HttpOnly NextAuth JWT cookie. Local HTTP uses next-auth.session-token.',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Readiness and deployment configuration check',
        responses: { '200': response, '503': { description: 'Configuration incomplete' } },
      },
    },
    '/api/openapi': { get: { summary: 'This OpenAPI document', responses: { '200': response } } },
    '/api/service/otp': {
      post: operation(
        'Request Cognito-backed mobile OTP',
        object({ mobile: { type: 'string', pattern: '^[6-9][0-9]{9}$' } }),
        false,
      ),
    },
    '/api/service/dashboard': {
      get: operation('Get own loan summary, SHAP reason codes and payments'),
    },
    '/api/service/draft': {
      get: operation('Load own application draft'),
      post: operation(
        'Save own draft; demo stores only a non-PII progress marker',
        object({
          step: { type: 'integer', minimum: 1, maximum: 5 },
          values: {
            type: 'object',
            description:
              'Partial application fields; production KMS encryption is enforced by backend',
          },
        }),
      ),
    },
    '/api/service/kyc': {
      post: operation(
        'Start or check authorised PAN/Aadhaar KYC',
        object(
          {
            pan: { type: 'string', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$' },
            consent: { type: 'boolean', enum: [true] },
            reference: { type: 'string' },
          },
          ['pan', 'consent'],
        ),
      ),
    },
    '/api/service/application': {
      post: {
        ...operation(
          'Submit application; backend rechecks identity, consent, affordability and ownership',
          object({
            mobile: string,
            name: string,
            email: { type: 'string', format: 'email' },
            dob: { type: 'string', format: 'date' },
            pan: string,
            aadhaarConsent: { type: 'boolean', enum: [true] },
            kycReference: string,
            employment: { type: 'string', enum: ['Salaried', 'Self-employed'] },
            income: { type: 'number', minimum: 1 },
            account: string,
            ifsc: string,
            amount: { type: 'number', minimum: 10000, maximum: 1000000 },
            tenure: { type: 'integer', minimum: 6, maximum: 60 },
            purpose: {
              type: 'string',
              enum: ['Education', 'Medical', 'Home improvement', 'Business', 'Other'],
            },
            consent: { type: 'boolean', enum: [true] },
          }),
        ),
        parameters: [
          {
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
            schema: { type: 'string', minLength: 16, maxLength: 100 },
          },
        ],
      },
    },
    '/api/service/payment': {
      post: {
        ...operation(
          'Create gateway, mandate or prepayment session; backend calculates amount',
          object({
            loanId: string,
            method: {
              type: 'string',
              enum: ['UPI', 'Netbanking', 'Debit card', 'Auto-debit', 'Prepayment'],
            },
          }),
        ),
        parameters: [
          {
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
            schema: { type: 'string', minLength: 16, maxLength: 100 },
          },
        ],
      },
    },
    '/api/service/profile': {
      post: operation(
        'Update own profile and optional notifications',
        object({
          name: string,
          email: { type: 'string', format: 'email' },
          notifications: { type: 'boolean' },
        }),
      ),
    },
    '/api/service/bank': {
      post: operation(
        'Request bank ownership verification',
        object({
          account: { type: 'string', pattern: '^[0-9]{9,18}$' },
          ifsc: { type: 'string', pattern: '^[A-Z]{4}0[A-Z0-9]{6}$' },
        }),
      ),
    },
    '/api/service/document': {
      post: operation(
        'Get own audited regional S3 document download',
        object({ id: { type: 'string', enum: ['agreement', 'kfs'] } }),
      ),
    },
    '/api/service/statement': { get: operation('Get own statement rows for CSV export') },
    '/api/service/contact': {
      post: operation(
        'Create a support/privacy/grievance request',
        object({
          name: string,
          email: { type: 'string', format: 'email' },
          subject: {
            type: 'string',
            enum: ['Application', 'Repayment', 'Privacy', 'Complaint', 'Other'],
          },
          message: { type: 'string', minLength: 10, maxLength: 2000 },
          consent: { type: 'boolean', enum: [true] },
        }),
        false,
      ),
    },
    '/api/auth/session': {
      get: operation(
        'NextAuth session metadata; never exposes access/refresh tokens',
        undefined,
        false,
      ),
    },
    '/api/auth/csrf': { get: operation('Get NextAuth CSRF token', undefined, false) },
    '/api/auth/providers': {
      get: operation('List configured NextAuth providers', undefined, false),
    },
    '/api/auth/signin/{provider}': {
      post: {
        ...operation(
          'Start NextAuth sign-in with CSRF token',
          object({ csrfToken: string, callbackUrl: string }),
          false,
        ),
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/auth/callback/{provider}': {
      post: {
        ...operation(
          'Verify mobile OTP callback with CSRF token',
          object({ csrfToken: string, mobile: string, otp: string }),
          false,
        ),
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string' } }],
      },
      get: {
        ...operation('Cognito OAuth callback; NextAuth validates state and PKCE', undefined, false),
        parameters: [{ in: 'path', name: 'provider', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/auth/signout': {
      post: operation(
        'Clear NextAuth session with CSRF protection',
        object({ csrfToken: string, callbackUrl: string }),
      ),
    },
  },
};

# Web integration contract

The web project is a BFF (backend for frontend), not a lending backend. Local development has an explicit fictional demo. Live mode forwards requests to a regional API Gateway endpoint over HTTPS, rejects redirects, applies a 15-second timeout, and requires an `X-Audit-Id` receipt. A receipt is a contract with the backend, not proof by itself that storage is immutable.

OpenAPI: `GET /api/openapi`. Readiness: `GET /api/health`.

## Authentication

NextAuth v4 manages encrypted HttpOnly, SameSite session cookies. The cookie contains provider tokens; `/api/auth/session` returns customer ID and expiry metadata only. Cognito uses an India-region user pool. The mobile OTP provider expects these endpoints:

| Endpoint                 | Request          | Response body                                    |
| ------------------------ | ---------------- | ------------------------------------------------ |
| `POST /auth/otp/request` | `{mobile}`       | `{sent: true}`                                   |
| `POST /auth/otp/verify`  | `{mobile, otp}`  | `{userId, accessToken, refreshToken, expiresIn}` |
| `POST /auth/refresh`     | `{refreshToken}` | Same verified token response                     |

The backend must implement Cognito challenge issuance/verification, single-use OTPs, expiry, attempt limits, rate limits by identity and source, and account-enumeration protection. Fixed OTP `123456` is available only with `MOCK_API=true` and a non-production runtime; it accepts only `9999999999`. Production configuration explicitly rejects demo mode. No real SMS is sent in the demo.

## Customer resources

| BFF resource | Backend path                      | Method     |
| ------------ | --------------------------------- | ---------- |
| dashboard    | `/customers/me/dashboard`         | GET        |
| draft        | `/customers/me/application-draft` | GET / POST |
| kyc          | `/kyc/session`                    | POST       |
| application  | `/applications`                   | POST       |
| payment      | `/payments/session`               | POST       |
| profile      | `/customers/me/profile`           | POST       |
| bank         | `/customers/me/bank-verification` | POST       |
| document     | `/customers/me/document-download` | POST       |
| statement    | `/customers/me/statements`        | GET        |
| contact      | `/support/requests`               | POST       |

Customer identity always comes from the verified Cognito bearer token. Never trust an ID, mobile number, KYC reference, loan ID or account supplied in a body without checking ownership. POSTs require the site's exact Origin and valid Zod payloads; application/payment require an idempotency key. The backend must atomically commit each mutation and its audit/outbox record before returning success. Retrying the same idempotency key must return the same result. Use WAF and durable DynamoDB throttling for unauthenticated OTP/contact/auth endpoints.

Dashboard response schema lives in `lib/api.ts`. It requires amount ₹10,000–₹10,00,000, 6–60 months, rate 8%–12%, fee 1%–2%, and at least one explanatory reason. Live reasons must be generated from the versioned model's SHAP contributions, not the demo strings. Lender-signed KFS/agreement are authoritative; calculated dashboard APR is an illustration based on regular monthly repayments and an upfront fee deduction.

KYC accepts `{pan, consent:true, reference?}`. Start returns `{verified:false, reference, redirectUrl}`; the approved authorised provider handles Aadhaar/OTP. Subsequent calls with the reference must check status server-side and return `{verified:true, reference}` only after completion. The application endpoint must independently verify that reference and consent. Never return raw Aadhaar or biometric data.

Payments accept `{loanId, method}` and return `{redirectUrl}` for an approved HTTPS gateway origin. The backend determines the amount and validates lender ownership. A browser redirect is not payment success: signed gateway webhooks and reconciliation are required. Auto-debit and prepayment use the same service contract and require explicit confirmation at the provider.

Documents accept `agreement` or `kfs` and return a short-lived presigned HTTPS URL in `bucket.s3.ap-south-1.amazonaws.com` or Hyderabad. Backend checks ownership and audits issuance. Statements return `{rows:[{id,date,amount,status}]}` for CSV download. Restrict production CSV text fields to safe enumerations/references; the frontend also escapes spreadsheet formula prefixes.

## Data and audit obligations

- Aurora/DynamoDB/S3 and logs in ap-south-1 or ap-south-2 only; KMS encryption, private networking, TLS 1.2+, least-privilege IAM.
- Immutable backend audit records (for example, S3 Object Lock retention) for access and mutations. Never log bodies, OTPs, PAN, account numbers, tokens or names.
- Store application drafts in the backend encrypted with KMS. Browser storage contains no application PII. Local demo retains only a step number, then restores fictional defaults and reconfirms consent.
- Configure explicit retention and consent versions, DSAR/correction/deletion handling, breach response, signed document delivery, cooling-off handling and grievance service before onboarding real customers.
- Inject secrets from AWS Secrets Manager at runtime. `.env.local` is an ignored local development convenience, never a production secret delivery mechanism.

The browser cannot prove regulatory compliance, execute SHAP, provide immutable cloud audit storage, or perform authorised Aadhaar verification by itself. These contracts must be implemented and integration-tested with the regulated lender before live use.

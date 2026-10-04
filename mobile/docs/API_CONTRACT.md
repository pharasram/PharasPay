# Mobile backend integration contract

This client does not deploy a lending backend. Live mode uses a versioned mobile BFF in AWS ap-south-1 or ap-south-2. Implement these operations in FastAPI with Pydantic v2 models and publish OpenAPI. Server enforcement is mandatory; client validations are not an authorization boundary.

All JSON actions use `POST /mobile/actions/{action}` with JWT authorization except `otp`, `login`, `register`. Each write has an `Idempotency-Key`. The backend must scope idempotency to user + operation, validate Cognito JWT issuer/audience/expiry, authorize object ownership, and commit an immutable audit event with the transaction before returning success. Use an outbox and S3 Object Lock / KMS for archival. Demo audit is only an in-memory fixture and is not immutable.

| Action | Request | Response |
|---|---|---|
| otp | mobile, consentVersion | sent |
| login / register | mobile, otp | access, refresh |
| profile / saveProfile | empty / name, email, notifications | Profile JSON |
| bank | account, ifsc | Profile with bankMasked after provider verification |
| consent | scope, version, granted | recorded |
| pan | pan | verified |
| aadhaarOtp | aadhaar | sent; keep challenge bound to authenticated session |
| aadhaar | otp | verified; never accept OTP without session challenge |
| liveness | provider challenge evidence | verified only after provider server validation |
| apply | amount, months, purpose, consentVersion | Offer JSON |
| offer | empty | Offer JSON or null |
| accept / reject | empty | accepted / rejected |
| esignOtp | empty | sent; bound to agreement hash, user and expiry |
| esign | otp, consent | signed only after provider confirmation |
| dashboard | empty | active, outstanding, next Installment or null, creditScore or null |
| schedule | empty | Installment array |
| history | empty | Payment array |
| pay | id, method | status + provider checkout session; settlement server-confirmed |
| prepaymentQuote | empty | id, amount, fee, expiry |
| prepay | quoteId, method | status + provider checkout session |
| autodebit | consent | mandate authorization session, status |
| support | message | case reference |
| deleteRequest | request | recorded; process access/deletion rights with lawful retention |
| logout | empty | recorded + revoke session/refresh tokens |

Additional endpoints:

- `POST /auth/refresh`: `{refresh_token}` → `{access,refresh}`, rotate refresh token and detect replay.
- `POST /auth/session`: confirm active session after local biometrics. Biometrics do not replace server authorization.
- `POST /mobile/kyc/selfie`: multipart `selfie`, max 5 MB. Strip metadata; validate file signatures, scan, encrypt and bind upload to the authenticated KYC challenge. Store only India-region S3 with SSE-KMS.
- `GET /mobile/documents/{offer|agreement|statement}`: authenticated `application/pdf`, immutable lender-issued document with no third-party URL redirect. Signed agreement includes cryptographic provider evidence.
- `GET /health`: service readiness without sensitive details.

The model definitions in `lib/shared/models/models.dart` define JSON shapes. Offer must include a valid 8–12% annual rate, 1–2% processing fee, authoritative APR, regulated lender identity, cooling-off days, agreement and nonempty SHAP reason codes generated from the actual decision. Reject client-selected rates, fees, scores, verification state, payment success or liveness claims.

Use 400 for validation, 401 for expired authorization, 403 for forbidden operations, 409 for state conflicts, 422 for invalid business terms and 429 with Retry-After for throttling. OTP request/verification must be rate limited, expire in minutes, be single-use and resistant to enumeration. No PII or secrets in mobile or backend diagnostics.

Production integration boundaries still needed: Aadhaar authorized entity, PAN provider, active liveness SDK, legally valid e-sign provider, payment checkout and mandate SDK. The client currently supports the mock journey and API transport; it does not embed any commercial provider SDK. The constant sample liveness challenge must never be accepted in live mode. Checkout results must never mark an EMI paid without verified server settlement.

AWS configuration cannot be proved by a client `AWS_REGION` define: deployment policy, KMS keys, Cognito pools, logs, backups, disaster recovery and all processors require separate infrastructure enforcement. Secrets are fetched by backend from Secrets Manager; never ship AWS credentials or provider keys in the app.

# PharasPay customer website

Next.js **14.2.35 App Router**, strict TypeScript, React 18, Tailwind CSS, shadcn-style Radix primitives, React Hook Form/Zod, TanStack Query, NextAuth/Cognito, and Framer Motion.

## Folder structure

```text
web/
  app/
    page.tsx                     Home
    loans/{personal,business}/   Products and comparison
    calculator/                 EMI, APR, amortisation, export
    about/ contact/ faq/         Company and support
    blog/[slug]/                Journal and articles
    legal/                      Terms, privacy, RBI disclosures
    apply/ login/ register/     Six-step application and OTP
    dashboard/                  Protected overview
      loan/ repayment/ profile/
    api/                        Auth, service proxy, health, OpenAPI
  components/                   Shared interactive features
    ui/                         Button, input, card, skeleton, accordion
  lib/                          Rules, schemas, calculations, auth, API, demo
  tests/                        Jest unit, component, and route tests
  docs/                         API contract, deployment, verification
  tool/                         Local setup, launcher, deployment preflight
  .env.example
  amplify.yml
  vercel.json
  pnpm-lock.yaml
```

## Code and behaviour

- Home, personal/business products, comparison, eligibility, documents, responsive navigation and all requested public routes.
- Calculator supports ₹10,000–₹10,00,000; 6–60 months; annual interest 8%–12%. Processing fees are 1%–2% + GST. It includes a reducing-balance schedule, net disbursal, fee/GST breakdown, a cash-flow APR illustration, CSV, shareable links, and browser print/PDF.
- Application: OTP → details → authorised PAN/Aadhaar KYC → employment → bank → review. Server validation, idempotent submission and a backend draft contract. Browser storage does not persist application PII.
- Dashboard: protected on the server, loan summary, EMI schedule, payment history, statements, document vault, profile/notifications, bank verification, payment/mandate/prepayment service interfaces.
- Accessible labels, keyboard-operable accordion, focus states, skip link, error/status announcements, reduced-motion support and skeleton loading.
- Local font packages avoid Google Fonts requests. Metadata, OpenGraph, sitemap, robots, error and not-found pages are included.
- API health at `/api/health`; OpenAPI at `/api/openapi`. The [API contract](docs/API_CONTRACT.md) describes the backend requirements.

Demo is a frontend development experience, not a live lending system. All balances, scores, KYC, application results, payments, and documents are explicitly simulated. The sample OTP is never accepted by production mode.

## Tests

```sh
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm format:check
pnpm build
```

Jest enforces at least **80% lines, statements, functions and branches** across authored business logic, interactive components and page/route modules. Root document/font wiring is verified by build/runtime checks rather than unit coverage; the OpenGraph image is a static asset. See [verification](docs/VERIFICATION.md) for measured results and remaining checks.

## Run locally

Install Node.js 22 or newer and pnpm. From this repository:

```sh
cd web
corepack enable
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

Open **http://localhost:3000**. `pnpm setup` creates an ignored `.env.local` with a randomly generated development secret; it preserves an existing file and never prints the secret.

On the configured Windows machine, double-click **`run-website.cmd`** in the repository root, or use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\web\tool\run-local.ps1
```

The launcher uses the installed dependencies and can find the bundled Node runtime even if Node is not on the normal terminal PATH.

Demo login:

```text
Mobile: 9999999999
OTP:    123456
```

Only use fictional information. Demo draft storage retains a progress marker only; it intentionally does not save identity/bank fields. Production drafts require the encrypted backend. The development email `customer@example.test`, PAN `ABCDE1234F`, and bank details are fictional placeholders.

Keep `NEXTAUTH_URL` and the browser origin identical. If using another port, update both `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL`, then restart. A mismatched origin causes POST requests to be rejected. If the port is busy, stop the other server or run `pnpm dev --port 3001` after updating those URLs.

## Production and deployment

```sh
pnpm build
pnpm start
```

Production **refuses demo mode**, missing secrets, non-HTTPS auth, API/Cognito outside the configured India region, and direct GA4/Meta tracking. Set the live environment before building/deploying. The local development `.env.local` must not be copied into a production artifact.

See [deployment instructions](docs/DEPLOYMENT.md) for Vercel and AWS Amplify, required backend integration, secret delivery, and the India-residency limitations of global hosting. Nothing has been deployed or published by this build task.

## Launch boundaries

The lender identity, grievance contacts, ISO certificate, and real customer testimonials have not been supplied. The site labels their status honestly; it does not claim RBI endorsement or invent certifications/reviews. Legal pages are explicit review drafts.

GA4 and Meta Pixel adapters are present for development integration tests and opt-in consent. They are **blocked in production** because their direct collection conflicts with the master requirement that all data stay in the specified AWS India regions. Consent alone does not resolve data residency. Use an approved India-hosted analytics design before enabling real analytics.

Live KYC, credit decisions/SHAP, e-sign, payment reconciliation, immutable audits, KMS storage, OTP throttling, and rights/retention workflows belong to the integrated backend and regulated lender. This project implements the frontend and server proxy contract; it does not substitute a mock for those services.

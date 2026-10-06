# Verification record

Verified locally on Windows, 2026-10-05, using Node.js 24.19.0 and pnpm 11.19.0.

## Automated checks

- Jest: **10 suites, 113 tests passed**.
- Coverage: **95.40% lines, 92.97% statements, 96.09% functions, 84.51% branches**. All four enforced 80% thresholds pass.
- Next.js production build: passed, including TypeScript and ESLint checks, with 30 generated static pages/assets plus dynamic routes.
- Prettier: passed.
- Coverage includes authored libraries, interactive components and page/API modules. Root layout/font wiring is checked by the production build; the social preview is a static PNG.

Tests cover product limits, EMI/amortisation/APR calculations, input validation, CSV injection prevention, OTP/session handling, refresh-token isolation, API resource/method restrictions, origin checks, request size limits, idempotency requirements, application steps, draft resume, dashboard views, profile forms, navigation, consent and session expiry.

## Browser and performance checks

The local fictional OTP login and protected dashboard were exercised in the in-app browser. On 2026-10-06, the restarted demo completed all six application steps, simulated KYC and submission, displaying reference `DEMO-APP-24001`. The browser check caught premature validation when entering review; distinct button keys and preventing the navigation click's default action fixed it. The nine form tests passed after adding a regression assertion. No real identity verification or loan was created.

Lighthouse uses the optimized production build, mobile simulated throttling, and headless Chrome at loopback port 4000. Reports are written to the ignored `test-results/` directory. These are local homepage measurements, not a guarantee for every page or the final hosting environment. Automated accessibility checks do not replace screen-reader and manual WCAG evaluation.

Final homepage Lighthouse scores: **Performance 93, Accessibility 100, Best practices 100, SEO 100**. First contentful paint: 1.7 s; largest contentful paint: 3.1 s. The initial run found low contrast and a logo label mismatch; both were corrected. Font preloading and smaller local font selection improved the performance score from 82 to 93. The affected public-page tests were rerun: 19 passed.

## Release status

**Local development only. Not approved for public release.** The production dependency audit still reports 2 critical, 8 high, 11 moderate and 2 low advisories with the mandated Next.js 14.2.35. The PostCSS override resolves its reported issues; disabling image optimization does not fix the remaining Next.js vulnerabilities. The full audit is in `dependency-audit.json`. Hosting build configurations include a failing security gate until the dependencies are fixed.

A patched major-version upgrade requires resolution of the explicit Next.js 14 requirement. Real lending also requires the regional backend integrations, lender/legal details, approved KYC/payment providers, Secrets Manager runtime delivery, immutable audits, KMS/TLS infrastructure and data-residency verification described in the API and deployment documents. No production deployment, real KYC, payment, credit decision or compliance certification was performed.

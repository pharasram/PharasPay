# Deployment

## Release blocked: framework security

The 2026-10-05 production dependency audit reports **2 critical, 8 high, 11 moderate and 2 low** advisories with Next.js 14.2.35. In particular, [Windows-hosted remote code execution](https://github.com/advisories/GHSA-p293-qw3h-jr36) has no workaround in 14.x. The image optimizer is disabled, but that does not resolve the other framework vulnerabilities. Keep this version on loopback for development. Upgrade to a supported, patched major and repeat all checks before public deployment; approval to change the explicit Next.js 14 requirement is pending. Both hosting configurations run `pnpm security:check` and will fail on the current high/critical findings.

## Environment

Use Node.js 22+ and the pinned pnpm version in package.json. Install with the lockfile, run typecheck/lint/Jest coverage, then `pnpm build`.

Set `MOCK_API=false`, `NEXT_PUBLIC_DEMO_MODE=false`, `NEXT_PUBLIC_ANALYTICS_APPROVED=false`, and `NEXT_TELEMETRY_DISABLED=1` for production. Configure canonical HTTPS site/auth URLs, `AWS_REGION=ap-south-1` or `ap-south-2`, and a regional API Gateway base URL. Configure a Cognito pool/client in the same region, its hosted UI, and callback `https://YOUR_HOST/api/auth/callback/cognito`. The mobile OTP backend must use Cognito challenges.

Use an independently generated NextAuth secret of at least 32 characters. Store NextAuth and Cognito client secrets in **AWS Secrets Manager**, encrypted with KMS. Inject them at runtime using a least-privilege compute role/bootstrap. Never expose them as `NEXT_PUBLIC_*`, commit them, log them, or write them to public build artifacts. Public gateway origins are configured in `NEXT_PUBLIC_PAYMENT_ORIGIN` and `NEXT_PUBLIC_KYC_ORIGIN` only after approval of those integrations.

Run `node tool/check-production.mjs` with the production environment. `/api/health` additionally verifies the regional API and Cognito hosts. This validates application configuration; it is not a cloud compliance certificate.

## AWS Amplify

1. Choose **Mumbai** in AWS and connect the repository/branch in Amplify Hosting. Select the `web` monorepo app root. Use `web/amplify.yml` as the build specification (the console may require copying it into the build settings).
2. Select a supported Node 22+ build image. Configure non-sensitive public build variables and regional backend endpoints. Do not commit `.env.local` or dump all build environment variables into an artifact.
3. Amplify build variables and SSR runtime variables are separate. Make only the required non-secret configuration available to SSR. Use an SSR compute IAM role plus an approved runtime Secrets Manager loader/injection mechanism for secrets; this repository does not provision that cloud bootstrap. Do not promote a build without verified runtime secret delivery.
4. Configure the custom HTTPS domain, Cognito callback/sign-out URLs, regional backend IAM/network policy, WAF rate limits, and health monitoring. Cache only public assets/pages. Auth, application, profile, documents and API responses must be private/no-store.
5. Verify the actual locations of SSR compute, log groups, deployment artifacts, caches, backups and third-party processing. Amplify uses a global CDN; a regional project selection alone does not prove compliance with the master requirement. Keep real-customer flows disabled until the entire path is verified. If global delivery cannot meet the requirement, host the full application behind a regional ALB on ECS in Mumbai/Hyderabad instead.
6. After backend integration, test OTP expiry/replay/throttling, session expiry, draft isolation, KYC reference ownership, server-calculated payment amounts, payment webhooks, duplicate requests, SHAP reasons, signed documents, immutable audit records, and privacy rights end-to-end.

Official references: [Next.js support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html), [SSR environment configuration](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html), [SSR features](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-supported-features.html).

## Vercel

1. Import the repository and set **Root Directory = web**. The included `vercel.json` uses Next.js, the lockfile install, and Mumbai function region `bom1`.
2. Set canonical site URL and public build configuration. Run the same CI checks before allowing promotion. Preview deployments must not be connected to real customer data.
3. Mumbai function placement controls compute placement, not the location of every platform log, CDN cache, backup or subprocess. Vercel is not an AWS-account deployment limited to the two required regions. Therefore use this route for public, non-sensitive design previews only unless the master residency constraint is explicitly changed and the complete data flow is approved.
4. Production mode deliberately disables demo login. Do not weaken that guard to make a public demo work. Run the interactive fictional demo locally with `pnpm dev`; deploy only approved live integrations on compliant infrastructure.

Official references: [Function regions](https://vercel.com/docs/functions/configuring-functions/region), [Region identifiers](https://vercel.com/docs/regions).

## Operations

- Use TLS 1.2+ at the regional load balancer/API and disable plaintext origins.
- KMS-encrypt all PII, audit objects, databases, queues, backups and permitted logs. Keep request bodies and authentication tokens out of logs.
- Use CodePipeline/CodeBuild for verification and ECR/CodeDeploy or the hosting provider's supported promotion mechanism for approved releases. Production infrastructure/IAM is a separate deliverable and is not provisioned here.
- The API contract requires an audit receipt, but the backend must guarantee atomic, immutable audit persistence itself. CloudWatch logs alone are not immutable audit storage.
- Next.js 14 is pinned to the latest 14.x version available when checked. Re-run dependency advisories before release; if an advisory cannot be fixed within 14.x, obtain approval to move to a supported patched major before accepting real traffic.
- Run Lighthouse against the optimized build on the final host and test keyboard navigation, screen readers, 200% zoom and mobile reflow. A local score is not a guarantee of production performance or WCAG conformance.

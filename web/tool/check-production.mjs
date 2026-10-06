const failures = [];
if (!['ap-south-1', 'ap-south-2'].includes(process.env.AWS_REGION))
  failures.push('AWS_REGION must be Mumbai or Hyderabad.');
if (process.env.MOCK_API === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true')
  failures.push('Demo mode must be disabled.');
if (process.env.NEXT_PUBLIC_ANALYTICS_APPROVED === 'true')
  failures.push('Direct third-party tracking is prohibited by the India-only policy.');
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32)
  failures.push('Inject a random NEXTAUTH_SECRET from Secrets Manager.');
for (const name of ['API_BASE_URL', 'NEXTAUTH_URL', 'COGNITO_ISSUER']) {
  try {
    if (new URL(process.env[name]).protocol !== 'https:') failures.push(`${name} must use HTTPS.`);
  } catch {
    failures.push(`${name} is required.`);
  }
}
if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write(
    'Deployment configuration checks passed. Infrastructure controls still require verification.\n',
  );
}

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const target = fileURLToPath(new URL('../.env.local', import.meta.url));
if (!existsSync(target)) {
  const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  writeFileSync(
    target,
    template.replace('NEXTAUTH_SECRET=', `NEXTAUTH_SECRET=${randomBytes(32).toString('base64')}`),
    { mode: 0o600, flag: 'wx' },
  );
  process.stdout.write('Local demo configuration created. No secrets are printed.\n');
} else {
  process.stdout.write('Existing local configuration preserved.\n');
}

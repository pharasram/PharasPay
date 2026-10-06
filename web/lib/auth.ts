import { randomBytes } from 'node:crypto';
import { getServerSession, type Session, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import CognitoProvider from 'next-auth/providers/cognito';
import { z } from 'zod';
import { isDemo, requireProductionConfiguration } from './config';
import { backend } from './backend';
import { mobileSchema, otpSchema } from './schemas';
const tokensSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().min(1),
});
type Tokens = z.infer<typeof tokensSchema>;
// Development-only ephemeral secret; production must inject Secrets Manager material.
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== 'production')
  process.env.NEXTAUTH_SECRET = randomBytes(32).toString('base64');
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 15 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      id: 'mobile-otp',
      name: 'Mobile OTP',
      credentials: {
        mobile: { label: 'Mobile', type: 'tel' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        requireProductionConfiguration();
        const mobile = mobileSchema.parse(credentials?.mobile);
        const otp = otpSchema.parse(credentials?.otp);
        if (isDemo())
          return mobile === '9999999999' && otp === '123456'
            ? { id: 'demo-customer', name: 'Demo customer' }
            : null;
        const result = await backend<Tokens>('/auth/otp/verify', {
          method: 'POST',
          body: { mobile, otp },
        });
        const verified = tokensSchema.parse(result.data);
        return { id: verified.userId, name: 'Customer', ...verified };
      },
    }),
    ...(process.env.COGNITO_CLIENT_ID &&
    process.env.COGNITO_CLIENT_SECRET &&
    process.env.COGNITO_ISSUER
      ? [
          CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID,
            clientSecret: process.env.COGNITO_CLIENT_SECRET,
            issuer: process.env.COGNITO_ISSUER,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn() {
      requireProductionConfiguration();
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.customerId = user.id;
        token.accessToken = user.accessToken ?? account?.access_token;
        token.refreshToken = user.refreshToken ?? account?.refresh_token;
        token.accessExpires = account?.expires_at
          ? account.expires_at * 1000
          : Date.now() + (user.expiresIn ?? 3600) * 1000;
        delete token.error;
      }
      if (!isDemo() && token.accessToken && Date.now() >= Number(token.accessExpires) - 60_000) {
        try {
          const result = await backend<Tokens>('/auth/refresh', {
            method: 'POST',
            body: { refreshToken: token.refreshToken },
          });
          const refreshed = tokensSchema.parse(result.data);
          token.accessToken = refreshed.accessToken;
          token.refreshToken = refreshed.refreshToken;
          token.accessExpires = Date.now() + refreshed.expiresIn * 1000;
        } catch {
          token.error = 'SessionExpired';
          delete token.accessToken;
          delete token.refreshToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.customerId = String(token.customerId ?? token.sub);
      session.error = token.error;
      return session;
    },
  },
  logger: {
    error(code) {
      process.stderr.write(JSON.stringify({ level: 'error', event: 'auth_error', code }) + '\n');
    },
    warn(code) {
      process.stderr.write(JSON.stringify({ level: 'warn', event: 'auth_warning', code }) + '\n');
    },
    debug() {},
  },
};

/** Uses the refreshed token inside the server callback; never use these options for /api/auth/session. */
export async function getBackendSession(): Promise<
  (Session & { serverAccessToken?: string }) | null
> {
  return getServerSession({
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      async session({ session, token }) {
        return {
          ...session,
          customerId: String(token.customerId ?? token.sub),
          error: token.error,
          serverAccessToken: token.accessToken,
        };
      },
    },
  });
}

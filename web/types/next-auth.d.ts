import 'next-auth';
import 'next-auth/jwt';
declare module 'next-auth' {
  interface Session {
    customerId: string;
    error?: string;
  }
  interface User {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    customerId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessExpires?: number;
    error?: string;
  }
}

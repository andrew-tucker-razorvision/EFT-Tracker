import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { logSecurityEvent } from "./security-logger";
import { verifyTurnstile } from "./turnstile";
import { logger } from "./logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const turnstileToken = credentials.turnstileToken as string | undefined;

        // Verify CAPTCHA if token provided (shown after 2 failed attempts)
        if (turnstileToken) {
          const isValidCaptcha = await verifyTurnstile(turnstileToken);
          if (!isValidCaptcha) {
            logger.warn({ email }, "Login attempt with invalid CAPTCHA");
            await logSecurityEvent({
              type: "CAPTCHA_FAILED",
              email,
              ipAddress:
                request?.headers?.get("x-forwarded-for") ||
                request?.headers?.get("x-real-ip") ||
                "unknown",
              userAgent: request?.headers?.get("user-agent") ?? undefined,
              metadata: { endpoint: "/api/auth/signin" },
            });
            return null;
          }
        }

        // Get IP and user agent from request
        const ipAddress =
          request?.headers?.get("x-forwarded-for") ||
          request?.headers?.get("x-real-ip") ||
          "unknown";
        const userAgent = request?.headers?.get("user-agent") ?? undefined;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Log failed login - user not found
          await logSecurityEvent({
            type: "LOGIN_FAILED",
            email,
            ipAddress,
            userAgent,
            metadata: { reason: "user_not_found" },
          });
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          // Log failed login - invalid password
          await logSecurityEvent({
            type: "LOGIN_FAILED",
            userId: user.id,
            email,
            ipAddress,
            userAgent,
            metadata: { reason: "invalid_password" },
          });
          return null;
        }

        // Log successful login
        await logSecurityEvent({
          type: "LOGIN_SUCCESS",
          userId: user.id,
          email,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

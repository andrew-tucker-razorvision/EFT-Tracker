import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { logSecurityEvent } from "./security-logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

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

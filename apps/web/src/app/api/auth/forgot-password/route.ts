import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { logSecurityEvent } from "@/lib/security-logger";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Token expiry in milliseconds (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await rateLimit(
      clientIp,
      RATE_LIMITS.AUTH_REGISTER // Reuse registration limits (3 per 10 min)
    );

    if (!rateLimitResult.success) {
      await logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: clientIp,
        userAgent: request.headers.get("user-agent") ?? undefined,
        metadata: { endpoint: "/api/auth/forgot-password" },
      });

      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Always log the request (for security monitoring)
    await logSecurityEvent({
      type: "PASSWORD_RESET_REQUESTED",
      userId: user?.id,
      email,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: { userExists: !!user },
    });

    // If user exists, generate token and send email
    if (user) {
      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email },
      });

      // Generate new token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

      // Store token
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Build reset URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email (don't wait for it to prevent timing attacks)
      sendPasswordResetEmail(email, resetUrl).catch((err) => {
        logger.error({ err }, "Failed to send password reset email");
      });
    }

    // Ensure consistent response time to prevent timing attacks
    const elapsed = Date.now() - startTime;
    const minResponseTime = 500; // 500ms minimum
    if (elapsed < minResponseTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minResponseTime - elapsed)
      );
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account with that email exists, you will receive a password reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Forgot password error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

// Wrap POST handler with rate limiting for login attempts
const originalPOST = handlers.POST;

async function POST(request: NextRequest) {
  // Only apply rate limiting to login attempts (credentials provider)
  // Check if this is a credentials signin request
  const url = new URL(request.url);
  const isCredentialsLogin =
    url.pathname.includes("/callback/credentials") ||
    url.searchParams.get("provider") === "credentials";

  if (isCredentialsLogin) {
    const clientIp = getClientIp(request);
    const rateLimitResult = await rateLimit(clientIp, RATE_LIMITS.AUTH_LOGIN);

    if (!rateLimitResult.success) {
      // Log rate limit exceeded
      await logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: clientIp,
        userAgent: request.headers.get("user-agent") ?? undefined,
        metadata: { endpoint: "/api/auth/[...nextauth]" },
      });

      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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
  }

  return originalPOST(request);
}

export const GET = handlers.GET;
export { POST };

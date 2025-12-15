import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

const unlinkByIdSchema = z.object({
  tokenId: z.string().min(1, "Token ID is required"),
});

/**
 * POST /api/companion/unlink
 * Revoke a companion token by ID (from web UI).
 * Requires user authentication.
 */
async function handlePOST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tokenId } = unlinkByIdSchema.parse(body);

    // Find the token and verify ownership
    const token = await prisma.companionToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (token.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to revoke this token" },
        { status: 403 }
      );
    }

    if (token.revokedAt) {
      return NextResponse.json(
        { error: "Token already revoked" },
        { status: 400 }
      );
    }

    // Revoke the token
    await prisma.companionToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    // Log token revocation
    await logSecurityEvent({
      type: "TOKEN_REVOKED",
      userId: session.user.id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: {
        tokenId,
        deviceName: token.deviceName,
        tokenHint: token.tokenHint,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Companion token revoked successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error revoking companion token:");
    return NextResponse.json(
      { error: "Failed to revoke companion token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companion/unlink
 * Self-revoke the current companion token (from companion app).
 * Requires companion token authentication.
 */
async function handleDELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    }

    const rawToken = authHeader.slice(7);
    if (!rawToken.startsWith("cmp_")) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    // Find and validate the token
    const tokens = await prisma.companionToken.findMany({
      where: { revokedAt: null },
    });

    let matchedToken = null;
    for (const tokenRecord of tokens) {
      const isMatch = await bcrypt.compare(rawToken, tokenRecord.token);
      if (isMatch) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        { error: "Invalid or already revoked token" },
        { status: 401 }
      );
    }

    // Revoke the token
    await prisma.companionToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Companion token revoked successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error self-revoking companion token:");
    return NextResponse.json(
      { error: "Failed to revoke companion token" },
      { status: 500 }
    );
  }
}

// Apply rate limiting - sensitive operations
export const POST = withRateLimit(handlePOST, RATE_LIMITS.API_DATA_WRITE);
export const DELETE = withRateLimit(handleDELETE, RATE_LIMITS.API_DATA_WRITE);

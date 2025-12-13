import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";
import { getClientIp } from "@/lib/rate-limit";

const linkSchema = z.object({
  deviceName: z.string().min(1, "Device name is required").max(100),
  gameMode: z.enum(["PVP", "PVE"]).default("PVP"),
});

/**
 * POST /api/companion/link
 * Generate a new companion token for linking the desktop app.
 * Requires user authentication.
 */
async function handlePOST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceName, gameMode } = linkSchema.parse(body);

    // Generate a secure random token
    // Format: cmp_<32 random hex chars> = 36 chars total
    const rawToken = `cmp_${crypto.randomBytes(16).toString("hex")}`;
    const tokenHint = rawToken.slice(-4); // Last 4 chars for display

    // Hash the token for storage
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // Create the companion token record
    const companionToken = await prisma.companionToken.create({
      data: {
        token: hashedToken,
        tokenHint,
        userId: session.user.id,
        deviceName,
        gameMode,
      },
      select: {
        id: true,
        deviceName: true,
        gameMode: true,
        createdAt: true,
      },
    });

    // Log token generation
    await logSecurityEvent({
      type: "TOKEN_GENERATED",
      userId: session.user.id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: { deviceName, gameMode, tokenHint },
    });

    // Return the raw token (only time it's visible)
    return NextResponse.json(
      {
        token: rawToken,
        tokenId: companionToken.id,
        deviceName: companionToken.deviceName,
        gameMode: companionToken.gameMode,
        createdAt: companionToken.createdAt,
        message: "Save this token securely. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error creating companion token");
    return NextResponse.json(
      { error: "Failed to create companion token" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companion/link
 * List all companion tokens for the authenticated user.
 */
async function handleGET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await prisma.companionToken.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
      select: {
        id: true,
        tokenHint: true,
        deviceName: true,
        gameMode: true,
        lastSeen: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    logger.error({ err: error }, "Error listing companion tokens");
    return NextResponse.json(
      { error: "Failed to list companion tokens" },
      { status: 500 }
    );
  }
}

// Apply rate limiting - lower limits for sensitive operations
export const POST = withRateLimit(handlePOST, RATE_LIMITS.API_DATA_WRITE);
export const GET = withRateLimit(handleGET, RATE_LIMITS.API_AUTHENTICATED);

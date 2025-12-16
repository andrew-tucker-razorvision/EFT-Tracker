import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Validate companion token from Authorization header.
 * Returns the token record with user info if valid, null otherwise.
 */
async function validateCompanionToken(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const rawToken = authHeader.slice(7); // Remove "Bearer "
  if (!rawToken.startsWith("cmp_")) {
    return null;
  }

  // Find all non-revoked tokens and check against the hash
  const tokens = await prisma.companionToken.findMany({
    where: { revokedAt: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          playerLevel: true,
        },
      },
    },
  });

  for (const tokenRecord of tokens) {
    const isMatch = await bcrypt.compare(rawToken, tokenRecord.token);
    if (isMatch) {
      // Update lastSeen
      await prisma.companionToken.update({
        where: { id: tokenRecord.id },
        data: { lastSeen: new Date() },
      });
      return tokenRecord;
    }
  }

  return null;
}

/**
 * GET /api/companion/status
 * Check companion token validity and return user/connection info.
 * Used by companion app to verify connection and display status.
 */
async function handleGET(request: Request) {
  try {
    const tokenRecord = await validateCompanionToken(request);

    if (!tokenRecord) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid or expired companion token",
        },
        { status: 401 }
      );
    }

    // Get progress stats for the user
    const progressStats = await prisma.questProgress.groupBy({
      by: ["status"],
      where: { userId: tokenRecord.userId },
      _count: true,
    });

    const stats = {
      completed: 0,
      inProgress: 0,
      available: 0,
      locked: 0,
    };

    for (const stat of progressStats) {
      switch (stat.status) {
        case "COMPLETED":
          stats.completed = stat._count;
          break;
        case "IN_PROGRESS":
          stats.inProgress = stat._count;
          break;
        case "AVAILABLE":
          stats.available = stat._count;
          break;
        case "LOCKED":
          stats.locked = stat._count;
          break;
      }
    }

    return NextResponse.json({
      valid: true,
      userId: tokenRecord.user.id,
      userName: tokenRecord.user.name || tokenRecord.user.email,
      playerLevel: tokenRecord.user.playerLevel,
      deviceName: tokenRecord.deviceName,
      gameMode: tokenRecord.gameMode,
      lastSeen: tokenRecord.lastSeen,
      createdAt: tokenRecord.createdAt,
      stats,
    });
  } catch (error) {
    logger.error({ err: error }, "Error checking companion status:");
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

// Apply rate limiting for companion API
export const GET = withRateLimit(handleGET, RATE_LIMITS.API_COMPANION);

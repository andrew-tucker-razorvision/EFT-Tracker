import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/user - Get current user settings
async function handleGET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        playerLevel: true,
        questsPerTree: true,
        bypassLevelRequirement: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    logger.error({ err: error }, "Error fetching user");
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  playerLevel: z
    .number()
    .int()
    .min(1, "Level must be at least 1")
    .max(79, "Level cannot exceed 79")
    .nullable()
    .optional(),
  questsPerTree: z
    .number()
    .int()
    .min(5, "Must show at least 5 quests")
    .max(100, "Maximum 100 quests per tree")
    .nullable()
    .optional(),
  bypassLevelRequirement: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
});

// PATCH /api/user - Update current user settings
async function handlePATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.playerLevel !== undefined && {
          playerLevel: data.playerLevel,
        }),
        ...(data.questsPerTree !== undefined && {
          questsPerTree: data.questsPerTree,
        }),
        ...(data.bypassLevelRequirement !== undefined && {
          bypassLevelRequirement: data.bypassLevelRequirement,
        }),
        ...(data.name !== undefined && { name: data.name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        playerLevel: true,
        questsPerTree: true,
        bypassLevelRequirement: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error updating user");
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Apply rate limiting - authenticated users only
export const GET = withRateLimit(handleGET, RATE_LIMITS.API_AUTHENTICATED);
export const PATCH = withRateLimit(handlePATCH, RATE_LIMITS.API_DATA_WRITE);

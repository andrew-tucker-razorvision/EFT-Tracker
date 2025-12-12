import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

type QuestDependency = Prisma.QuestDependencyGetPayload<{
  select: { requiredId: true };
}>;

// GET /api/progress - Get all progress for authenticated user
async function handleGET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.questProgress.findMany({
      where: { userId: session.user.id },
      include: {
        quest: {
          include: {
            trader: true,
          },
        },
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    logger.error({ err: error }, "Error fetching progress");
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

const initProgressSchema = z.object({
  questId: z.string().min(1, "Quest ID is required"),
});

// POST /api/progress - Initialize progress for a quest
async function handlePOST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questId } = initProgressSchema.parse(body);

    // Check if quest exists
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        dependsOn: true,
      },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // Check if progress already exists
    const existingProgress = await prisma.questProgress.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId,
        },
      },
    });

    if (existingProgress) {
      return NextResponse.json({ progress: existingProgress });
    }

    // Determine initial status based on dependencies
    let initialStatus: "LOCKED" | "AVAILABLE" = "AVAILABLE";

    if (quest.dependsOn.length > 0) {
      // Check if all dependencies are completed
      const completedDeps = await prisma.questProgress.count({
        where: {
          userId: session.user.id,
          questId: {
            in: quest.dependsOn.map((d: QuestDependency) => d.requiredId),
          },
          status: "COMPLETED",
        },
      });

      if (completedDeps < quest.dependsOn.length) {
        initialStatus = "LOCKED";
      }
    }

    // Create progress entry
    const progress = await prisma.questProgress.create({
      data: {
        userId: session.user.id,
        questId,
        status: initialStatus,
      },
    });

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error creating progress");
    return NextResponse.json(
      { error: "Failed to create progress" },
      { status: 500 }
    );
  }
}

// DELETE /api/progress - Reset all progress (wipe)
async function handleDELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all progress for the user
    const result = await prisma.questProgress.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} quests`,
      count: result.count,
    });
  } catch (error) {
    logger.error({ err: error }, "Error resetting progress");
    return NextResponse.json(
      { error: "Failed to reset progress" },
      { status: 500 }
    );
  }
}

// Apply rate limiting - authenticated users get higher limits
export const GET = withRateLimit(handleGET, RATE_LIMITS.API_AUTHENTICATED);
export const POST = withRateLimit(handlePOST, RATE_LIMITS.API_DATA_WRITE);
export const DELETE = withRateLimit(handleDELETE, RATE_LIMITS.API_DATA_WRITE);

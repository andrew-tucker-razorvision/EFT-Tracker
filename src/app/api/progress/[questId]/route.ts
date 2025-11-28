import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

type QuestDependency = Prisma.QuestDependencyGetPayload<{
  select: { requiredId: true };
}>;

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  LOCKED: [], // Can only be unlocked via auto-unlock logic
  AVAILABLE: ["IN_PROGRESS", "COMPLETED"], // Allow direct completion
  IN_PROGRESS: ["COMPLETED", "AVAILABLE"], // Can abandon back to available
  COMPLETED: ["AVAILABLE"], // Can reset to available
};

const updateStatusSchema = z.object({
  status: z.enum(["LOCKED", "AVAILABLE", "IN_PROGRESS", "COMPLETED"]),
});

// PATCH /api/progress/[questId] - Update quest status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questId } = await params;
    const body = await request.json();
    const { status: newStatus } = updateStatusSchema.parse(body);

    // Get current progress
    let progress = await prisma.questProgress.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId,
        },
      },
    });

    // If no progress exists, create it first
    if (!progress) {
      // Check if quest exists
      const quest = await prisma.quest.findUnique({
        where: { id: questId },
        include: { dependsOn: true },
      });

      if (!quest) {
        return NextResponse.json({ error: "Quest not found" }, { status: 404 });
      }

      // Determine initial status
      let initialStatus: "LOCKED" | "AVAILABLE" = "AVAILABLE";
      if (quest.dependsOn.length > 0) {
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

      progress = await prisma.questProgress.create({
        data: {
          userId: session.user.id,
          questId,
          status: initialStatus,
        },
      });
    }

    const currentStatus = progress.status;

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (
      !allowedTransitions.includes(newStatus) &&
      currentStatus !== newStatus
    ) {
      // Special case: allow LOCKED -> AVAILABLE for auto-unlock
      if (!(currentStatus === "LOCKED" && newStatus === "AVAILABLE")) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
            allowedTransitions,
          },
          { status: 400 }
        );
      }
    }

    // Update status
    const updatedProgress = await prisma.questProgress.update({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId,
        },
      },
      data: {
        status: newStatus,
      },
    });

    // If quest was completed, check for quests to auto-unlock
    let unlockedQuests: string[] = [];
    if (newStatus === "COMPLETED") {
      unlockedQuests = await autoUnlockDependentQuests(
        session.user.id,
        questId
      );
    }

    return NextResponse.json({
      progress: updatedProgress,
      unlockedQuests,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Auto-unlock quests that depend on the completed quest
async function autoUnlockDependentQuests(
  userId: string,
  completedQuestId: string
): Promise<string[]> {
  // Find all quests that depend on the completed quest
  const dependentQuests = await prisma.questDependency.findMany({
    where: { requiredId: completedQuestId },
    include: {
      dependentQuest: {
        include: {
          dependsOn: true,
        },
      },
    },
  });

  const unlockedQuestIds: string[] = [];

  for (const dep of dependentQuests) {
    const quest = dep.dependentQuest;

    // Check if ALL dependencies for this quest are now completed
    const allDepsCompleted = await checkAllDependenciesCompleted(
      userId,
      quest.dependsOn.map((d: QuestDependency) => d.requiredId)
    );

    if (allDepsCompleted) {
      // Check current progress status
      const currentProgress = await prisma.questProgress.findUnique({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
      });

      if (!currentProgress) {
        // Create as AVAILABLE
        await prisma.questProgress.create({
          data: {
            userId,
            questId: quest.id,
            status: "AVAILABLE",
          },
        });
        unlockedQuestIds.push(quest.id);
      } else if (currentProgress.status === "LOCKED") {
        // Unlock it
        await prisma.questProgress.update({
          where: {
            userId_questId: {
              userId,
              questId: quest.id,
            },
          },
          data: { status: "AVAILABLE" },
        });
        unlockedQuestIds.push(quest.id);
      }
    }
  }

  return unlockedQuestIds;
}

async function checkAllDependenciesCompleted(
  userId: string,
  requiredQuestIds: string[]
): Promise<boolean> {
  if (requiredQuestIds.length === 0) return true;

  const completedCount = await prisma.questProgress.count({
    where: {
      userId,
      questId: { in: requiredQuestIds },
      status: "COMPLETED",
    },
  });

  return completedCount === requiredQuestIds.length;
}

// GET /api/progress/[questId] - Get progress for a specific quest
export async function GET(
  request: Request,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questId } = await params;

    const progress = await prisma.questProgress.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId,
        },
      },
      include: {
        quest: {
          include: {
            trader: true,
            objectives: true,
          },
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

type QuestDependencyWithStatus = Prisma.QuestDependencyGetPayload<{
  select: { requiredId: true; requirementStatus: true };
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

      // Determine initial status based on dependencies and their requirement types
      let initialStatus: "LOCKED" | "AVAILABLE" = "AVAILABLE";
      if (quest.dependsOn.length > 0) {
        const dependenciesMet = await checkAllDependenciesMet(
          session.user.id,
          quest.dependsOn as QuestDependencyWithStatus[]
        );
        if (!dependenciesMet) {
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

    // Check for quests to auto-unlock based on the new status
    let unlockedQuests: string[] = [];

    // If quest was completed, check for quests requiring "complete" or "complete/failed"
    if (newStatus === "COMPLETED") {
      unlockedQuests = await autoUnlockDependentQuests(
        session.user.id,
        questId,
        "COMPLETED"
      );
    }
    // If quest was started (IN_PROGRESS), check for quests requiring "active"
    else if (newStatus === "IN_PROGRESS") {
      unlockedQuests = await autoUnlockDependentQuests(
        session.user.id,
        questId,
        "IN_PROGRESS"
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

/**
 * Check if a dependency requirement is satisfied based on the required status types
 * and the actual progress status.
 *
 * Requirement status meanings:
 * - ["complete"] - Quest must be completed
 * - ["active"] - Quest must be in progress (active)
 * - ["active", "complete"] - Quest can be in progress OR completed
 * - ["complete", "failed"] - Quest must be completed (we don't track failed state currently)
 * - ["failed"] - Quest must be failed (not supported, treat as not met)
 */
function isDependencyMet(
  requirementStatus: string[],
  actualStatus: string | null
): boolean {
  if (!actualStatus) return false;

  const normalizedActual = actualStatus.toUpperCase();

  // Check each acceptable status
  for (const reqStatus of requirementStatus) {
    const normalizedReq = reqStatus.toLowerCase();

    if (normalizedReq === "complete" && normalizedActual === "COMPLETED") {
      return true;
    }
    if (
      normalizedReq === "active" &&
      (normalizedActual === "IN_PROGRESS" || normalizedActual === "COMPLETED")
    ) {
      // "active" means the quest is accepted/started - both IN_PROGRESS and COMPLETED satisfy this
      return true;
    }
    // We don't currently track "failed" status, so we can't satisfy ["failed"] requirements
  }

  return false;
}

/**
 * Check if all dependencies for a quest are met based on their requirement types.
 */
async function checkAllDependenciesMet(
  userId: string,
  dependencies: QuestDependencyWithStatus[]
): Promise<boolean> {
  if (dependencies.length === 0) return true;

  // Get all progress for the required quests
  const requiredQuestIds = dependencies.map((d) => d.requiredId);
  const progressRecords = await prisma.questProgress.findMany({
    where: {
      userId,
      questId: { in: requiredQuestIds },
    },
  });

  const progressMap = new Map(
    progressRecords.map((p) => [p.questId, p.status])
  );

  // Check each dependency
  for (const dep of dependencies) {
    const actualStatus = progressMap.get(dep.requiredId) || null;
    const requirementStatus = dep.requirementStatus || ["complete"];

    if (!isDependencyMet(requirementStatus, actualStatus)) {
      return false;
    }
  }

  return true;
}

/**
 * Auto-unlock quests that depend on the quest that just changed status.
 * This handles both "complete" requirements (when a quest is completed)
 * and "active" requirements (when a quest is started).
 */
async function autoUnlockDependentQuests(
  userId: string,
  changedQuestId: string,
  newStatus: "COMPLETED" | "IN_PROGRESS"
): Promise<string[]> {
  // Find all quests that depend on the changed quest
  const dependentQuests = await prisma.questDependency.findMany({
    where: { requiredId: changedQuestId },
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
    const requirementStatus = dep.requirementStatus || ["complete"];

    // Check if this specific dependency is now satisfied
    const thisDepMet = isDependencyMet(requirementStatus, newStatus);
    if (!thisDepMet) continue;

    // Check if ALL dependencies for this quest are now met
    const allDepsMet = await checkAllDependenciesMet(
      userId,
      quest.dependsOn as QuestDependencyWithStatus[]
    );

    if (allDepsMet) {
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

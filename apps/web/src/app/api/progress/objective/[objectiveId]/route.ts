import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  shouldAutoCompleteQuest,
  isObjectiveComplete,
  type ObjectiveWithProgress,
} from "@/lib/quest-status";

const updateObjectiveSchema = z.object({
  completed: z.boolean().optional(),
  current: z.number().int().min(0).optional(),
}).refine(
  (data) => data.completed !== undefined || data.current !== undefined,
  { message: "Either 'completed' or 'current' must be provided" }
);

/**
 * PATCH /api/progress/objective/[objectiveId]
 *
 * Update objective completion status.
 * If all required objectives become complete, auto-completes the quest.
 * If quest auto-completes, triggers auto-unlock of dependent quests.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ objectiveId: string }> }
) {
  const clientIp = getClientIp(request);
  const rateLimitResult = await rateLimit(clientIp, RATE_LIMITS.API_DATA_WRITE);

  if (!rateLimitResult.success) {
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

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { objectiveId } = await params;
    const body = await request.json();
    const parsed = updateObjectiveSchema.parse(body);

    // Get objective with its quest and all objectives for that quest
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
      include: {
        quest: {
          include: {
            objectives: {
              include: {
                progress: {
                  where: { userId: session.user.id },
                },
              },
            },
            progress: {
              where: { userId: session.user.id },
            },
            dependedOnBy: {
              include: {
                dependentQuest: {
                  include: {
                    dependsOn: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!objective) {
      return NextResponse.json(
        { error: "Objective not found" },
        { status: 404 }
      );
    }

    const quest = objective.quest;
    const userId = session.user.id;

    // Determine target from objective.count (for numeric objectives)
    const target = objective.count;
    const isNumeric = target !== null && target > 0;

    // Calculate completed and current values based on input
    let completed: boolean;
    let current: number | null;

    if (parsed.current !== undefined) {
      // If current is provided, clamp to target and auto-compute completed
      current = isNumeric ? Math.min(parsed.current, target) : parsed.current;
      completed = isNumeric ? current >= target : parsed.current > 0;
    } else if (parsed.completed !== undefined) {
      // If only completed is provided, set current based on completed status
      completed = parsed.completed;
      current = isNumeric ? (completed ? target : 0) : null;
    } else {
      // This shouldn't happen due to schema validation, but handle it
      return NextResponse.json(
        { error: "Either 'completed' or 'current' must be provided" },
        { status: 400 }
      );
    }

    // Upsert objective progress
    const objectiveProgress = await prisma.objectiveProgress.upsert({
      where: {
        userId_objectiveId: {
          userId,
          objectiveId,
        },
      },
      update: {
        completed,
        current,
        target: isNumeric ? target : null,
        syncSource: "WEB",
      },
      create: {
        userId,
        objectiveId,
        completed,
        current,
        target: isNumeric ? target : null,
        syncSource: "WEB",
      },
    });

    // Build updated objectives list with new progress
    const updatedObjectives: ObjectiveWithProgress[] = quest.objectives.map(
      (obj) => {
        if (obj.id === objectiveId) {
          return {
            id: obj.id,
            optional: obj.optional,
            count: obj.count,
            progress: [{ completed, current, target: isNumeric ? target : null }],
          };
        }
        return {
          id: obj.id,
          optional: obj.optional,
          count: obj.count,
          progress: obj.progress,
        };
      }
    );

    // Check if quest should auto-complete
    const shouldComplete = shouldAutoCompleteQuest(updatedObjectives);
    const currentQuestProgress = quest.progress?.[0];
    let questStatusChanged = false;
    let unlockedQuests: string[] = [];

    if (shouldComplete && currentQuestProgress?.status !== "COMPLETED") {
      // Auto-complete the quest
      await prisma.questProgress.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        update: {
          status: "COMPLETED",
          syncSource: "WEB",
        },
        create: {
          userId,
          questId: quest.id,
          status: "COMPLETED",
          syncSource: "WEB",
        },
      });

      questStatusChanged = true;

      // Auto-unlock dependent quests
      unlockedQuests = await autoUnlockDependentQuests(
        userId,
        quest.id,
        "COMPLETED"
      );
    } else if (
      !shouldComplete &&
      currentQuestProgress?.status === "COMPLETED"
    ) {
      // Quest was COMPLETED but now an objective is incomplete, revert to IN_PROGRESS
      await prisma.questProgress.update({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        data: {
          status: "IN_PROGRESS",
          syncSource: "WEB",
        },
      });

      questStatusChanged = true;
    } else if (
      !shouldComplete &&
      completed &&
      currentQuestProgress?.status !== "IN_PROGRESS" &&
      currentQuestProgress?.status !== "COMPLETED"
    ) {
      // At least one objective is now complete, mark quest as IN_PROGRESS
      await prisma.questProgress.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        update: {
          status: "IN_PROGRESS",
          syncSource: "WEB",
        },
        create: {
          userId,
          questId: quest.id,
          status: "IN_PROGRESS",
          syncSource: "WEB",
        },
      });

      questStatusChanged = true;

      // Check for quests that require "active" status
      unlockedQuests = await autoUnlockDependentQuests(
        userId,
        quest.id,
        "IN_PROGRESS"
      );
    }

    // Get updated quest progress
    const updatedQuestProgress = await prisma.questProgress.findUnique({
      where: {
        userId_questId: {
          userId,
          questId: quest.id,
        },
      },
    });

    // Compute objective progress summary
    const totalObjectives = quest.objectives.length;
    const completedObjectives = updatedObjectives.filter(
      (o) => isObjectiveComplete(o.progress?.[0])
    ).length;

    return NextResponse.json({
      objectiveProgress,
      quest: {
        id: quest.id,
        title: quest.title,
        status: updatedQuestProgress?.status ?? "AVAILABLE",
        statusChanged: questStatusChanged,
        objectivesSummary: {
          total: totalObjectives,
          completed: completedObjectives,
        },
      },
      unlockedQuests,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error updating objective progress");
    return NextResponse.json(
      { error: "Failed to update objective progress" },
      { status: 500 }
    );
  }
}

/**
 * Auto-unlock quests that depend on the completed quest.
 * Copied from [questId]/route.ts - consider extracting to shared utility.
 */
async function autoUnlockDependentQuests(
  userId: string,
  changedQuestId: string,
  newStatus: "COMPLETED" | "IN_PROGRESS"
): Promise<string[]> {
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
    const allDepsMet = await checkAllDependenciesMet(userId, quest.dependsOn);

    if (allDepsMet) {
      const currentProgress = await prisma.questProgress.findUnique({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
      });

      if (!currentProgress) {
        await prisma.questProgress.create({
          data: {
            userId,
            questId: quest.id,
            status: "AVAILABLE",
          },
        });
        unlockedQuestIds.push(quest.id);
      } else if (currentProgress.status === "LOCKED") {
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

function isDependencyMet(
  requirementStatus: string[],
  actualStatus: string | null
): boolean {
  if (!actualStatus) return false;

  const normalizedActual = actualStatus.toUpperCase();

  for (const reqStatus of requirementStatus) {
    const normalizedReq = reqStatus.toLowerCase();

    if (normalizedReq === "complete" && normalizedActual === "COMPLETED") {
      return true;
    }
    if (
      normalizedReq === "active" &&
      (normalizedActual === "IN_PROGRESS" || normalizedActual === "COMPLETED")
    ) {
      return true;
    }
  }

  return false;
}

async function checkAllDependenciesMet(
  userId: string,
  dependencies: { requiredId: string; requirementStatus: string[] }[]
): Promise<boolean> {
  if (dependencies.length === 0) return true;

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
 * GET /api/progress/objective/[objectiveId]
 *
 * Get objective progress for the current user.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ objectiveId: string }> }
) {
  const clientIp = getClientIp(request);
  const rateLimitResult = await rateLimit(
    clientIp,
    RATE_LIMITS.API_AUTHENTICATED
  );

  if (!rateLimitResult.success) {
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

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { objectiveId } = await params;

    const objectiveProgress = await prisma.objectiveProgress.findUnique({
      where: {
        userId_objectiveId: {
          userId: session.user.id,
          objectiveId,
        },
      },
      include: {
        objective: {
          include: {
            quest: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!objectiveProgress) {
      // Return default progress if not found
      const objective = await prisma.objective.findUnique({
        where: { id: objectiveId },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!objective) {
        return NextResponse.json(
          { error: "Objective not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        objectiveProgress: {
          objectiveId,
          userId: session.user.id,
          completed: false,
        },
        objective,
      });
    }

    return NextResponse.json({
      objectiveProgress,
      objective: objectiveProgress.objective,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching objective progress");
    return NextResponse.json(
      { error: "Failed to fetch objective progress" },
      { status: 500 }
    );
  }
}

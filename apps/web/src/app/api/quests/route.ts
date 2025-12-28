import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

type QuestWithRelations = Prisma.QuestGetPayload<{
  include: {
    trader: true;
    objectives: true;
    dependsOn: {
      include: {
        requiredQuest: {
          include: {
            trader: true;
            progress: true;
          };
        };
      };
    };
    dependedOnBy: {
      include: {
        dependentQuest: {
          include: {
            trader: true;
          };
        };
      };
    };
    progress: true;
  };
}>;

/**
 * Check if a dependency requirement is satisfied based on the required status types
 * and the actual progress status.
 */
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

/**
 * Recursively check if a quest should be locked based on its dependency chain.
 * This handles the case where a prerequisite quest has stored progress "COMPLETED"
 * but should actually be locked because ITS prerequisites are not met.
 *
 * Uses memoization to avoid redundant computation.
 */
function isQuestEffectivelyLocked(
  questId: string,
  quests: QuestWithRelations[],
  memo: Map<string, boolean>
): boolean {
  // Check memo first
  if (memo.has(questId)) {
    return memo.get(questId)!;
  }

  const quest = quests.find((q) => q.id === questId);
  if (!quest) {
    // Quest not in results (filtered out), assume not locked
    memo.set(questId, false);
    return false;
  }

  // If no dependencies, quest is not locked - it's available to start
  // (The actual status will come from stored progress or default to "available")
  if (quest.dependsOn.length === 0) {
    memo.set(questId, false);
    return false;
  }

  // Check each dependency
  for (const dep of quest.dependsOn) {
    const depQuest = quests.find((q) => q.id === dep.requiredQuest.id);
    const requirementStatus = dep.requirementStatus || ["complete"];

    // Get progress status - prefer from filtered results, fall back to dependency data
    // This is important when searching/filtering: the dependency quest may not be in
    // the filtered results, but we still have its progress via the dependsOn relation
    let storedStatus: string | null = null;
    if (depQuest) {
      storedStatus = depQuest.progress?.[0]?.status || null;
    } else {
      // Quest not in filtered results - use progress from dependency relation
      // The requiredQuest now includes progress data for the current user
      const reqQuestProgress = (
        dep.requiredQuest as { progress?: { status: string }[] }
      ).progress;
      storedStatus = reqQuestProgress?.[0]?.status || null;
    }

    // First check: Is the stored status sufficient?
    if (!isDependencyMet(requirementStatus, storedStatus)) {
      // Stored status doesn't meet requirement
      memo.set(questId, true);
      return true;
    }

    // Second check: Even if stored status is COMPLETED/IN_PROGRESS,
    // is the prerequisite quest effectively locked due to its own dependencies?
    // Only do this recursive check if the quest is in the filtered results
    // (we can't check deeper dependencies if the quest isn't loaded)
    if (
      depQuest &&
      isQuestEffectivelyLocked(dep.requiredQuest.id, quests, memo)
    ) {
      // The prerequisite is effectively locked, so this dependency is not truly met
      memo.set(questId, true);
      return true;
    }
  }

  // All dependencies are met
  memo.set(questId, false);
  return false;
}

async function handleGET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kappa = searchParams.get("kappa");
    const search = searchParams.get("search");

    // Get current user session for progress
    const session = await auth();
    const userId = session?.user?.id;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (kappa === "true") {
      where.kappaRequired = true;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Fetch quests with related data
    const quests = await prisma.quest.findMany({
      where,
      include: {
        trader: true,
        objectives: true,
        dependsOn: {
          include: {
            requiredQuest: {
              include: {
                trader: true,
                progress: userId
                  ? {
                      where: { userId },
                    }
                  : false,
              },
            },
          },
        },
        dependedOnBy: {
          include: {
            dependentQuest: {
              include: {
                trader: true,
              },
            },
          },
        },
        progress: userId
          ? {
              where: { userId },
            }
          : false,
      },
      orderBy: [{ levelRequired: "asc" }, { title: "asc" }],
    });

    // Memoization map for recursive dependency checking
    const lockMemo = new Map<string, boolean>();

    // Transform to include computed status
    const questsWithStatus = quests.map((quest: QuestWithRelations) => {
      const progress = quest.progress?.[0] || null;

      // Compute status based on dependencies (recursive check)
      let computedStatus = "available";

      // Use recursive function to check if quest should be locked
      // This properly handles chains where a prerequisite has "COMPLETED" stored
      // but should actually be locked due to its own unmet dependencies
      const shouldBeLocked = isQuestEffectivelyLocked(
        quest.id,
        quests,
        lockMemo
      );

      if (progress) {
        const storedStatus = progress.status.toLowerCase();
        // If dependencies are no longer met, show as locked regardless of stored status
        // This handles the case when prerequisites are unchecked after quest was completed/available
        if (shouldBeLocked) {
          computedStatus = "locked";
        } else {
          computedStatus = storedStatus;
        }
      } else {
        if (shouldBeLocked) {
          computedStatus = "locked";
        }
      }

      return {
        ...quest,
        progress,
        computedStatus,
      };
    });

    return NextResponse.json({
      quests: questsWithStatus,
      total: questsWithStatus.length,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching quests");
    return NextResponse.json(
      { error: "Failed to fetch quests" },
      { status: 500 }
    );
  }
}

// Note: Rate limiting removed for read-only public data endpoint
// Public quest information should be freely accessible without limits
export const GET = handleGET;

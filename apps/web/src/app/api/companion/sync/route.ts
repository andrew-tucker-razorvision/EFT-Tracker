import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Prisma, QuestStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { syncSchema } from "@/types/api-contracts";

type QuestDependencyWithStatus = Prisma.QuestDependencyGetPayload<{
  select: { requiredId: true; requirementStatus: true };
}>;

// Map log event status to our QuestStatus enum
const STATUS_MAP: Record<string, QuestStatus> = {
  STARTED: "IN_PROGRESS",
  FINISHED: "COMPLETED",
  FAILED: "AVAILABLE", // Failed quests reset to available (for restartable ones)
};

/**
 * Validate companion token from Authorization header.
 * Returns the token record if valid, null otherwise.
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
  // This is not ideal for performance, but companion tokens are rare
  const tokens = await prisma.companionToken.findMany({
    where: { revokedAt: null },
    include: { user: { select: { id: true } } },
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
 * Check if a dependency requirement is satisfied.
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
 * Check if all dependencies for a quest are met.
 */
async function checkAllDependenciesMet(
  userId: string,
  dependencies: QuestDependencyWithStatus[]
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
 * Auto-unlock quests that depend on the completed quest.
 */
async function autoUnlockDependentQuests(
  userId: string,
  completedQuestId: string
): Promise<string[]> {
  const dependentQuests = await prisma.questDependency.findMany({
    where: { requiredId: completedQuestId },
    include: {
      dependentQuest: {
        include: { dependsOn: true },
      },
    },
  });

  const unlockedQuestIds: string[] = [];

  for (const dep of dependentQuests) {
    const quest = dep.dependentQuest;

    // Check if ALL dependencies are now met
    const allDepsMet = await checkAllDependenciesMet(
      userId,
      quest.dependsOn as QuestDependencyWithStatus[]
    );

    if (allDepsMet) {
      const currentProgress = await prisma.questProgress.findUnique({
        where: {
          userId_questId: { userId, questId: quest.id },
        },
      });

      if (!currentProgress) {
        // Create as AVAILABLE
        await prisma.questProgress.create({
          data: {
            userId,
            questId: quest.id,
            status: "AVAILABLE",
            syncSource: "COMPANION",
          },
        });
        unlockedQuestIds.push(quest.id);
      } else if (currentProgress.status === "LOCKED") {
        // Unlock it
        await prisma.questProgress.update({
          where: {
            userId_questId: { userId, questId: quest.id },
          },
          data: { status: "AVAILABLE", syncSource: "COMPANION" },
        });
        unlockedQuestIds.push(quest.id);
      }
    }
  }

  return unlockedQuestIds;
}

/**
 * POST /api/companion/sync
 * Sync quest progress events from the companion app.
 * Requires companion token authentication.
 */
export async function POST(request: Request) {
  try {
    // Validate companion token
    const tokenRecord = await validateCompanionToken(request);
    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired companion token" },
        { status: 401 }
      );
    }

    const userId = tokenRecord.userId;
    const body = await request.json();
    const { events } = syncSchema.parse(body);

    const results = {
      synced: 0,
      errors: [] as { questId: string; error: string }[],
      unlockedQuests: [] as string[],
    };

    // Process events in order (by timestamp)
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const event of sortedEvents) {
      try {
        const newStatus = STATUS_MAP[event.status];
        if (!newStatus) {
          results.errors.push({
            questId: event.questId,
            error: `Unknown status: ${event.status}`,
          });
          continue;
        }

        // Check if quest exists
        const quest = await prisma.quest.findUnique({
          where: { id: event.questId },
          include: { dependsOn: true },
        });

        if (!quest) {
          results.errors.push({
            questId: event.questId,
            error: "Quest not found",
          });
          continue;
        }

        // Get or create progress record
        let progress = await prisma.questProgress.findUnique({
          where: {
            userId_questId: { userId, questId: event.questId },
          },
        });

        if (!progress) {
          // Determine initial status based on dependencies
          let initialStatus: QuestStatus = "AVAILABLE";
          if (quest.dependsOn.length > 0) {
            const depsMet = await checkAllDependenciesMet(
              userId,
              quest.dependsOn as QuestDependencyWithStatus[]
            );
            if (!depsMet) {
              initialStatus = "LOCKED";
            }
          }

          progress = await prisma.questProgress.create({
            data: {
              userId,
              questId: event.questId,
              status: initialStatus,
              syncSource: "COMPANION",
            },
          });
        }

        // Apply the status change
        // Note: We're more permissive here than the web UI since the game
        // is the source of truth
        await prisma.questProgress.update({
          where: {
            userId_questId: { userId, questId: event.questId },
          },
          data: {
            status: newStatus,
            syncSource: "COMPANION",
          },
        });

        results.synced++;

        // Auto-unlock dependent quests if completed
        if (newStatus === "COMPLETED") {
          const unlocked = await autoUnlockDependentQuests(
            userId,
            event.questId
          );
          results.unlockedQuests.push(...unlocked);
        }
      } catch (eventError) {
        logger.error(
          { err: eventError, questId: event.questId },
          `Error processing event for quest ${event.questId}`
        );
        results.errors.push({
          questId: event.questId,
          error: "Failed to process event",
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    logger.error({ err: error }, "Error syncing companion progress:");
    return NextResponse.json(
      { error: "Failed to sync progress" },
      { status: 500 }
    );
  }
}

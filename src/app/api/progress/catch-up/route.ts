import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

type QuestWithDependencies = Prisma.QuestGetPayload<{
  include: {
    dependsOn: {
      include: {
        requiredQuest: true;
      };
    };
  };
}>;

const catchUpSchema = z.object({
  targetQuests: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * Recursively collect all incomplete prerequisites for a quest.
 * Returns quest IDs in dependency order (deepest first).
 */
function getIncompletePrerequisites(
  questId: string,
  questMap: Map<string, QuestWithDependencies>,
  progressMap: Map<string, string>,
  seen: Set<string>
): string[] {
  if (seen.has(questId)) return [];
  seen.add(questId);

  const quest = questMap.get(questId);
  if (!quest) return [];

  const prerequisites: string[] = [];

  for (const dep of quest.dependsOn || []) {
    const prereqId = dep.requiredQuest.id;

    // First recurse to get deeper prerequisites (post-order traversal)
    const deeperPrereqs = getIncompletePrerequisites(
      prereqId,
      questMap,
      progressMap,
      seen
    );
    prerequisites.push(...deeperPrereqs);

    // Then add this prerequisite if not already completed
    const status = progressMap.get(prereqId);
    if (status !== "COMPLETED") {
      prerequisites.push(prereqId);
    }
  }

  return prerequisites;
}

/**
 * POST /api/progress/catch-up
 * Bulk sync progress by completing all prerequisites for selected target quests.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetQuests } = catchUpSchema.parse(body);

    // Fetch all quests with their dependencies
    const allQuests = await prisma.quest.findMany({
      include: {
        dependsOn: {
          include: {
            requiredQuest: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const questMap = new Map<string, QuestWithDependencies>(
      allQuests.map((q) => [q.id, q])
    );

    // Validate all target quests exist
    for (const questId of targetQuests) {
      if (!questMap.has(questId)) {
        return NextResponse.json(
          { error: `Quest not found: ${questId}` },
          { status: 404 }
        );
      }
    }

    // Get current progress for the user
    const currentProgress = await prisma.questProgress.findMany({
      where: { userId: session.user.id },
    });

    const progressMap = new Map<string, string>(
      currentProgress.map((p) => [p.questId, p.status])
    );

    // Collect all prerequisites that need to be completed
    const prerequisitesToComplete = new Set<string>();
    const seen = new Set<string>();

    for (const targetQuestId of targetQuests) {
      const prereqs = getIncompletePrerequisites(
        targetQuestId,
        questMap,
        progressMap,
        seen
      );
      prereqs.forEach((id) => prerequisitesToComplete.add(id));
    }

    // Remove target quests from prerequisites (they should be AVAILABLE, not COMPLETED)
    const targetQuestSet = new Set(targetQuests);
    targetQuestSet.forEach((id) => prerequisitesToComplete.delete(id));

    // Batch upsert all prerequisites as COMPLETED
    const completedIds: string[] = [];
    const prerequisiteArray = Array.from(prerequisitesToComplete);

    if (prerequisiteArray.length > 0) {
      // Use transaction for atomicity
      await prisma.$transaction(async (tx) => {
        for (const questId of prerequisiteArray) {
          await tx.questProgress.upsert({
            where: {
              userId_questId: {
                userId: session.user.id,
                questId,
              },
            },
            create: {
              userId: session.user.id,
              questId,
              status: "COMPLETED",
              syncSource: "WEB",
            },
            update: {
              status: "COMPLETED",
              syncSource: "WEB",
            },
          });
          completedIds.push(questId);
        }
      });
    }

    // Set target quests as AVAILABLE
    const availableIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const questId of targetQuests) {
        const currentStatus = progressMap.get(questId);
        // Only update if not already completed
        if (currentStatus !== "COMPLETED") {
          await tx.questProgress.upsert({
            where: {
              userId_questId: {
                userId: session.user.id,
                questId,
              },
            },
            create: {
              userId: session.user.id,
              questId,
              status: "AVAILABLE",
              syncSource: "WEB",
            },
            update: {
              status: "AVAILABLE",
              syncSource: "WEB",
            },
          });
          availableIds.push(questId);
        }
      }
    });

    return NextResponse.json({
      success: true,
      completed: completedIds,
      available: availableIds,
      totalChanged: completedIds.length + availableIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error in catch-up sync:", error);
    return NextResponse.json(
      { error: "Failed to sync progress" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trader = searchParams.get("trader");
    const map = searchParams.get("map");
    const kappa = searchParams.get("kappa");
    const search = searchParams.get("search");

    // Get current user session for progress
    const session = await auth();
    const userId = session?.user?.id;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (trader) {
      where.traderId = trader;
    }

    if (kappa === "true") {
      where.kappaRequired = true;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (map) {
      where.objectives = {
        some: {
          map: map,
        },
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

    // Transform to include computed status
    const questsWithStatus = quests.map((quest: any) => {
      const progress = quest.progress?.[0] || null;

      // Compute status based on dependencies
      let computedStatus = "available";

      if (progress) {
        computedStatus = progress.status.toLowerCase();
      } else {
        // Check if all dependencies are completed
        const hasIncompleteDeps = quest.dependsOn.some((dep: any) => {
          const depQuest = quests.find((q: any) => q.id === dep.requiredQuest.id);
          const depProgress = depQuest?.progress?.[0];
          return !depProgress || depProgress.status !== "COMPLETED";
        });

        if (quest.dependsOn.length > 0 && hasIncompleteDeps) {
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
    console.error("Error fetching quests:", error);
    return NextResponse.json(
      { error: "Failed to fetch quests" },
      { status: 500 }
    );
  }
}

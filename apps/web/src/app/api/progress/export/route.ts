import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET /api/progress/export - Export all progress as JSON
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all progress with quest details
    const progress = await prisma.questProgress.findMany({
      where: { userId: session.user.id },
      include: {
        quest: {
          select: {
            id: true,
            title: true,
            traderId: true,
            trader: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        playerLevel: true,
      },
    });

    // Format export data
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        email: user?.email,
        playerLevel: user?.playerLevel,
      },
      summary: {
        total: progress.length,
        completed: progress.filter((p) => p.status === "COMPLETED").length,
        available: progress.filter(
          (p) => p.status === "AVAILABLE" || p.status === "IN_PROGRESS"
        ).length,
        locked: progress.filter((p) => p.status === "LOCKED").length,
      },
      quests: progress.map((p) => ({
        questId: p.questId,
        questTitle: p.quest.title,
        trader: p.quest.trader.name,
        status: p.status.toLowerCase(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eft-tracker-progress-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error exporting progress:");
    return NextResponse.json(
      { error: "Failed to export progress" },
      { status: 500 }
    );
  }
}

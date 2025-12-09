import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/companion/quests
 *
 * Returns a lightweight map of quest IDs to quest names.
 * This endpoint is public (no auth required) for the companion app.
 */
export async function GET() {
  try {
    const quests = await prisma.quest.findMany({
      select: {
        id: true,
        title: true,
        trader: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    // Return as a simple object mapping id -> { title, trader }
    const questMap: Record<string, { title: string; trader: string }> = {};
    for (const quest of quests) {
      questMap[quest.id] = {
        title: quest.title,
        trader: quest.trader.name,
      };
    }

    return NextResponse.json({
      quests: questMap,
      count: quests.length,
    });
  } catch (error) {
    console.error("Failed to fetch quest names:", error);
    return NextResponse.json(
      { error: "Failed to fetch quest names" },
      { status: 500 }
    );
  }
}

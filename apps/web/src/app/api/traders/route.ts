import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

type TraderWithCount = Prisma.TraderGetPayload<{
  include: {
    _count: {
      select: { quests: true };
    };
  };
}>;

async function handleGET() {
  try {
    const traders = await prisma.trader.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { quests: true },
        },
      },
    });

    // Add quest count to response
    const tradersWithCount = traders.map((trader: TraderWithCount) => ({
      id: trader.id,
      name: trader.name,
      color: trader.color,
      questCount: trader._count.quests,
    }));

    return NextResponse.json({
      traders: tradersWithCount,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching traders");
    return NextResponse.json(
      { error: "Failed to fetch traders" },
      { status: 500 }
    );
  }
}

// Note: Rate limiting removed for read-only public data endpoint
// Public trader information should be freely accessible without limits
export const GET = handleGET;

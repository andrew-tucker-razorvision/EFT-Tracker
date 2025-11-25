import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TraderWithCount = Prisma.TraderGetPayload<{
  include: {
    _count: {
      select: { quests: true };
    };
  };
}>;

export async function GET() {
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
    console.error("Error fetching traders:", error);
    return NextResponse.json(
      { error: "Failed to fetch traders" },
      { status: 500 }
    );
  }
}

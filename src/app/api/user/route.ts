import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/user - Get current user settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        playerLevel: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  playerLevel: z
    .number()
    .int()
    .min(1, "Level must be at least 1")
    .max(79, "Level cannot exceed 79")
    .nullable()
    .optional(),
  name: z.string().min(1).max(100).optional(),
});

// PATCH /api/user - Update current user settings
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.playerLevel !== undefined && {
          playerLevel: data.playerLevel,
        }),
        ...(data.name !== undefined && { name: data.name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        playerLevel: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * API Integration Tests - Quests Endpoint
 *
 * Tests the /api/quests endpoint with MSW mocking the database layer.
 * These tests verify the API route logic, query parameters, and response format.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/quests/route";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    quest: {
      findMany: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

const mockQuests = [
  {
    id: "quest-1",
    title: "Debut",
    description: "Kill 5 Scavs",
    traderId: "trader-prapor",
    levelRequired: 1,
    kappaRequired: true,
    wikiUrl: "https://wiki.example.com/debut",
    trader: {
      id: "trader-prapor",
      name: "Prapor",
      color: "#C9A634",
    },
    objectives: [
      {
        id: "obj-1",
        questId: "quest-1",
        description: "Kill 5 Scavs on any location",
        type: "kill",
        target: "scav",
        count: 5,
        map: null,
      },
    ],
    dependsOn: [],
    dependedOnBy: [],
    progress: [],
  },
  {
    id: "quest-2",
    title: "Checking",
    description: "Find the watch",
    traderId: "trader-prapor",
    levelRequired: 1,
    kappaRequired: true,
    wikiUrl: null,
    trader: {
      id: "trader-prapor",
      name: "Prapor",
      color: "#C9A634",
    },
    objectives: [
      {
        id: "obj-2",
        questId: "quest-2",
        description: "Find the watch in Customs",
        type: "find",
        target: "watch",
        count: 1,
        map: "customs",
      },
    ],
    dependsOn: [
      {
        requiredId: "quest-1",
        dependentId: "quest-2",
        requiredQuest: {
          id: "quest-1",
          title: "Debut",
          trader: { id: "trader-prapor", name: "Prapor", color: "#C9A634" },
        },
      },
    ],
    dependedOnBy: [],
    progress: [],
  },
  {
    id: "quest-3",
    title: "Therapist Task",
    description: "Medical quest",
    traderId: "trader-therapist",
    levelRequired: 5,
    kappaRequired: false,
    wikiUrl: null,
    trader: {
      id: "trader-therapist",
      name: "Therapist",
      color: "#6D88A8",
    },
    objectives: [
      {
        id: "obj-3",
        questId: "quest-3",
        description: "Hand over Salewa",
        type: "handover",
        target: "salewa",
        count: 3,
        map: null,
      },
    ],
    dependsOn: [],
    dependedOnBy: [],
    progress: [],
  },
];

describe("/api/quests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("should return all quests without filters", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockResolvedValue(mockQuests as never);

      const request = new Request("http://localhost:3000/api/quests");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests).toHaveLength(3);
      expect(data.total).toBe(3);
    });

    it("should filter quests by kappa requirement", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockResolvedValue([
        mockQuests[0],
        mockQuests[1],
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/quests?kappa=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests).toHaveLength(2);

      // Verify kappa filter was applied
      expect(prisma.quest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kappaRequired: true,
          }),
        })
      );
    });

    it("should filter quests by search term", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockResolvedValue([
        mockQuests[0],
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/quests?search=Debut"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests).toHaveLength(1);
      expect(data.quests[0].title).toBe("Debut");

      // Verify search filter was applied
      expect(prisma.quest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: {
              contains: "Debut",
              mode: "insensitive",
            },
          }),
        })
      );
    });

    it("should combine multiple filters", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockResolvedValue([
        mockQuests[0],
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/quests?kappa=true&search=Debut"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests).toHaveLength(1);

      // Verify all filters were applied
      expect(prisma.quest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kappaRequired: true,
            title: {
              contains: "Debut",
              mode: "insensitive",
            },
          }),
        })
      );
    });

    it("should include user progress when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const questsWithProgress = mockQuests.map((q) => ({
        ...q,
        progress: q.id === "quest-1" ? [{ status: "COMPLETED" }] : [],
      }));
      vi.mocked(prisma.quest.findMany).mockResolvedValue(
        questsWithProgress as never
      );

      const request = new Request("http://localhost:3000/api/quests");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests[0].computedStatus).toBe("completed");

      // Verify progress was included in query
      expect(prisma.quest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            progress: {
              where: { userId: "user-123" },
            },
          }),
        })
      );
    });

    it("should compute locked status for quests with incomplete dependencies", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      // Quest 1 not completed, quest 2 depends on quest 1
      vi.mocked(prisma.quest.findMany).mockResolvedValue(mockQuests as never);

      const request = new Request("http://localhost:3000/api/quests");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Quest 1 should be available (no deps)
      expect(data.quests[0].computedStatus).toBe("available");
      // Quest 2 should be locked (quest 1 not completed)
      expect(data.quests[1].computedStatus).toBe("locked");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/quests");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch quests");
    });

    it("should order quests by level and title", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findMany).mockResolvedValue(mockQuests as never);

      const request = new Request("http://localhost:3000/api/quests");
      await GET(request);

      expect(prisma.quest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ levelRequired: "asc" }, { title: "asc" }],
        })
      );
    });
  });
});

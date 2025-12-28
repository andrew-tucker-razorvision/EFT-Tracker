/**
 * Integration tests for catch-up API route
 * Tests the /api/progress/catch-up endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma with factory function (must be at top level without external vars)
vi.mock("@/lib/prisma", () => {
  const mockUpsert = vi.fn();
  const mockQuestFindMany = vi.fn();
  const mockProgressFindMany = vi.fn();
  const mockTransaction = vi.fn();

  return {
    prisma: {
      questProgress: {
        upsert: mockUpsert,
        findMany: mockProgressFindMany,
      },
      quest: {
        findMany: mockQuestFindMany,
      },
      $transaction: mockTransaction,
    },
    // Export mocks for test access
    __mocks: {
      mockUpsert,
      mockQuestFindMany,
      mockProgressFindMany,
      mockTransaction,
    },
  };
});

// Mock auth with factory
vi.mock("@/lib/auth", () => {
  const mockAuth = vi.fn();
  return {
    auth: () => mockAuth(),
    __mocks: { mockAuth },
  };
});

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks are set up
import { POST } from "@/app/api/progress/catch-up/route";
import { __mocks as prismaMocks } from "@/lib/prisma";
import { __mocks as authMocks } from "@/lib/auth";

// Create a mock quest graph:
// A (Lv 10) -> B (Lv 12) -> C (terminal, Lv 14)
//                       -> D (Lv 15) -> E (terminal, Lv 17)
const mockQuestsFromDb = [
  {
    id: "A",
    title: "Quest A",
    levelRequired: 10,
    dependsOn: [],
  },
  {
    id: "B",
    title: "Quest B",
    levelRequired: 12,
    dependsOn: [{ requiredQuest: { id: "A" } }],
  },
  {
    id: "C",
    title: "Quest C",
    levelRequired: 14,
    dependsOn: [{ requiredQuest: { id: "B" } }],
  },
  {
    id: "D",
    title: "Quest D",
    levelRequired: 15,
    dependsOn: [{ requiredQuest: { id: "B" } }],
  },
  {
    id: "E",
    title: "Quest E",
    levelRequired: 17,
    dependsOn: [{ requiredQuest: { id: "D" } }],
  },
];

// Extract mock functions for easier access
const { mockUpsert, mockQuestFindMany, mockProgressFindMany, mockTransaction } =
  prismaMocks as {
    mockUpsert: ReturnType<typeof vi.fn>;
    mockQuestFindMany: ReturnType<typeof vi.fn>;
    mockProgressFindMany: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
  };
const { mockAuth } = authMocks as { mockAuth: ReturnType<typeof vi.fn> };

describe("catch-up API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "test-user-id" },
    });
    mockQuestFindMany.mockResolvedValue(mockQuestsFromDb);
    mockProgressFindMany.mockResolvedValue([]); // No existing progress by default
    mockUpsert.mockResolvedValue({});
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) => {
        await callback({
          questProgress: {
            upsert: mockUpsert,
          },
        });
      }
    );
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("returns 400 when targetQuests is empty", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: [],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 when targetQuests is missing", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerLevel: 15,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 when playerLevel is missing", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 when playerLevel is out of range", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 80, // Max is 79
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 404 when target quest does not exist", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["non-existent-quest"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("Quest not found");
    });
  });

  describe("Prerequisites Completion", () => {
    it("completes all prerequisites for target quest", async () => {
      const upsertedQuests: { questId: string; status: string }[] = [];
      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<void>) => {
          await callback({
            questProgress: {
              upsert: vi
                .fn()
                .mockImplementation(
                  ({
                    where,
                    create,
                    update,
                  }: {
                    where: { userId_questId: { questId: string } };
                    create: { questId: string; status: string };
                    update: { status: string };
                  }) => {
                    upsertedQuests.push({
                      questId: where.userId_questId.questId,
                      status: create.status,
                    });
                    return Promise.resolve({});
                  }
                ),
            },
          });
        }
      );

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // D has prerequisites A and B
      expect(data.completed).toContain("A");
      expect(data.completed).toContain("B");
      // D itself should be available, not completed
      expect(data.completed).not.toContain("D");
      expect(data.available).toContain("D");
    });

    it("skips already completed prerequisites", async () => {
      // Simulate A is already completed
      mockProgressFindMany.mockResolvedValue([
        { questId: "A", status: "COMPLETED" },
      ]);

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // A should not be in completed since it was already done
      expect(data.completed).not.toContain("A");
      // B should be completed since it wasn't done yet
      expect(data.completed).toContain("B");
    });
  });

  describe("Response Format", () => {
    it("returns success with all required fields", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("completed");
      expect(data).toHaveProperty("completedBranches");
      expect(data).toHaveProperty("levelCompleted");
      expect(data).toHaveProperty("available");
      expect(data).toHaveProperty("totalChanged");
      expect(Array.isArray(data.completed)).toBe(true);
      expect(Array.isArray(data.completedBranches)).toBe(true);
      expect(Array.isArray(data.levelCompleted)).toBe(true);
      expect(Array.isArray(data.available)).toBe(true);
      expect(typeof data.totalChanged).toBe("number");
    });

    it("calculates totalChanged correctly", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // totalChanged should equal completed + completedBranches + levelCompleted + available count
      expect(data.totalChanged).toBe(
        data.completed.length +
          data.completedBranches.length +
          data.levelCompleted.length +
          data.available.length
      );
    });
  });

  describe("Multiple Targets", () => {
    it("handles multiple target quests", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["C", "E"],
          playerLevel: 17,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Both C and E require A and B as prerequisites
      expect(data.completed).toContain("A");
      expect(data.completed).toContain("B");
      // E also requires D
      expect(data.completed).toContain("D");
      // Both C and E should be available
      expect(data.available).toContain("C");
      expect(data.available).toContain("E");
    });
  });

  describe("Confirmed Branches", () => {
    it("completes confirmed branch quests and their prerequisites", async () => {
      // Add a sibling branch quest F that shares ancestor A with target D
      const questsWithBranch = [
        ...mockQuestsFromDb,
        {
          id: "F",
          title: "Quest F",
          levelRequired: 11,
          dependsOn: [{ requiredQuest: { id: "A" } }],
        },
      ];
      mockQuestFindMany.mockResolvedValue(questsWithBranch);

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
          confirmedBranches: ["F"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // F should be in completedBranches
      expect(data.completedBranches).toContain("F");
      // A and B should be completed as prerequisites of D
      expect(data.completed).toContain("A");
      expect(data.completed).toContain("B");
    });

    it("ignores invalid branch quest IDs", async () => {
      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["D"],
          playerLevel: 15,
          confirmedBranches: ["non-existent-branch"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should succeed but have empty completedBranches
      expect(data.completedBranches).toEqual([]);
    });
  });

  describe("Downstream Quest Exclusion", () => {
    it("does NOT complete downstream quests of targets even if below player level", async () => {
      // Quest graph: A -> B -> C (target) -> D -> E
      // At level 20, D and E are below player level but should NOT be completed
      // because they depend ON the target C
      const questsWithDownstream = [
        {
          id: "A",
          title: "Quest A",
          levelRequired: 5,
          dependsOn: [],
        },
        {
          id: "B",
          title: "Quest B",
          levelRequired: 8,
          dependsOn: [{ requiredQuest: { id: "A" } }],
        },
        {
          id: "C",
          title: "Quest C (Target)",
          levelRequired: 10,
          dependsOn: [{ requiredQuest: { id: "B" } }],
        },
        {
          id: "D",
          title: "Quest D (Downstream)",
          levelRequired: 12, // Below player level 20
          dependsOn: [{ requiredQuest: { id: "C" } }],
        },
        {
          id: "E",
          title: "Quest E (Downstream)",
          levelRequired: 15, // Below player level 20
          dependsOn: [{ requiredQuest: { id: "D" } }],
        },
      ];
      mockQuestFindMany.mockResolvedValue(questsWithDownstream);

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["C"],
          playerLevel: 20,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Prerequisites A and B should be completed
      expect(data.completed).toContain("A");
      expect(data.completed).toContain("B");

      // Target C should be available (not completed)
      expect(data.available).toContain("C");
      expect(data.completed).not.toContain("C");

      // Downstream quests D and E should NOT be in any completion list
      // They should remain locked until C is completed
      expect(data.completed).not.toContain("D");
      expect(data.completed).not.toContain("E");
      expect(data.levelCompleted).not.toContain("D");
      expect(data.levelCompleted).not.toContain("E");
      expect(data.completedBranches).not.toContain("D");
      expect(data.completedBranches).not.toContain("E");
    });

    it("excludes entire downstream chain, not just direct dependents", async () => {
      // Quest graph: Target -> X -> Y -> Z
      // All of X, Y, Z should be excluded even though they're below player level
      const questsWithDeepDownstream = [
        {
          id: "Target",
          title: "Target Quest",
          levelRequired: 5,
          dependsOn: [],
        },
        {
          id: "X",
          title: "Downstream X",
          levelRequired: 6,
          dependsOn: [{ requiredQuest: { id: "Target" } }],
        },
        {
          id: "Y",
          title: "Downstream Y",
          levelRequired: 7,
          dependsOn: [{ requiredQuest: { id: "X" } }],
        },
        {
          id: "Z",
          title: "Downstream Z",
          levelRequired: 8,
          dependsOn: [{ requiredQuest: { id: "Y" } }],
        },
      ];
      mockQuestFindMany.mockResolvedValue(questsWithDeepDownstream);

      const request = new Request("http://localhost/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: ["Target"],
          playerLevel: 20,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Target should be available
      expect(data.available).toContain("Target");

      // Entire downstream chain should NOT be completed
      expect(data.completed).not.toContain("X");
      expect(data.completed).not.toContain("Y");
      expect(data.completed).not.toContain("Z");
      expect(data.levelCompleted).not.toContain("X");
      expect(data.levelCompleted).not.toContain("Y");
      expect(data.levelCompleted).not.toContain("Z");
    });
  });
});

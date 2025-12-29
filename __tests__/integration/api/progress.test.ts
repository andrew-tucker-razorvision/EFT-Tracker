/**
 * API Integration Tests - Progress Endpoints
 *
 * Tests the /api/progress and /api/progress/[questId] endpoints.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/progress/route";
import { GET as getProgress, PATCH } from "@/app/api/progress/[questId]/route";
import {
  GET as getObjectiveProgress,
  PATCH as patchObjectiveProgress,
} from "@/app/api/progress/objective/[objectiveId]/route";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    questProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    quest: {
      findUnique: vi.fn(),
    },
    questDependency: {
      findMany: vi.fn(),
    },
    objective: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    objectiveProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn()),
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

const mockSession = {
  user: { id: "user-123", email: "test@example.com" },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockProgress = [
  {
    id: "progress-1",
    userId: "user-123",
    questId: "quest-1",
    status: "COMPLETED",
    quest: {
      id: "quest-1",
      title: "Debut",
      trader: { id: "trader-prapor", name: "Prapor", color: "#C9A634" },
    },
  },
  {
    id: "progress-2",
    userId: "user-123",
    questId: "quest-2",
    status: "IN_PROGRESS",
    quest: {
      id: "quest-2",
      title: "Checking",
      trader: { id: "trader-prapor", name: "Prapor", color: "#C9A634" },
    },
  },
];

describe("/api/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/progress", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/progress");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return all progress for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findMany).mockResolvedValue(
        mockProgress as never
      );

      const request = new Request("http://localhost:3000/api/progress");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress).toHaveLength(2);
      expect(prisma.questProgress.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          quest: {
            include: {
              trader: true,
            },
          },
        },
      });
    });

    it("should handle empty progress list", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findMany).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/progress");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress).toHaveLength(0);
    });

    it("should handle database errors", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const request = new Request("http://localhost:3000/api/progress");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch progress");
    });
  });

  describe("POST /api/progress", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "quest-1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when quest does not exist", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "nonexistent" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Quest not found");
    });

    it("should return existing progress if already exists", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue({
        id: "quest-1",
        dependsOn: [],
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(
        mockProgress[0] as never
      );

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "quest-1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.id).toBe("progress-1");
      expect(prisma.questProgress.create).not.toHaveBeenCalled();
    });

    it("should create AVAILABLE progress for quest without dependencies", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue({
        id: "quest-1",
        dependsOn: [],
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.questProgress.create).mockResolvedValue({
        id: "new-progress",
        userId: "user-123",
        questId: "quest-1",
        status: "AVAILABLE",
      } as never);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "quest-1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.progress.status).toBe("AVAILABLE");
      expect(prisma.questProgress.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          questId: "quest-1",
          status: "AVAILABLE",
        },
      });
    });

    it("should create LOCKED progress when dependencies are not completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue({
        id: "quest-2",
        dependsOn: [{ requiredId: "quest-1" }],
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.questProgress.count).mockResolvedValue(0); // No completed deps
      vi.mocked(prisma.questProgress.create).mockResolvedValue({
        id: "new-progress",
        userId: "user-123",
        questId: "quest-2",
        status: "LOCKED",
      } as never);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "quest-2" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.progress.status).toBe("LOCKED");
    });

    it("should create AVAILABLE progress when all dependencies are completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue({
        id: "quest-2",
        dependsOn: [{ requiredId: "quest-1" }],
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.questProgress.count).mockResolvedValue(1); // All deps completed
      vi.mocked(prisma.questProgress.create).mockResolvedValue({
        id: "new-progress",
        userId: "user-123",
        questId: "quest-2",
        status: "AVAILABLE",
      } as never);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "quest-2" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.progress.status).toBe("AVAILABLE");
    });

    it("should return 400 for invalid request body", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost:3000/api/progress", {
        method: "POST",
        body: JSON.stringify({ questId: "" }), // Empty string
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});

describe("/api/progress/[questId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/progress/quest-1");
      const response = await getProgress(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when progress not found", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/progress/quest-1");
      const response = await getProgress(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Progress not found");
    });

    it("should return progress with quest details", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        ...mockProgress[0],
        quest: {
          id: "quest-1",
          title: "Debut",
          trader: { id: "trader-prapor", name: "Prapor", color: "#C9A634" },
          objectives: [],
        },
      } as never);

      const request = new Request("http://localhost:3000/api/progress/quest-1");
      const response = await getProgress(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.questId).toBe("quest-1");
      expect(data.progress.quest.title).toBe("Debut");
    });
  });

  describe("PATCH", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should update status for valid transition (AVAILABLE -> IN_PROGRESS)", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "AVAILABLE",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      // Mock finding dependent quests for auto-unlock (now triggered for IN_PROGRESS too)
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.status).toBe("IN_PROGRESS");
    });

    it("should reject invalid status transition (LOCKED -> IN_PROGRESS)", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "LOCKED",
      } as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid status transition");
    });

    it("should allow LOCKED -> COMPLETED for skip-to-quest feature", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "LOCKED",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);
      // Mock for objective cascade on completion
      vi.mocked(prisma.objective.findMany).mockResolvedValue([
        { id: "obj-1" },
        { id: "obj-2" },
      ] as never);
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({} as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.status).toBe("COMPLETED");
    });

    it("should allow IN_PROGRESS -> COMPLETED transition", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);
      // Mock for objective cascade on completion
      vi.mocked(prisma.objective.findMany).mockResolvedValue([
        { id: "obj-1" },
      ] as never);
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({} as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.status).toBe("COMPLETED");
    });

    it("should auto-unlock dependent quests when quest is completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique)
        .mockResolvedValueOnce({
          id: "progress-1",
          userId: "user-123",
          questId: "quest-1",
          status: "IN_PROGRESS",
        } as never)
        .mockResolvedValueOnce({
          id: "progress-2",
          userId: "user-123",
          questId: "quest-2",
          status: "LOCKED",
        } as never);

      vi.mocked(prisma.questProgress.update)
        .mockResolvedValueOnce({
          id: "progress-1",
          userId: "user-123",
          questId: "quest-1",
          status: "COMPLETED",
        } as never)
        .mockResolvedValueOnce({
          id: "progress-2",
          userId: "user-123",
          questId: "quest-2",
          status: "AVAILABLE",
        } as never);

      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([
        {
          requiredId: "quest-1",
          dependentId: "quest-2",
          requirementStatus: ["complete"],
          dependentQuest: {
            id: "quest-2",
            dependsOn: [
              { requiredId: "quest-1", requirementStatus: ["complete"] },
            ],
          },
        },
      ] as never);

      // Mock finding all progress for dependency check
      vi.mocked(prisma.questProgress.findMany).mockResolvedValue([
        { questId: "quest-1", status: "COMPLETED" },
      ] as never);

      // Mock for objective cascade on completion
      vi.mocked(prisma.objective.findMany).mockResolvedValue([
        { id: "obj-1" },
      ] as never);
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({} as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.unlockedQuests).toContain("quest-2");
    });

    it("should create progress if it does not exist", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue({
        id: "quest-1",
        dependsOn: [],
      } as never);
      vi.mocked(prisma.questProgress.create).mockResolvedValue({
        id: "new-progress",
        userId: "user-123",
        questId: "quest-1",
        status: "AVAILABLE",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "new-progress",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      // Mock for auto-unlock check (now triggered for IN_PROGRESS)
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      await response.json();

      expect(response.status).toBe(200);
      expect(prisma.questProgress.create).toHaveBeenCalled();
    });

    it("should return 404 if quest does not exist when creating progress", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.quest.findUnique).mockResolvedValue(null as any);

      const request = new Request(
        "http://localhost:3000/api/progress/nonexistent",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Quest not found");
    });

    it("should return 400 for invalid status value", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "INVALID_STATUS" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should allow LOCKED -> AVAILABLE for auto-unlock", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "LOCKED",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "AVAILABLE",
      } as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "AVAILABLE" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.status).toBe("AVAILABLE");
    });

    it("should cascade to objectives when quest is completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      // Mock objectives for the quest
      const mockObjectives = [
        { id: "obj-1" },
        { id: "obj-2" },
        { id: "obj-3" },
      ];
      vi.mocked(prisma.objective.findMany).mockResolvedValue(
        mockObjectives as never
      );
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({} as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });

      expect(response.status).toBe(200);
      // Verify objectives were marked complete
      expect(prisma.objective.findMany).toHaveBeenCalledWith({
        where: { questId: "quest-1" },
        select: { id: true },
      });
      expect(prisma.objectiveProgress.upsert).toHaveBeenCalledTimes(3);
    });

    it("should reset objectives when quest is reset to AVAILABLE", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questProgress.update).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "AVAILABLE",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      // Mock objectives for the quest
      const mockObjectives = [{ id: "obj-1" }, { id: "obj-2" }];
      vi.mocked(prisma.objective.findMany).mockResolvedValue(
        mockObjectives as never
      );
      vi.mocked(prisma.objectiveProgress.deleteMany).mockResolvedValue({
        count: 2,
      } as never);

      const request = new Request(
        "http://localhost:3000/api/progress/quest-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "AVAILABLE" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ questId: "quest-1" }),
      });

      expect(response.status).toBe(200);
      // Verify objectives were reset
      expect(prisma.objectiveProgress.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          objectiveId: { in: ["obj-1", "obj-2"] },
        },
      });
    });
  });
});

// Tests for /api/progress/objective/[objectiveId] endpoint
describe("/api/progress/objective/[objectiveId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockObjective = {
    id: "obj-1",
    description: "Kill 5 PMCs",
    optional: false,
    questId: "quest-1",
    count: null, // Binary objective (no count)
    quest: {
      id: "quest-1",
      title: "Debut",
      objectives: [
        {
          id: "obj-1",
          optional: false,
          count: null,
          progress: [],
        },
        {
          id: "obj-2",
          optional: false,
          count: null,
          progress: [],
        },
      ],
      progress: [],
      dependedOnBy: [],
    },
  };

  describe("PATCH /api/progress/objective/[objectiveId]", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when objective not found", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.objective.findUnique).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/nonexistent",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Objective not found");
    });

    it("should return 400 for invalid request body", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: "not-a-boolean" }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });

      expect(response.status).toBe(400);
    });

    it("should update objective progress to completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.objective.findUnique).mockResolvedValue(
        mockObjective as never
      );
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        objectiveId: "obj-1",
        completed: true,
        syncSource: "WEB",
      } as never);
      // No quest progress yet - first objective being completed triggers IN_PROGRESS
      vi.mocked(prisma.questProgress.upsert).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      // Mock for auto-unlock check
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.objectiveProgress.completed).toBe(true);
      expect(prisma.objectiveProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_objectiveId: {
            userId: "user-123",
            objectiveId: "obj-1",
          },
        },
        update: {
          completed: true,
          current: null, // Binary objective, no numeric progress
          target: null,
          syncSource: "WEB",
        },
        create: {
          userId: "user-123",
          objectiveId: "obj-1",
          completed: true,
          current: null, // Binary objective, no numeric progress
          target: null,
          syncSource: "WEB",
        },
      });
    });

    it("should auto-complete quest when all required objectives are done", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // All objectives will be complete after this update
      const mockObjectiveAllDone = {
        ...mockObjective,
        quest: {
          ...mockObjective.quest,
          objectives: [
            { id: "obj-1", optional: false, progress: [] }, // Being completed now
            {
              id: "obj-2",
              optional: false,
              progress: [{ completed: true }],
            }, // Already complete
          ],
        },
      };

      vi.mocked(prisma.objective.findUnique).mockResolvedValue(
        mockObjectiveAllDone as never
      );
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        objectiveId: "obj-1",
        completed: true,
        syncSource: "WEB",
      } as never);
      vi.mocked(prisma.questProgress.upsert).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "COMPLETED",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quest.status).toBe("COMPLETED");
      expect(data.quest.statusChanged).toBe(true);
    });

    it("should set quest to IN_PROGRESS when first objective is completed", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Quest has no progress yet, first objective being completed
      const mockObjectiveNoProgress = {
        ...mockObjective,
        quest: {
          ...mockObjective.quest,
          progress: [], // No quest progress yet
        },
      };

      vi.mocked(prisma.objective.findUnique).mockResolvedValue(
        mockObjectiveNoProgress as never
      );
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        objectiveId: "obj-1",
        completed: true,
        syncSource: "WEB",
      } as never);
      vi.mocked(prisma.questProgress.upsert).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quest.status).toBe("IN_PROGRESS");
      expect(data.quest.statusChanged).toBe(true);
    });

    it("should return objectives summary in response", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const mockObjectiveWithSummary = {
        ...mockObjective,
        quest: {
          ...mockObjective.quest,
          objectives: [
            { id: "obj-1", optional: false, progress: [] },
            {
              id: "obj-2",
              optional: false,
              progress: [{ completed: true }],
            },
            { id: "obj-3", optional: true, progress: [] },
          ],
        },
      };

      vi.mocked(prisma.objective.findUnique).mockResolvedValue(
        mockObjectiveWithSummary as never
      );
      vi.mocked(prisma.objectiveProgress.upsert).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        objectiveId: "obj-1",
        completed: true,
        syncSource: "WEB",
      } as never);
      vi.mocked(prisma.questProgress.findUnique).mockResolvedValue({
        id: "quest-progress-1",
        userId: "user-123",
        questId: "quest-1",
        status: "IN_PROGRESS",
      } as never);
      vi.mocked(prisma.questDependency.findMany).mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }
      );
      const response = await patchObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quest.objectivesSummary).toEqual({
        total: 3,
        completed: 2, // obj-1 (just completed) + obj-2 (already complete)
      });
    });
  });

  describe("GET /api/progress/objective/[objectiveId]", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1"
      );
      const response = await getObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return existing objective progress", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.objectiveProgress.findUnique).mockResolvedValue({
        id: "progress-1",
        userId: "user-123",
        objectiveId: "obj-1",
        completed: true,
        syncSource: "WEB",
        objective: {
          id: "obj-1",
          description: "Kill 5 PMCs",
          quest: {
            id: "quest-1",
            title: "Debut",
          },
        },
      } as never);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1"
      );
      const response = await getObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.objectiveProgress.completed).toBe(true);
      expect(data.objective.quest.title).toBe("Debut");
    });

    it("should return default progress when no progress exists", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.objectiveProgress.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.objective.findUnique).mockResolvedValue({
        id: "obj-1",
        description: "Kill 5 PMCs",
        quest: {
          id: "quest-1",
          title: "Debut",
        },
      } as never);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/obj-1"
      );
      const response = await getObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "obj-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.objectiveProgress.completed).toBe(false);
      expect(data.objectiveProgress.objectiveId).toBe("obj-1");
    });

    it("should return 404 when objective does not exist", async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.objectiveProgress.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.objective.findUnique).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/progress/objective/nonexistent"
      );
      const response = await getObjectiveProgress(request, {
        params: Promise.resolve({ objectiveId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Objective not found");
    });
  });
});

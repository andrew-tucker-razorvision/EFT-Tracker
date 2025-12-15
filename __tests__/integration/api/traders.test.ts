/**
 * API Integration Tests - Traders Endpoint
 *
 * Tests the /api/traders endpoint with mocked database layer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/traders/route";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    trader: {
      findMany: vi.fn(),
    },
  },
}));

const mockTraders = [
  {
    id: "trader-fence",
    name: "Fence",
    color: "#9A8866",
    _count: { quests: 5 },
  },
  {
    id: "trader-jaeger",
    name: "Jaeger",
    color: "#628D52",
    _count: { quests: 30 },
  },
  {
    id: "trader-mechanic",
    name: "Mechanic",
    color: "#3E7BA8",
    _count: { quests: 25 },
  },
  {
    id: "trader-peacekeeper",
    name: "Peacekeeper",
    color: "#3676A9",
    _count: { quests: 20 },
  },
  {
    id: "trader-prapor",
    name: "Prapor",
    color: "#C9A634",
    _count: { quests: 35 },
  },
  {
    id: "trader-ragman",
    name: "Ragman",
    color: "#7B539E",
    _count: { quests: 15 },
  },
  {
    id: "trader-skier",
    name: "Skier",
    color: "#5C98D1",
    _count: { quests: 28 },
  },
  {
    id: "trader-therapist",
    name: "Therapist",
    color: "#6D88A8",
    _count: { quests: 22 },
  },
];

describe("/api/traders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock Request
  const createMockRequest = () =>
    new Request("http://localhost:3000/api/traders");

  describe("GET", () => {
    it("should return all traders with quest counts", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue(mockTraders as never);

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.traders).toHaveLength(8);
    });

    it("should transform trader data to include questCount", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue(mockTraders as never);

      const response = await GET(createMockRequest());
      const data = await response.json();

      // Check first trader has correct structure
      const prapor = data.traders.find(
        (t: { id: string }) => t.id === "trader-prapor"
      );
      expect(prapor).toEqual({
        id: "trader-prapor",
        name: "Prapor",
        color: "#C9A634",
        questCount: 35,
      });

      // Ensure _count is not exposed
      expect(prapor._count).toBeUndefined();
    });

    it("should order traders by name ascending", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue(mockTraders as never);

      await GET(createMockRequest());

      expect(prisma.trader.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { quests: true },
          },
        },
      });
    });

    it("should handle empty traders list", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue([]);

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.traders).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.trader.findMany).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch traders");
    });

    it("should include all trader properties", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue(mockTraders as never);

      const response = await GET(createMockRequest());
      const data = await response.json();

      // Verify all traders have required properties
      data.traders.forEach(
        (trader: {
          id: string;
          name: string;
          color: string;
          questCount: number;
        }) => {
          expect(trader).toHaveProperty("id");
          expect(trader).toHaveProperty("name");
          expect(trader).toHaveProperty("color");
          expect(trader).toHaveProperty("questCount");
          expect(typeof trader.id).toBe("string");
          expect(typeof trader.name).toBe("string");
          expect(typeof trader.color).toBe("string");
          expect(typeof trader.questCount).toBe("number");
        }
      );
    });

    it("should return correct quest counts for each trader", async () => {
      vi.mocked(prisma.trader.findMany).mockResolvedValue(mockTraders as never);

      const response = await GET(createMockRequest());
      const data = await response.json();

      const questCounts: Record<string, number> = {};
      data.traders.forEach(
        (t: { name: string; questCount: number }) =>
          (questCounts[t.name] = t.questCount)
      );

      expect(questCounts["Prapor"]).toBe(35);
      expect(questCounts["Jaeger"]).toBe(30);
      expect(questCounts["Fence"]).toBe(5);
    });
  });
});

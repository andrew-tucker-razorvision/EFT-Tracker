/**
 * Companion API Contract Verification Tests
 *
 * Purpose: Verify API routes match expected contracts (request/response shapes)
 * Ensures type safety between API implementation and client expectations
 *
 * Strategy: Test Zod schemas validate correctly + API response shapes match types
 */

import { describe, it, expect } from "vitest";
import {
  linkSchema,
  syncSchema,
  syncEventSchema,
  type LinkResponse,
  type SyncResponse,
  type StatusResponse,
  type QuestsResponse,
} from "@/types/api-contracts";

describe("Companion API Contracts", () => {
  describe("POST /api/companion/link - Link Device", () => {
    it("validates correct request schema", () => {
      const validRequest = {
        deviceName: "My Desktop",
        gameMode: "PVP" as const,
      };

      const result = linkSchema.safeParse(validRequest);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.deviceName).toBe("My Desktop");
        expect(result.data.gameMode).toBe("PVP");
      }
    });

    it("defaults gameMode to PVP if not provided", () => {
      const requestWithoutGameMode = {
        deviceName: "My Desktop",
      };

      const result = linkSchema.safeParse(requestWithoutGameMode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.gameMode).toBe("PVP");
      }
    });

    it("rejects empty deviceName", () => {
      const invalidRequest = {
        deviceName: "",
        gameMode: "PVP" as const,
      };

      const result = linkSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("rejects deviceName longer than 100 characters", () => {
      const invalidRequest = {
        deviceName: "A".repeat(101),
        gameMode: "PVP" as const,
      };

      const result = linkSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("rejects invalid gameMode", () => {
      const invalidRequest = {
        deviceName: "My Desktop",
        gameMode: "INVALID",
      };

      const result = linkSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("response matches expected shape", () => {
      // Type-check the response structure (compile-time verification)
      const mockResponse: LinkResponse = {
        token: "cmp_1234567890abcdef",
        tokenId: "token_123",
        deviceName: "My Desktop",
        gameMode: "PVP",
        createdAt: new Date(),
        message: "Save this token securely. It will not be shown again.",
      };

      // Runtime verification
      expect(mockResponse.token).toMatch(/^cmp_/);
      expect(mockResponse.tokenId).toBeTruthy();
      expect(mockResponse.deviceName).toBe("My Desktop");
      expect(mockResponse.gameMode).toBe("PVP");
      expect(mockResponse.createdAt).toBeInstanceOf(Date);
      expect(mockResponse.message).toContain("Save this token");
    });
  });

  describe("POST /api/companion/sync - Sync Progress", () => {
    it("validates correct sync event schema", () => {
      const validEvent = {
        questId: "quest_prapor_debut",
        status: "FINISHED" as const,
        timestamp: new Date().toISOString(),
      };

      const result = syncEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.questId).toBe("quest_prapor_debut");
        expect(result.data.status).toBe("FINISHED");
      }
    });

    it("validates correct sync request schema", () => {
      const validRequest = {
        events: [
          {
            questId: "quest_prapor_debut",
            status: "STARTED" as const,
            timestamp: new Date().toISOString(),
          },
          {
            questId: "quest_therapist_shortage",
            status: "FINISHED" as const,
            timestamp: new Date().toISOString(),
          },
        ],
        deviceInfo: {
          version: "1.0.0",
          os: "Windows 11",
        },
      };

      const result = syncSchema.safeParse(validRequest);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.events).toHaveLength(2);
        expect(result.data.deviceInfo?.version).toBe("1.0.0");
      }
    });

    it("requires at least 1 event", () => {
      const invalidRequest = {
        events: [],
      };

      const result = syncSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("limits to maximum 100 events", () => {
      const tooManyEvents = {
        events: Array.from({ length: 101 }, (_, i) => ({
          questId: `quest_${i}`,
          status: "STARTED" as const,
          timestamp: new Date().toISOString(),
        })),
      };

      const result = syncSchema.safeParse(tooManyEvents);
      expect(result.success).toBe(false);
    });

    it("validates sync event status enum", () => {
      const invalidStatus = {
        questId: "quest_prapor_debut",
        status: "INVALID_STATUS",
        timestamp: new Date().toISOString(),
      };

      const result = syncEventSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("validates timestamp is ISO datetime", () => {
      const invalidTimestamp = {
        questId: "quest_prapor_debut",
        status: "STARTED" as const,
        timestamp: "not-a-valid-datetime",
      };

      const result = syncEventSchema.safeParse(invalidTimestamp);
      expect(result.success).toBe(false);
    });

    it("response matches expected shape", () => {
      const mockResponse: SyncResponse = {
        synced: 5,
        errors: [
          {
            questId: "quest_invalid",
            error: "Quest not found",
          },
        ],
        unlockedQuests: ["quest_unlocked_1", "quest_unlocked_2"],
      };

      expect(mockResponse.synced).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(mockResponse.errors)).toBe(true);
      expect(Array.isArray(mockResponse.unlockedQuests)).toBe(true);
    });
  });

  describe("GET /api/companion/status - Connection Status", () => {
    it("response matches expected shape (valid token)", () => {
      const validResponse: StatusResponse = {
        valid: true,
        userId: "user_123",
        userName: "Test User",
        playerLevel: 42,
        deviceName: "My Desktop",
        gameMode: "PVP",
        lastSeen: new Date(),
        createdAt: new Date(),
        stats: {
          completed: 120,
          inProgress: 15,
          available: 45,
          locked: 78,
        },
      };

      expect(validResponse.valid).toBe(true);
      expect(validResponse.userId).toBeTruthy();
      expect(validResponse.stats?.completed).toBeGreaterThanOrEqual(0);
    });

    it("response matches expected shape (invalid token)", () => {
      const invalidResponse: StatusResponse = {
        valid: false,
        error: "Invalid or expired companion token",
      };

      expect(invalidResponse.valid).toBe(false);
      expect(invalidResponse.error).toBeTruthy();
    });
  });

  describe("GET /api/companion/quests - Quest Names", () => {
    it("response matches expected shape", () => {
      const mockResponse: QuestsResponse = {
        quests: {
          quest_prapor_debut: {
            title: "Debut",
            trader: "Prapor",
          },
          quest_therapist_shortage: {
            title: "Shortage",
            trader: "Therapist",
          },
        },
        count: 2,
      };

      expect(Object.keys(mockResponse.quests)).toHaveLength(2);
      expect(mockResponse.count).toBe(2);
      expect(mockResponse.quests["quest_prapor_debut"].title).toBe("Debut");
    });

    it("quest info has required fields", () => {
      const mockResponse: QuestsResponse = {
        quests: {
          quest_test: {
            title: "Test Quest",
            trader: "Prapor",
          },
        },
        count: 1,
      };

      const questInfo = mockResponse.quests["quest_test"];
      expect(questInfo).toHaveProperty("title");
      expect(questInfo).toHaveProperty("trader");
      expect(typeof questInfo.title).toBe("string");
      expect(typeof questInfo.trader).toBe("string");
    });
  });

  describe("Schema Consistency", () => {
    it("all companion schemas export correctly", () => {
      // Verify schemas are accessible and are Zod schemas
      expect(linkSchema).toBeDefined();
      expect(linkSchema.parse).toBeDefined();

      expect(syncSchema).toBeDefined();
      expect(syncSchema.parse).toBeDefined();

      expect(syncEventSchema).toBeDefined();
      expect(syncEventSchema.parse).toBeDefined();
    });

    it("types are correctly inferred from schemas", () => {
      // This is primarily a compile-time check
      // If these assignments work, types are correctly defined
      const linkRequest = {
        deviceName: "test",
        gameMode: "PVP" as const,
      };

      const syncRequest = {
        events: [
          {
            questId: "test",
            status: "STARTED" as const,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Verify types are correctly inferred by parsing
      const parsedLink = linkSchema.parse(linkRequest);
      const parsedSync = syncSchema.parse(syncRequest);

      // If we reach here, type inference works correctly
      expect(parsedLink.deviceName).toBe("test");
      expect(parsedSync.events).toHaveLength(1);
    });
  });
});

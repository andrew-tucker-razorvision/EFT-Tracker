import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import {
  logSecurityEvent,
  getUserSecurityEvents,
  getIpSecurityEvents,
} from "@/lib/security-logger";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    securityEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("security-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logSecurityEvent", () => {
    it("should create security event with hashed email", async () => {
      const mockEmail = "test@example.com";
      const expectedHash = crypto
        .createHash("sha256")
        .update(mockEmail)
        .digest("hex");

      await logSecurityEvent({
        type: "LOGIN_SUCCESS",
        userId: "user123",
        email: mockEmail,
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
      });

      expect(prisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          type: "LOGIN_SUCCESS",
          userId: "user123",
          ipAddress: "1.2.3.4",
          userAgent: "Mozilla/5.0",
          metadata: {
            emailHash: expectedHash,
          },
        },
      });
    });

    it("should create security event without email", async () => {
      await logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { endpoint: "/api/test" },
      });

      expect(prisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          type: "RATE_LIMIT_EXCEEDED",
          userId: undefined,
          ipAddress: "1.2.3.4",
          userAgent: "Mozilla/5.0",
          metadata: {
            endpoint: "/api/test",
            emailHash: undefined,
          },
        },
      });
    });

    it("should check failed login threshold", async () => {
      // Mock count returning 11 (above threshold of 10)
      vi.mocked(prisma.securityEvent.count).mockResolvedValue(11);

      await logSecurityEvent({
        type: "LOGIN_FAILED",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { reason: "invalid_password" },
      });

      // Verify threshold check was performed
      expect(prisma.securityEvent.count).toHaveBeenCalledWith({
        where: {
          type: "LOGIN_FAILED",
          ipAddress: "1.2.3.4",
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });

      // Verify alert was logged (pino style: data object first, message second)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "1.2.3.4",
          failedAttempts: 11,
        }),
        "Suspicious login activity detected - possible brute force attack"
      );
    });

    it("should check rate limit pattern", async () => {
      // Mock count returning 6 (above threshold of 5)
      vi.mocked(prisma.securityEvent.count).mockResolvedValue(6);

      await logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { endpoint: "/api/test" },
      });

      // Verify threshold check was performed
      expect(prisma.securityEvent.count).toHaveBeenCalledWith({
        where: {
          type: "RATE_LIMIT_EXCEEDED",
          ipAddress: "1.2.3.4",
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });

      // Verify alert was logged (pino style: data object first, message second)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "1.2.3.4",
          rateLimitHits: 6,
        }),
        "Repeated rate limit violations - possible automated attack"
      );
    });

    it("should not alert if below failed login threshold", async () => {
      // Mock count returning 5 (below threshold of 10)
      vi.mocked(prisma.securityEvent.count).mockResolvedValue(5);

      await logSecurityEvent({
        type: "LOGIN_FAILED",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { reason: "invalid_password" },
      });

      // Verify no alert was logged
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should not alert if below rate limit threshold", async () => {
      // Mock count returning 3 (below threshold of 5)
      vi.mocked(prisma.securityEvent.count).mockResolvedValue(3);

      await logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { endpoint: "/api/test" },
      });

      // Verify no alert was logged
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should handle logging errors gracefully", async () => {
      const mockError = new Error("Database error");
      vi.mocked(prisma.securityEvent.create).mockRejectedValue(mockError);

      // Should not throw
      await expect(
        logSecurityEvent({
          type: "LOGIN_SUCCESS",
          userId: "user123",
          ipAddress: "1.2.3.4",
        })
      ).resolves.not.toThrow();

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: mockError,
          eventType: "LOGIN_SUCCESS",
        }),
        "Failed to log security event"
      );
    });

    it("should log all security event types", async () => {
      const eventTypes = [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "ACCOUNT_CREATED",
        "TOKEN_GENERATED",
        "TOKEN_REVOKED",
        "PASSWORD_RESET_REQUESTED",
        "RATE_LIMIT_EXCEEDED",
      ] as const;

      for (const type of eventTypes) {
        await logSecurityEvent({
          type,
          ipAddress: "1.2.3.4",
        });

        expect(prisma.securityEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type,
            }),
          })
        );
      }
    });

    it("should preserve metadata when hashing email", async () => {
      await logSecurityEvent({
        type: "TOKEN_GENERATED",
        userId: "user123",
        email: "test@example.com",
        ipAddress: "1.2.3.4",
        metadata: {
          deviceName: "My Device",
          gameMode: "SPT",
        },
      });

      expect(prisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            deviceName: "My Device",
            gameMode: "SPT",
            emailHash: expect.any(String),
          }),
        }),
      });
    });
  });

  describe("getUserSecurityEvents", () => {
    it("should query security events by user ID", async () => {
      const mockEvents = [
        {
          id: "event1",
          type: "LOGIN_SUCCESS" as const,
          userId: "user123",
          ipAddress: "1.2.3.4",
          userAgent: "test-agent",
          metadata: {},
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.securityEvent.findMany).mockResolvedValue(mockEvents);

      const result = await getUserSecurityEvents("user123");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      expect(result).toEqual(mockEvents);
    });

    it("should limit results to 50 events by default", async () => {
      await getUserSecurityEvents("user123");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should order by most recent first", async () => {
      await getUserSecurityEvents("user123");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("getIpSecurityEvents", () => {
    it("should query security events by IP address", async () => {
      const mockEvents = [
        {
          id: "event1",
          type: "LOGIN_FAILED" as const,
          userId: null,
          ipAddress: "1.2.3.4",
          userAgent: null,
          metadata: {},
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.securityEvent.findMany).mockResolvedValue(mockEvents);

      const result = await getIpSecurityEvents("1.2.3.4");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith({
        where: { ipAddress: "1.2.3.4" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      expect(result).toEqual(mockEvents);
    });

    it("should limit results to 50 events by default", async () => {
      await getIpSecurityEvents("1.2.3.4");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should order by most recent first", async () => {
      await getIpSecurityEvents("1.2.3.4");

      expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("email hashing consistency", () => {
    it("should produce same hash for same email", async () => {
      const email = "test@example.com";

      await logSecurityEvent({
        type: "LOGIN_SUCCESS",
        email,
        ipAddress: "1.2.3.4",
      });

      await logSecurityEvent({
        type: "LOGIN_FAILED",
        email,
        ipAddress: "1.2.3.4",
      });

      const calls = vi.mocked(prisma.securityEvent.create).mock.calls;
      const metadata1 = calls[0][0].data.metadata as Record<string, unknown>;
      const metadata2 = calls[1][0].data.metadata as Record<string, unknown>;
      const hash1 = metadata1?.emailHash as string;
      const hash2 = metadata2?.emailHash as string;

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });

    it("should produce different hashes for different emails", async () => {
      await logSecurityEvent({
        type: "LOGIN_SUCCESS",
        email: "test1@example.com",
        ipAddress: "1.2.3.4",
      });

      await logSecurityEvent({
        type: "LOGIN_SUCCESS",
        email: "test2@example.com",
        ipAddress: "1.2.3.4",
      });

      const calls = vi.mocked(prisma.securityEvent.create).mock.calls;
      const metadata1 = calls[0][0].data.metadata as Record<string, unknown>;
      const metadata2 = calls[1][0].data.metadata as Record<string, unknown>;
      const hash1 = metadata1?.emailHash as string;
      const hash2 = metadata2?.emailHash as string;

      expect(hash1).not.toBe(hash2);
    });
  });
});

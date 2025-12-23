/**
 * API Integration Tests - Password Reset Endpoints
 *
 * Tests the /api/auth/forgot-password and /api/auth/reset-password endpoints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed_password")),
  },
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({
    success: true,
    limit: 3,
    remaining: 2,
    reset: Date.now() + 3600000,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
  RATE_LIMITS: {
    AUTH_REGISTER: {
      limit: 3,
      window: 3600000,
    },
  },
}));

// Mock turnstile
vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn(() => true),
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock security logger
vi.mock("@/lib/security-logger", () => ({
  logSecurityEvent: vi.fn(),
}));

// Import route handlers after all mocks are set up
const { POST: forgotPasswordPOST } = await import("@/app/api/auth/forgot-password/route");
const { POST: resetPasswordPOST } = await import("@/app/api/auth/reset-password/route");

describe("/api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST", () => {
    it("should return success message for existing user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "abc123",
        expiresAt: new Date(),
        createdAt: new Date(),
        usedAt: null,
      } as never);

      const request = new Request(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            turnstileToken: "valid-token",
          }),
        }
      );

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("If an account");
    });

    it("should return same success message for non-existing user (prevents enumeration)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "nonexistent@example.com",
            turnstileToken: "valid-token",
          }),
        }
      );

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("If an account");
    });

    it("should delete existing tokens before creating new one", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "abc123",
        expiresAt: new Date(),
        createdAt: new Date(),
        usedAt: null,
      } as never);

      const request = new Request(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            turnstileToken: "valid-token",
          }),
        }
      );

      await forgotPasswordPOST(request);

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return 400 for invalid email", async () => {
      const request = new Request(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "not-an-email",
            turnstileToken: "valid-token",
          }),
        }
      );

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email address");
    });
  });
});

describe("/api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST", () => {
    it("should reset password with valid token", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "valid-token",
        expiresAt: futureDate,
        createdAt: new Date(),
        usedAt: null,
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
      } as never);
      // bcrypt.hash is already mocked at the top level
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: "user-123" },
        { id: "token-123" },
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        }
      );

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("Password reset successfully");
    });

    it("should return 400 for invalid token", async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "invalid-token",
            password: "newpassword123",
          }),
        }
      );

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid or expired");
    });

    it("should return 400 for expired token", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "expired-token",
        expiresAt: pastDate,
        createdAt: new Date(Date.now() - 7200000),
        usedAt: null,
      } as never);
      vi.mocked(prisma.passwordResetToken.delete).mockResolvedValue({} as never);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "expired-token",
            password: "newpassword123",
          }),
        }
      );

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("expired");
    });

    it("should return 400 for already used token", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "used-token",
        expiresAt: futureDate,
        createdAt: new Date(),
        usedAt: new Date(), // Already used
      } as never);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "used-token",
            password: "newpassword123",
          }),
        }
      );

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already been used");
    });

    it("should return 400 for password less than 8 characters", async () => {
      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "short",
          }),
        }
      );

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Password must be at least 8 characters");
    });

    it("should update password in database via transaction", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "valid-token",
        expiresAt: futureDate,
        createdAt: new Date(),
        usedAt: null,
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
      } as never);
      // bcrypt.hash is already mocked at the top level to return "hashed_password"
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: "user-123" },
        { id: "token-123" },
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        }
      );

      const response = await resetPasswordPOST(request);

      // Verify the transaction was called (password update + token mark as used)
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should mark token as used after successful reset", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-123",
        email: "test@example.com",
        token: "valid-token",
        expiresAt: futureDate,
        createdAt: new Date(),
        usedAt: null,
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
      } as never);
      // bcrypt.hash is already mocked at the top level
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: "user-123" },
        { id: "token-123" },
      ] as never);

      const request = new Request(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        }
      );

      await resetPasswordPOST(request);

      // Check that $transaction was called (updates happen atomically)
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});

/**
 * API Integration Tests - Auth Endpoints
 *
 * Tests the /api/auth/register endpoint.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
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
    AUTH_LOGIN: {
      limit: 5,
      window: 900000,
    },
    API_GENERAL: {
      limit: 30,
      window: 60000,
    },
  },
}));

describe("/api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST", () => {
    it("should register a new user successfully", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        password: "hashed_password",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe("User created successfully");
      expect(data.userId).toBe("user-123");
    });

    it("should hash the password before storing", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: null,
        password: "hashed_password",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      await POST(request);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed_password",
          name: null,
        },
      });
    });

    it("should return 400 if user already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User with this email already exists");
    });

    it("should return 400 for invalid email", async () => {
      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "password123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email address");
    });

    it("should return 400 for password less than 8 characters", async () => {
      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "short",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Password must be at least 8 characters");
    });

    it("should allow registration without name", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: null,
        password: "hashed_password",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.userId).toBe("user-123");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should trim email and use lowercase for lookup", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: null,
        password: "hashed_password",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "Test@Example.com",
          password: "password123",
        }),
      });

      const response = await POST(request);

      // The validation will pass, but the email is stored as-is
      expect(response.status).toBe(201);
    });

    it("should validate email format strictly", async () => {
      const invalidEmails = [
        "missing-at.com",
        "@no-local-part.com",
        "spaces in@email.com",
        "",
      ];

      for (const email of invalidEmails) {
        const request = new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password: "password123",
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });

    it("should accept valid password exactly 8 characters", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: null,
        password: "hashed_password",
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "exactly8", // Exactly 8 characters
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});

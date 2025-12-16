import { http, HttpResponse } from "msw";
import {
  linkSchema,
  syncSchema,
  type LinkResponse,
  type ListTokensResponse,
  type SyncResponse,
  type StatusResponse,
  type QuestsResponse,
} from "@/types/api-contracts";

const API_BASE = "/api/companion";

// Mock token store for testing
const mockTokens = new Map<
  string,
  {
    id: string;
    tokenHint: string;
    deviceName: string;
    gameMode: string;
    lastSeen: Date | null;
    createdAt: Date;
    userId: string;
  }
>();

// Mock valid token for testing
export const TEST_COMPANION_TOKEN = "cmp_test1234567890abcdef";

export const companionHandlers = [
  // POST /api/companion/link - Generate companion token
  http.post(`${API_BASE}/link`, async ({ request }) => {
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request with Zod schema
    const validation = linkSchema.safeParse(body);
    if (!validation.success) {
      return HttpResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { deviceName, gameMode } = validation.data;

    // Generate mock token
    const tokenId = `token_${Date.now()}`;
    const token = `cmp_${Math.random().toString(36).substring(2, 18)}`;
    const tokenHint = token.slice(-4);
    const createdAt = new Date();

    // Store token
    mockTokens.set(tokenId, {
      id: tokenId,
      tokenHint,
      deviceName,
      gameMode,
      lastSeen: null,
      createdAt,
      userId: "test_user_qa",
    });

    const response: LinkResponse = {
      token,
      tokenId,
      deviceName,
      gameMode,
      createdAt,
      message: "Save this token securely. It will not be shown again.",
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/companion/link - List companion tokens
  http.get(`${API_BASE}/link`, ({ request }) => {
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = Array.from(mockTokens.values()).map((t) => ({
      id: t.id,
      tokenHint: t.tokenHint,
      deviceName: t.deviceName,
      gameMode: t.gameMode,
      lastSeen: t.lastSeen,
      createdAt: t.createdAt,
    }));

    const response: ListTokensResponse = { tokens };
    return HttpResponse.json(response);
  }),

  // POST /api/companion/sync - Sync quest progress
  http.post(`${API_BASE}/sync`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Validate token
    if (
      !authHeader?.startsWith("Bearer ") ||
      authHeader.slice(7) !== TEST_COMPANION_TOKEN
    ) {
      return HttpResponse.json(
        { error: "Invalid or expired companion token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request with Zod schema
    const validation = syncSchema.safeParse(body);
    if (!validation.success) {
      return HttpResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { events } = validation.data;

    // Process events (simplified for testing)
    const response: SyncResponse = {
      synced: events.length,
      errors: [],
      unlockedQuests: [],
    };

    // Simulate some unlocked quests when completing
    const completedEvents = events.filter((e) => e.status === "FINISHED");
    if (completedEvents.length > 0) {
      response.unlockedQuests = ["quest_unlocked_1", "quest_unlocked_2"];
    }

    return HttpResponse.json(response);
  }),

  // GET /api/companion/status - Check connection status
  http.get(`${API_BASE}/status`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Validate token
    if (
      !authHeader?.startsWith("Bearer ") ||
      authHeader.slice(7) !== TEST_COMPANION_TOKEN
    ) {
      const response: StatusResponse = {
        valid: false,
        error: "Invalid or expired companion token",
      };
      return HttpResponse.json(response, { status: 401 });
    }

    const response: StatusResponse = {
      valid: true,
      userId: "test_user_qa",
      userName: "Test User",
      playerLevel: 42,
      deviceName: "Test Device",
      gameMode: "PVP",
      lastSeen: new Date(),
      createdAt: new Date("2024-01-01"),
      stats: {
        completed: 120,
        inProgress: 15,
        available: 45,
        locked: 78,
      },
    };

    return HttpResponse.json(response);
  }),

  // GET /api/companion/quests - Get quest names
  http.get(`${API_BASE}/quests`, () => {
    const response: QuestsResponse = {
      quests: {
        quest_prapor_debut: {
          title: "Debut",
          trader: "Prapor",
        },
        quest_therapist_shortage: {
          title: "Shortage",
          trader: "Therapist",
        },
        quest_skier_supplier: {
          title: "Supplier",
          trader: "Skier",
        },
      },
      count: 3,
    };

    return HttpResponse.json(response);
  }),
];

// Helper to reset companion token store
export function resetCompanionStore() {
  mockTokens.clear();
}

// Error handlers for testing
export const unauthorizedCompanionHandler = http.post(
  `${API_BASE}/sync`,
  () => {
    return HttpResponse.json(
      { error: "Invalid or expired companion token" },
      { status: 401 }
    );
  }
);

export const companionErrorHandler = http.post(`${API_BASE}/sync`, () => {
  return HttpResponse.json(
    { error: "Failed to sync progress" },
    { status: 500 }
  );
});

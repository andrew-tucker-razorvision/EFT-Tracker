import { http, HttpResponse } from "msw";
import type {
  QuestStatus,
  QuestProgress,
  ProgressUpdateResponse,
} from "@/types";

const API_BASE = "/api";

// Store for progress state during tests
let mockProgressStore: Map<string, QuestProgress> = new Map();

// Helper to reset store between tests
export function resetProgressStore() {
  mockProgressStore = new Map();
}

// Helper to set initial progress
export function setMockProgress(progress: QuestProgress[]) {
  mockProgressStore = new Map(progress.map((p) => [p.questId, p]));
}

export const progressHandlers = [
  // GET /api/progress - Get user progress
  http.get(`${API_BASE}/progress`, ({ request }) => {
    // Check for auth header (simplified - real auth would be more complex)
    const authHeader = request.headers.get("authorization");

    // For MSW tests, we'll check for a custom header that indicates auth status
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated && !authHeader) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = Array.from(mockProgressStore.values());
    return HttpResponse.json({ progress });
  }),

  // POST /api/progress - Create progress record
  http.post(`${API_BASE}/progress`, async ({ request }) => {
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      questId: string;
      status?: QuestStatus;
    };

    if (!body.questId) {
      return HttpResponse.json(
        { error: "questId is required" },
        { status: 400 }
      );
    }

    const newProgress: QuestProgress = {
      id: `progress_${body.questId}_${Date.now()}`,
      status: body.status || "available",
      completedAt: null,
      userId: "test_user_qa",
      questId: body.questId,
    };

    mockProgressStore.set(body.questId, newProgress);

    return HttpResponse.json({ progress: newProgress }, { status: 201 });
  }),

  // PATCH /api/progress/:questId - Update quest status
  http.patch(`${API_BASE}/progress/:questId`, async ({ params, request }) => {
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questId = params.questId as string;
    const body = (await request.json()) as { status: QuestStatus };

    if (!body.status) {
      return HttpResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses: QuestStatus[] = [
      "locked",
      "available",
      "in_progress",
      "completed",
    ];
    if (!validStatuses.includes(body.status)) {
      return HttpResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get existing progress or create new
    let progress = mockProgressStore.get(questId);

    if (!progress) {
      progress = {
        id: `progress_${questId}_${Date.now()}`,
        status: body.status,
        completedAt: body.status === "completed" ? new Date() : null,
        userId: "test_user_qa",
        questId,
      };
    } else {
      progress = {
        ...progress,
        status: body.status,
        completedAt: body.status === "completed" ? new Date() : null,
      };
    }

    mockProgressStore.set(questId, progress);

    // Simulate unlocked quests when completing
    const response: ProgressUpdateResponse = { progress };
    if (body.status === "completed") {
      // In real app, this would check dependencies
      response.unlockedQuests = [];
    }

    return HttpResponse.json(response);
  }),
];

// Helper handlers for specific test scenarios
export const unauthorizedProgressHandler = http.get(
  `${API_BASE}/progress`,
  () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
);

export const progressErrorHandler = http.patch(
  `${API_BASE}/progress/:questId`,
  () => {
    return HttpResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
);

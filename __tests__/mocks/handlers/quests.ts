import { http, HttpResponse } from "msw";
import { mockQuestsWithProgress } from "../../fixtures/quests";
import { mockTraders } from "../../fixtures/traders";

// Base URL for API routes - use wildcard to match any origin (localhost:3000, etc.)
const API_BASE = "*/api";

export const questHandlers = [
  // GET /api/quests
  http.get(`${API_BASE}/quests`, ({ request }) => {
    const url = new URL(request.url);

    // Parse query params
    const traderId = url.searchParams.get("traderId");
    const status = url.searchParams.get("status");
    const map = url.searchParams.get("map");
    const kappaOnly = url.searchParams.get("kappaOnly") === "true";
    const search = url.searchParams.get("search") || "";

    // Filter quests based on params
    let filteredQuests = [...mockQuestsWithProgress];

    if (traderId) {
      filteredQuests = filteredQuests.filter((q) => q.traderId === traderId);
    }

    if (status) {
      filteredQuests = filteredQuests.filter(
        (q) => q.computedStatus === status
      );
    }

    if (map) {
      filteredQuests = filteredQuests.filter((q) =>
        q.objectives.some((obj) => obj.map === map)
      );
    }

    if (kappaOnly) {
      filteredQuests = filteredQuests.filter((q) => q.kappaRequired);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredQuests = filteredQuests.filter((q) =>
        q.title.toLowerCase().includes(searchLower)
      );
    }

    return HttpResponse.json({
      quests: filteredQuests,
      traders: mockTraders,
    });
  }),

  // GET /api/traders
  http.get(`${API_BASE}/traders`, () => {
    return HttpResponse.json({ traders: mockTraders });
  }),
];

// Helper to create error response
export function createQuestErrorHandler(statusCode: number, message: string) {
  return http.get(`${API_BASE}/quests`, () => {
    return HttpResponse.json({ error: message }, { status: statusCode });
  });
}

// Handler for empty quest list
export const emptyQuestsHandler = http.get(`${API_BASE}/quests`, () => {
  return HttpResponse.json({
    quests: [],
    traders: mockTraders,
  });
});

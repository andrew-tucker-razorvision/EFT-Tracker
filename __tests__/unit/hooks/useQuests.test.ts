import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useQuests, useQuestProgress } from "@/hooks/useQuests";
import { server } from "../../setup/msw-server";
import { http, HttpResponse } from "msw";
import { mockQuestsWithProgress } from "../../fixtures/quests";
import { mockTraders } from "../../fixtures/traders";

// Helper to set up default handlers
const setupDefaultHandlers = () => {
  server.use(
    http.get("*/api/quests", () => {
      return HttpResponse.json({
        quests: mockQuestsWithProgress,
        traders: mockTraders,
      });
    }),
    http.get("*/api/traders", () => {
      return HttpResponse.json({ traders: mockTraders });
    })
  );
};

describe("useQuests", () => {
  describe("initial state", () => {
    it("should start with loading true", () => {
      const { result } = renderHook(() => useQuests());
      expect(result.current.loading).toBe(true);
    });

    it("should have empty quests initially", () => {
      const { result } = renderHook(() => useQuests());
      expect(result.current.quests).toEqual([]);
    });

    it("should have default filters", () => {
      const { result } = renderHook(() => useQuests());
      expect(result.current.filters).toEqual({
        traderId: null,
        statuses: ["available", "locked"], // Default to showing available and locked quests
        search: "",
        kappaOnly: false,
        map: null,
        playerLevel: 1,
        questsPerTree: null,
        bypassLevelRequirement: false,
        questType: null,
        hideReputationQuests: false,
      });
    });
  });

  describe("fetching quests", () => {
    it("should fetch quests and traders on mount", async () => {
      setupDefaultHandlers();

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Hook fetches both quests and traders - verify no error
      expect(result.current.error).toBeNull();
      // Verify data was actually loaded (not just defined as empty arrays)
      expect(result.current.quests.length).toBeGreaterThan(0);
      expect(result.current.traders.length).toBeGreaterThan(0);
    });

    it("should handle API errors gracefully", async () => {
      server.use(
        http.get("/api/quests", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to fetch quests");
      expect(result.current.quests).toEqual([]);
    });
  });

  describe("filtering", () => {
    it("should update filters with setFilters", async () => {
      setupDefaultHandlers();
      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ kappaOnly: true });
      });

      expect(result.current.filters.kappaOnly).toBe(true);
    });

    it("should merge partial filter updates", async () => {
      setupDefaultHandlers();
      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ kappaOnly: true });
      });

      expect(result.current.filters.kappaOnly).toBe(true);
      expect(result.current.filters.playerLevel).toBe(1); // Other filters unchanged
    });

    it("should filter by status client-side", async () => {
      setupDefaultHandlers();
      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalQuests = result.current.quests.length;

      act(() => {
        result.current.setFilters({ statuses: ["completed"] });
        result.current.applyFilters(); // Must apply filters to trigger refetch
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have fewer quests after filtering
      expect(result.current.quests.length).toBeLessThanOrEqual(totalQuests);
      // All should be completed
      result.current.quests.forEach((q) => {
        expect(q.computedStatus).toBe("completed");
      });
    });
  });

  describe("refetch", () => {
    it("should refetch quests when refetch is called", async () => {
      let fetchCount = 0;
      server.use(
        http.get("/api/quests", () => {
          fetchCount++;
          return HttpResponse.json({
            quests: mockQuestsWithProgress,
            traders: mockTraders,
          });
        })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialFetchCount = fetchCount;

      await act(async () => {
        await result.current.refetch();
      });

      expect(fetchCount).toBeGreaterThan(initialFetchCount);
    });
  });
});

describe("useQuestProgress", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("should start with updating false", () => {
    const { result } = renderHook(() => useQuestProgress());
    expect(result.current.updating).toBe(false);
  });

  it("should return true on successful update", async () => {
    server.use(
      http.post("/api/progress", () => {
        return HttpResponse.json({ progress: {} });
      })
    );

    const { result } = renderHook(() => useQuestProgress());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.updateStatus("quest_1", "completed");
    });

    expect(success).toBe(true);
    expect(result.current.updating).toBe(false);
  });

  it("should return false on failed update", async () => {
    server.use(
      http.post("/api/progress", () => {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useQuestProgress());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.updateStatus("quest_1", "completed");
    });

    expect(success).toBe(false);
    expect(result.current.updating).toBe(false);
  });

  it("should set updating true during request", async () => {
    let resolveRequest: () => void;
    const requestPromise = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post("/api/progress", async () => {
        await requestPromise;
        return HttpResponse.json({ progress: {} });
      })
    );

    const { result } = renderHook(() => useQuestProgress());

    let updatePromise: Promise<boolean>;
    act(() => {
      updatePromise = result.current.updateStatus("quest_1", "completed");
    });

    // Should be updating during request
    expect(result.current.updating).toBe(true);

    // Resolve the request
    resolveRequest!();
    await act(async () => {
      await updatePromise;
    });

    expect(result.current.updating).toBe(false);
  });
});

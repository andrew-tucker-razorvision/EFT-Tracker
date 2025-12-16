import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useProgress } from "@/hooks/useProgress";
import { server } from "../../setup/msw-server";
import { http, HttpResponse } from "msw";
import { useSession } from "next-auth/react";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

describe("useProgress", () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe("unauthenticated state", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });
    });

    it("should return empty progress when not authenticated", async () => {
      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress.size).toBe(0);
    });

    it("should not fetch progress when unauthenticated", async () => {
      const fetchSpy = vi.fn();
      server.use(
        http.get("/api/progress", () => {
          fetchSpy();
          return HttpResponse.json({ progress: [] });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not have called the API
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should set error when trying to update without auth", async () => {
      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.updateStatus("quest_1", "completed");
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe("Please sign in to track progress");
    });
  });

  describe("authenticated state", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: "test_user", email: "test@test.com", name: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("should fetch progress on mount when authenticated", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({
            progress: [
              {
                questId: "quest_1",
                status: "COMPLETED",
                updatedAt: new Date().toISOString(),
              },
              {
                questId: "quest_2",
                status: "IN_PROGRESS",
                updatedAt: new Date().toISOString(),
              },
            ],
          });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress.size).toBe(2);
      expect(result.current.progress.get("quest_1")).toBe("completed");
      expect(result.current.progress.get("quest_2")).toBe("in_progress");
    });

    it("should handle fetch errors", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to fetch progress");
    });

    it("should clear progress on 401 response", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress.size).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe("updateStatus", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: "test_user", email: "test@test.com", name: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("should optimistically update status", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ progress: [] });
        }),
        http.patch("/api/progress/:questId", async () => {
          // Delay response to test optimistic update
          await new Promise((r) => setTimeout(r, 100));
          return HttpResponse.json({ progress: {}, unlockedQuests: [] });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start update (don't await)
      act(() => {
        result.current.updateStatus("quest_1", "completed");
      });

      // Should be optimistically updated immediately
      expect(result.current.progress.get("quest_1")).toBe("completed");
    });

    it("should rollback on update failure", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({
            progress: [
              {
                questId: "quest_1",
                status: "AVAILABLE",
                updatedAt: new Date().toISOString(),
              },
            ],
          });
        }),
        http.patch("/api/progress/:questId", () => {
          return HttpResponse.json({ error: "Update failed" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress.get("quest_1")).toBe("available");

      let success: boolean = true;
      await act(async () => {
        success = await result.current.updateStatus("quest_1", "completed");
      });

      expect(success).toBe(false);
      // Should have rolled back
      expect(result.current.progress.get("quest_1")).toBe("available");
      expect(result.current.error).toBeTruthy();
    });

    it("should handle unlocked quests", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ progress: [] });
        }),
        http.patch("/api/progress/:questId", () => {
          return HttpResponse.json({
            progress: {},
            unlockedQuests: ["quest_2", "quest_3"],
          });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateStatus("quest_1", "completed");
      });

      expect(result.current.unlockedQuests).toContain("quest_2");
      expect(result.current.unlockedQuests).toContain("quest_3");
      expect(result.current.progress.get("quest_2")).toBe("available");
      expect(result.current.progress.get("quest_3")).toBe("available");
    });
  });

  describe("getStatus", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: "test_user", email: "test@test.com", name: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("should return status for known quest", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({
            progress: [
              {
                questId: "quest_1",
                status: "COMPLETED",
                updatedAt: new Date().toISOString(),
              },
            ],
          });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getStatus("quest_1")).toBe("completed");
    });

    it("should return undefined for unknown quest", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ progress: [] });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getStatus("unknown_quest")).toBeUndefined();
    });
  });

  describe("clearUnlocked", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: "test_user", email: "test@test.com", name: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("should clear unlocked quests", async () => {
      server.use(
        http.get("/api/progress", () => {
          return HttpResponse.json({ progress: [] });
        }),
        http.patch("/api/progress/:questId", () => {
          return HttpResponse.json({
            progress: {},
            unlockedQuests: ["quest_2"],
          });
        })
      );

      const { result } = renderHook(() => useProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateStatus("quest_1", "completed");
      });

      expect(result.current.unlockedQuests.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearUnlocked();
      });

      expect(result.current.unlockedQuests).toEqual([]);
    });
  });
});

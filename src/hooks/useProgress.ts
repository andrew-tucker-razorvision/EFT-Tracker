"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { QuestStatus } from "@/types";

interface ProgressEntry {
  questId: string;
  status: QuestStatus;
  updatedAt: string;
}

interface UseProgressReturn {
  progress: Map<string, QuestStatus>;
  isLoading: boolean;
  error: string | null;
  updateStatus: (questId: string, newStatus: QuestStatus) => Promise<boolean>;
  getStatus: (questId: string) => QuestStatus | undefined;
  refreshProgress: () => Promise<void>;
  unlockedQuests: string[];
  clearUnlocked: () => void;
}

export function useProgress(): UseProgressReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [progress, setProgress] = useState<Map<string, QuestStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockedQuests, setUnlockedQuests] = useState<string[]>([]);

  // Track previous state for rollback
  const previousProgress = useRef<Map<string, QuestStatus>>(new Map());

  const fetchProgress = useCallback(async () => {
    if (sessionStatus !== "authenticated") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/progress");
      if (!res.ok) {
        if (res.status === 401) {
          // Not authenticated, clear progress
          setProgress(new Map());
          return;
        }
        throw new Error("Failed to fetch progress");
      }

      const data = await res.json();
      const progressMap = new Map<string, QuestStatus>();

      for (const entry of data.progress as ProgressEntry[]) {
        progressMap.set(entry.questId, entry.status.toLowerCase() as QuestStatus);
      }

      setProgress(progressMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus]);

  const updateStatus = useCallback(
    async (questId: string, newStatus: QuestStatus): Promise<boolean> => {
      if (sessionStatus !== "authenticated") {
        setError("Please sign in to track progress");
        return false;
      }

      // Save current state for potential rollback
      previousProgress.current = new Map(progress);

      // Optimistic update
      setProgress((prev) => {
        const next = new Map(prev);
        next.set(questId, newStatus);
        return next;
      });

      try {
        const res = await fetch(`/api/progress/${questId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus.toUpperCase() }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update progress");
        }

        const data = await res.json();

        // Handle auto-unlocked quests
        if (data.unlockedQuests && data.unlockedQuests.length > 0) {
          setUnlockedQuests((prev) => [...prev, ...data.unlockedQuests]);

          // Update progress for unlocked quests
          setProgress((prev) => {
            const next = new Map(prev);
            for (const unlockedId of data.unlockedQuests) {
              next.set(unlockedId, "available");
            }
            return next;
          });
        }

        return true;
      } catch (err) {
        // Rollback on error
        setProgress(previousProgress.current);
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      }
    },
    [progress, sessionStatus]
  );

  const getStatus = useCallback(
    (questId: string): QuestStatus | undefined => {
      return progress.get(questId);
    },
    [progress]
  );

  const refreshProgress = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

  const clearUnlocked = useCallback(() => {
    setUnlockedQuests([]);
  }, []);

  // Initial fetch when session is ready
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchProgress();
    } else if (sessionStatus === "unauthenticated") {
      setProgress(new Map());
      setIsLoading(false);
    }
  }, [sessionStatus, fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    updateStatus,
    getStatus,
    refreshProgress,
    unlockedQuests,
    clearUnlocked,
  };
}

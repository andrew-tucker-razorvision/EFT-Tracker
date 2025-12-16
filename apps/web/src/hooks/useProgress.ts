"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { QuestStatus } from "@/types";

interface ProgressEntry {
  questId: string;
  status: QuestStatus;
  updatedAt: string;
}

interface QueuedUpdate {
  questId: string;
  status: QuestStatus;
  timestamp: number;
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
  savingQuestIds: Set<string>;
  lastSynced: Date | null;
  isOnline: boolean;
  pendingOfflineCount: number;
}

// LocalStorage key for offline queue
const OFFLINE_QUEUE_KEY = "eft-tracker-offline-queue";

// Load offline queue from localStorage
function loadOfflineQueue(): QueuedUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save offline queue to localStorage
function saveOfflineQueue(queue: QueuedUpdate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

export function useProgress(): UseProgressReturn {
  const { status: sessionStatus } = useSession();
  const [progress, setProgress] = useState<Map<string, QuestStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockedQuests, setUnlockedQuests] = useState<string[]>([]);
  const [savingQuestIds, setSavingQuestIds] = useState<Set<string>>(new Set());
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  // Track previous state for rollback
  const previousProgress = useRef<Map<string, QuestStatus>>(new Map());

  // Debounce tracking - prevent rapid clicks on same quest
  const recentlyUpdated = useRef<Set<string>>(new Set());

  // Offline queue
  const offlineQueue = useRef<QueuedUpdate[]>(loadOfflineQueue());

  // Track if we're currently processing the offline queue
  const processingQueue = useRef(false);

  // Process offline queue when coming back online
  const processOfflineQueue = useCallback(async () => {
    if (processingQueue.current || offlineQueue.current.length === 0) return;
    if (sessionStatus !== "authenticated") return;

    processingQueue.current = true;

    // Process queue items one at a time
    while (offlineQueue.current.length > 0 && navigator.onLine) {
      const update = offlineQueue.current[0];

      try {
        const res = await fetch(`/api/progress/${update.questId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: update.status.toUpperCase() }),
        });

        if (res.ok) {
          // Remove from queue on success
          offlineQueue.current.shift();
          saveOfflineQueue(offlineQueue.current);
          setPendingOfflineCount(offlineQueue.current.length);
          setLastSynced(new Date());
        } else {
          // Stop processing on error - will retry later
          break;
        }
      } catch {
        // Network error - stop processing
        break;
      }
    }

    processingQueue.current = false;
  }, [sessionStatus]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process offline queue when coming back online
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(navigator.onLine);

    // Initialize pending count from stored queue
    setPendingOfflineCount(offlineQueue.current.length);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processOfflineQueue]);

  // Process queue on mount if online
  useEffect(() => {
    if (isOnline && sessionStatus === "authenticated") {
      processOfflineQueue();
    }
  }, [isOnline, sessionStatus, processOfflineQueue]);

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
        progressMap.set(
          entry.questId,
          entry.status.toLowerCase() as QuestStatus
        );
      }

      setProgress(progressMap);
      setLastSynced(new Date());
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

      // Debounce: prevent rapid clicks on same quest (300ms cooldown)
      if (recentlyUpdated.current.has(questId)) {
        return false;
      }
      recentlyUpdated.current.add(questId);
      setTimeout(() => recentlyUpdated.current.delete(questId), 300);

      // Save current state for potential rollback
      previousProgress.current = new Map(progress);

      // Mark quest as saving
      setSavingQuestIds((prev) => new Set(prev).add(questId));

      // Optimistic update
      setProgress((prev) => {
        const next = new Map(prev);
        next.set(questId, newStatus);
        return next;
      });

      // If offline, queue the update for later
      if (!navigator.onLine) {
        // Add to offline queue (replace any existing update for this quest)
        const existingIndex = offlineQueue.current.findIndex(
          (u) => u.questId === questId
        );
        const queuedUpdate: QueuedUpdate = {
          questId,
          status: newStatus,
          timestamp: Date.now(),
        };

        if (existingIndex >= 0) {
          offlineQueue.current[existingIndex] = queuedUpdate;
        } else {
          offlineQueue.current.push(queuedUpdate);
        }

        saveOfflineQueue(offlineQueue.current);
        setPendingOfflineCount(offlineQueue.current.length);

        // Remove from saving set
        setSavingQuestIds((prev) => {
          const next = new Set(prev);
          next.delete(questId);
          return next;
        });

        // Return true because we've queued it (optimistic update stays)
        return true;
      }

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

        // Handle auto-locked quests (when prerequisites are unchecked)
        if (data.lockedQuests && data.lockedQuests.length > 0) {
          setProgress((prev) => {
            const next = new Map(prev);
            for (const lockedId of data.lockedQuests) {
              next.set(lockedId, "locked");
            }
            return next;
          });
        }

        // Update last synced time on success
        setLastSynced(new Date());
        setError(null); // Clear any previous errors
        return true;
      } catch (err) {
        // Rollback on error
        setProgress(previousProgress.current);
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      } finally {
        // Remove quest from saving set
        setSavingQuestIds((prev) => {
          const next = new Set(prev);
          next.delete(questId);
          return next;
        });
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
    savingQuestIds,
    lastSynced,
    isOnline,
    pendingOfflineCount,
  };
}

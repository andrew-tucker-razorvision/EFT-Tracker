"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  QuestWithProgress,
  Trader,
  QuestFilters,
  QuestStatus,
} from "@/types";

// Simple request deduplication - tracks in-flight requests
const inflightRequests = new Map<string, Promise<Response>>();

async function fetchWithDedup(url: string): Promise<Response> {
  // Check if there's already an in-flight request for this URL
  const existing = inflightRequests.get(url);
  if (existing) {
    return existing;
  }

  // Create new request
  const request = fetch(url);
  inflightRequests.set(url, request);

  try {
    const response = await request;
    // Return a clone so the original can still be consumed
    return response.clone();
  } finally {
    // Clean up after request completes (success or failure)
    inflightRequests.delete(url);
  }
}

interface UseQuestsReturn {
  quests: QuestWithProgress[];
  allQuests: QuestWithProgress[]; // Unfiltered quests for accurate depth calculation
  traders: Trader[];
  loading: boolean;
  initialLoading: boolean; // True only during first load, prevents remounting during refetch
  error: string | null;
  filters: QuestFilters;
  setFilters: (filters: Partial<QuestFilters>) => void;
  applyFilters: () => void;
  hasPendingChanges: boolean;
  refetch: () => Promise<void>;
  hiddenByLevelCount: number; // Number of quests hidden due to level filter
}

const defaultFilters: QuestFilters = {
  statuses: ["available"], // Default to showing only available quests
  search: "",
  kappaOnly: false,
  playerLevel: 1, // Default to level 1 for all users
  bypassLevelRequirement: false, // Show all quests regardless of level when true
  hideReputationQuests: true, // Hide Fence reputation quests by default
};

export function useQuests(): UseQuestsReturn {
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [allQuests, setAllQuests] = useState<QuestWithProgress[]>([]); // Unfiltered for depth calc
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Only true during first load
  const [error, setError] = useState<string | null>(null);
  const [pendingFilters, setPendingFilters] =
    useState<QuestFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<QuestFilters>(defaultFilters);
  const [hiddenByLevelCount, setHiddenByLevelCount] = useState(0);

  // Ref to store pending filters for stable applyFilters callback
  const pendingFiltersRef = useRef(pendingFilters);
  pendingFiltersRef.current = pendingFilters;

  const fetchTraders = useCallback(async () => {
    try {
      const res = await fetchWithDedup("/api/traders");
      if (!res.ok) throw new Error("Failed to fetch traders");
      const data = await res.json();
      setTraders(data.traders);
    } catch (err) {
      console.error("Error fetching traders:", err);
    }
  }, []);

  // Fetch all quests (unfiltered) for accurate depth calculation
  const fetchAllQuests = useCallback(async () => {
    try {
      const res = await fetchWithDedup("/api/quests");
      if (!res.ok) throw new Error("Failed to fetch all quests");
      const data = await res.json();
      setAllQuests(data.quests);
    } catch (err) {
      console.error("Error fetching all quests:", err);
    }
  }, []);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (appliedFilters.kappaOnly) params.set("kappa", "true");
      if (appliedFilters.search) params.set("search", appliedFilters.search);

      const url = `/api/quests?${params.toString()}`;
      const res = await fetchWithDedup(url);
      if (!res.ok) throw new Error("Failed to fetch quests");

      const data = await res.json();

      // Client-side filtering
      let filteredQuests = data.quests;

      // Status filtering (multi-select: empty array = all)
      if (appliedFilters.statuses.length > 0) {
        filteredQuests = filteredQuests.filter((q: QuestWithProgress) =>
          appliedFilters.statuses.includes(q.computedStatus)
        );
      }

      // Hide reputation and prestige quests if enabled (default: true)
      // Prestige quests require The Collector and are end-game content
      if (appliedFilters.hideReputationQuests) {
        filteredQuests = filteredQuests.filter((q: QuestWithProgress) => {
          const questType = q.questType?.toUpperCase();
          return questType !== "REPUTATION" && questType !== "PRESTIGE";
        });
      }

      // Hide quests more than 5 levels above player level (skip if bypassLevelRequirement is enabled)
      let levelHiddenCount = 0;
      if (
        appliedFilters.playerLevel &&
        !appliedFilters.bypassLevelRequirement
      ) {
        const beforeCount = filteredQuests.length;
        filteredQuests = filteredQuests.filter(
          (q: QuestWithProgress) =>
            q.levelRequired <= appliedFilters.playerLevel! + 5
        );
        levelHiddenCount = beforeCount - filteredQuests.length;
      }

      setHiddenByLevelCount(levelHiddenCount);
      setQuests(filteredQuests);
      setInitialLoading(false); // First load complete
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setInitialLoading(false); // Also mark initial load complete on error
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const setFilters = useCallback((newFilters: Partial<QuestFilters>) => {
    // Update ref synchronously so applyFilters() can read the latest value immediately
    const updated = { ...pendingFiltersRef.current, ...newFilters };
    pendingFiltersRef.current = updated;
    setPendingFilters(updated);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(pendingFiltersRef.current);
  }, []);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  const refetch = useCallback(async () => {
    // Refetch both filtered quests and all quests to keep them in sync
    // This ensures allQuests (used for skip dialog prerequisites) has fresh data
    await Promise.all([fetchQuests(), fetchAllQuests()]);
  }, [fetchQuests, fetchAllQuests]);

  // Initial fetch
  useEffect(() => {
    fetchTraders();
    fetchAllQuests(); // Fetch all quests for depth calculation
  }, [fetchTraders, fetchAllQuests]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  return {
    quests,
    allQuests,
    traders,
    loading,
    initialLoading,
    error,
    filters: pendingFilters,
    setFilters,
    applyFilters,
    hasPendingChanges,
    refetch,
    hiddenByLevelCount,
  };
}

// Hook for updating quest progress
export function useQuestProgress() {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(
    async (questId: string, status: QuestStatus): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questId, status }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update progress");
        }

        return true;
      } catch (err) {
        console.error("Error updating progress:", err);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  return { updateStatus, updating };
}

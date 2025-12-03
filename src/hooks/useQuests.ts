"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  QuestWithProgress,
  Trader,
  QuestFilters,
  QuestStatus,
} from "@/types";

interface UseQuestsReturn {
  quests: QuestWithProgress[];
  allQuests: QuestWithProgress[]; // Unfiltered quests for accurate depth calculation
  traders: Trader[];
  loading: boolean;
  error: string | null;
  filters: QuestFilters;
  setFilters: (filters: Partial<QuestFilters>) => void;
  applyFilters: () => void;
  hasPendingChanges: boolean;
  refetch: () => Promise<void>;
  hiddenByLevelCount: number; // Number of quests hidden due to level filter
}

const defaultFilters: QuestFilters = {
  traderId: null,
  status: null,
  search: "",
  kappaOnly: false,
  map: null,
  playerLevel: 1, // Default to level 1 for all users
  levelRange: null,
  questsPerTree: 3, // Default to showing 3 columns (depth levels) per trader
  bypassLevelRequirement: false, // Show all quests regardless of level when true
};

export function useQuests(): UseQuestsReturn {
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [allQuests, setAllQuests] = useState<QuestWithProgress[]>([]); // Unfiltered for depth calc
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingFilters, setPendingFilters] =
    useState<QuestFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<QuestFilters>(defaultFilters);
  const [hiddenByLevelCount, setHiddenByLevelCount] = useState(0);

  const fetchTraders = useCallback(async () => {
    try {
      const res = await fetch("/api/traders");
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
      const res = await fetch("/api/quests");
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
      if (appliedFilters.traderId)
        params.set("trader", appliedFilters.traderId);
      if (appliedFilters.map) params.set("map", appliedFilters.map);
      if (appliedFilters.kappaOnly) params.set("kappa", "true");
      if (appliedFilters.search) params.set("search", appliedFilters.search);

      const res = await fetch(`/api/quests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch quests");

      const data = await res.json();

      // Client-side filtering
      let filteredQuests = data.quests;

      // Status filtering
      if (appliedFilters.status) {
        filteredQuests = filteredQuests.filter(
          (q: QuestWithProgress) => q.computedStatus === appliedFilters.status
        );
      }

      // Level range filtering (skip if bypassLevelRequirement is enabled)
      if (appliedFilters.levelRange && !appliedFilters.bypassLevelRequirement) {
        filteredQuests = filteredQuests.filter(
          (q: QuestWithProgress) =>
            q.levelRequired >= appliedFilters.levelRange!.min &&
            q.levelRequired <= appliedFilters.levelRange!.max
        );
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const setFilters = useCallback((newFilters: Partial<QuestFilters>) => {
    setPendingFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback(() => {
    // Use functional update to read current pendingFilters, avoiding stale closure issues
    setPendingFilters((current) => {
      setAppliedFilters(current);
      return current;
    });
  }, []);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  const refetch = useCallback(async () => {
    await fetchQuests();
  }, [fetchQuests]);

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

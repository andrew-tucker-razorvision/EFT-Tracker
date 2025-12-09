"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchQuestDetails, type TarkovQuestDetails } from "@/lib/tarkov-api";

interface UseQuestDetailsReturn {
  details: TarkovQuestDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching extended quest details from tarkov.dev API
 * Includes rewards, required items, and other data not stored locally
 *
 * @param questId - The quest ID to fetch details for (null to skip fetching)
 */
export function useQuestDetails(questId: string | null): UseQuestDetailsReturn {
  const [details, setDetails] = useState<TarkovQuestDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!questId) {
      setDetails(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchQuestDetails(questId);
      if (result) {
        setDetails(result);
      } else {
        setError("Quest details not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch details");
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    details,
    loading,
    error,
    refetch: fetch,
  };
}

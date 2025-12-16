import { useState, useEffect, useCallback } from "react";

interface QuestInfo {
  title: string;
  trader: string;
}

interface QuestNamesResponse {
  quests: Record<string, QuestInfo>;
  count: number;
}

const API_BASE = "https://eft-tracker.vercel.app";

// Cache quest names in memory
let questNamesCache: Record<string, QuestInfo> | null = null;
let cachePromise: Promise<Record<string, QuestInfo>> | null = null;

async function fetchQuestNames(): Promise<Record<string, QuestInfo>> {
  // Return cached data if available
  if (questNamesCache) {
    return questNamesCache;
  }

  // Return existing promise if fetch is in progress
  if (cachePromise) {
    return cachePromise;
  }

  // Start new fetch
  cachePromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/companion/quests`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const data: QuestNamesResponse = await response.json();
      questNamesCache = data.quests;
      return data.quests;
    } catch (error) {
      console.error("Failed to fetch quest names:", error);
      // Return empty object on error, don't cache it
      cachePromise = null;
      return {};
    }
  })();

  return cachePromise;
}

export function useQuestNames() {
  const [questNames, setQuestNames] = useState<Record<string, QuestInfo>>(
    questNamesCache || {}
  );
  const [loading, setLoading] = useState(!questNamesCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const names = await fetchQuestNames();
        if (mounted) {
          setQuestNames(names);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(String(err));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const getQuestName = useCallback(
    (questId: string): string => {
      const info = questNames[questId];
      return info?.title || questId;
    },
    [questNames]
  );

  const getQuestInfo = useCallback(
    (questId: string): QuestInfo | null => {
      return questNames[questId] || null;
    },
    [questNames]
  );

  const refresh = useCallback(async () => {
    questNamesCache = null;
    cachePromise = null;
    setLoading(true);
    const names = await fetchQuestNames();
    setQuestNames(names);
    setLoading(false);
  }, []);

  return {
    questNames,
    loading,
    error,
    getQuestName,
    getQuestInfo,
    refresh,
  };
}

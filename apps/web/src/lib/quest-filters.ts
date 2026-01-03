/**
 * Pure utility functions extracted from useQuests hook.
 * These functions are testable without React dependencies.
 */

import type { QuestWithProgress, QuestFilters, QuestStatus } from "@/types";

/**
 * Default filter values used when no filters are specified.
 */
export const defaultFilters: QuestFilters = {
  traderId: null,
  statuses: ["available", "locked"],
  search: "",
  kappaOnly: false,
  map: null,
  playerLevel: 1,
  questsPerTree: null,
  bypassLevelRequirement: false,
  questType: null,
  hideReputationQuests: false,
};

/**
 * Applies client-side filters to a list of quests.
 * Server handles kappa and search filters; this handles trader and status.
 */
export function applyQuestFilters(
  quests: QuestWithProgress[],
  filters: Pick<QuestFilters, "traderId" | "statuses">
): QuestWithProgress[] {
  let filtered = quests;

  // Trader filtering
  if (filters.traderId) {
    filtered = filtered.filter((q) => q.traderId === filters.traderId);
  }

  // Status filtering (multi-select: empty array = all statuses)
  if (filters.statuses.length > 0) {
    filtered = filtered.filter((q) =>
      filters.statuses.includes(q.computedStatus as QuestStatus)
    );
  }

  return filtered;
}

/**
 * Builds URL search params for the quests API.
 * Only includes non-empty values.
 */
export function buildQuestQueryParams(
  filters: Pick<QuestFilters, "kappaOnly" | "search">
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.kappaOnly) {
    params.set("kappa", "true");
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  return params;
}

/**
 * Checks if pending filters differ from applied filters.
 * Uses JSON serialization for deep comparison.
 */
export function filtersHaveChanged(
  pending: QuestFilters,
  applied: QuestFilters
): boolean {
  return JSON.stringify(pending) !== JSON.stringify(applied);
}

/**
 * Merges partial filter updates with existing filters.
 */
export function mergeFilters(
  current: QuestFilters,
  updates: Partial<QuestFilters>
): QuestFilters {
  return { ...current, ...updates };
}

/**
 * Validates that a trader ID exists in the traders list.
 * Returns null if not found.
 */
export function validateTraderId(
  traderId: string | null,
  traderIds: string[]
): string | null {
  if (!traderId) return null;
  return traderIds.includes(traderId) ? traderId : null;
}

/**
 * Filters quests by multiple status values.
 */
export function filterByStatuses(
  quests: QuestWithProgress[],
  statuses: QuestStatus[]
): QuestWithProgress[] {
  if (statuses.length === 0) return quests;
  return quests.filter((q) =>
    statuses.includes(q.computedStatus as QuestStatus)
  );
}

/**
 * Filters quests by trader ID.
 */
export function filterByTrader(
  quests: QuestWithProgress[],
  traderId: string | null
): QuestWithProgress[] {
  if (!traderId) return quests;
  return quests.filter((q) => q.traderId === traderId);
}

/**
 * Counts quests by status.
 */
export function countByStatus(
  quests: QuestWithProgress[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const quest of quests) {
    const status = quest.computedStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
  }

  return counts;
}

/**
 * Unit tests for quest-filters.ts
 * Pure function tests - no React dependencies.
 */

import { describe, it, expect } from "vitest";
import {
  applyQuestFilters,
  buildQuestQueryParams,
  filtersHaveChanged,
  mergeFilters,
  validateTraderId,
  filterByStatuses,
  filterByTrader,
  countByStatus,
  defaultFilters,
} from "@/lib/quest-filters";
import type { QuestWithProgress, QuestFilters, QuestStatus } from "@/types";

// Mock quest factory for testing
function createMockQuest(
  overrides: Partial<QuestWithProgress> = {}
): QuestWithProgress {
  return {
    id: "quest-1",
    tarkovDataId: "tarkov-quest-1",
    title: "Test Quest",
    description: "A test quest",
    wiki: null,
    minPlayerLevel: 1,
    taskRequirements: [],
    objectives: [],
    experience: 1000,
    traderId: "trader-1",
    trader: { id: "trader-1", name: "Prapor", normalizedName: "prapor" },
    computedStatus: "available",
    isKappa: false,
    map: "customs",
    ...overrides,
  } as QuestWithProgress;
}

describe("defaultFilters", () => {
  it("should have expected default values", () => {
    expect(defaultFilters.traderId).toBeNull();
    expect(defaultFilters.statuses).toEqual(["available", "locked"]);
    expect(defaultFilters.search).toBe("");
    expect(defaultFilters.kappaOnly).toBe(false);
    expect(defaultFilters.map).toBeNull();
    expect(defaultFilters.playerLevel).toBe(1);
  });
});

describe("applyQuestFilters", () => {
  const quests: QuestWithProgress[] = [
    createMockQuest({
      id: "quest-1",
      traderId: "trader-1",
      computedStatus: "available",
    }),
    createMockQuest({
      id: "quest-2",
      traderId: "trader-2",
      computedStatus: "completed",
    }),
    createMockQuest({
      id: "quest-3",
      traderId: "trader-1",
      computedStatus: "locked",
    }),
    createMockQuest({
      id: "quest-4",
      traderId: "trader-2",
      computedStatus: "available",
    }),
  ];

  it("should return all quests when no filters applied", () => {
    const result = applyQuestFilters(quests, {
      traderId: null,
      statuses: [],
    });
    expect(result.length).toBe(4);
  });

  it("should filter by traderId", () => {
    const result = applyQuestFilters(quests, {
      traderId: "trader-1",
      statuses: [],
    });
    expect(result.length).toBe(2);
    expect(result.every((q) => q.traderId === "trader-1")).toBe(true);
  });

  it("should filter by single status", () => {
    const result = applyQuestFilters(quests, {
      traderId: null,
      statuses: ["available"],
    });
    expect(result.length).toBe(2);
    expect(result.every((q) => q.computedStatus === "available")).toBe(true);
  });

  it("should filter by multiple statuses", () => {
    const result = applyQuestFilters(quests, {
      traderId: null,
      statuses: ["available", "locked"],
    });
    expect(result.length).toBe(3);
  });

  it("should combine trader and status filters", () => {
    const result = applyQuestFilters(quests, {
      traderId: "trader-1",
      statuses: ["available"],
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("quest-1");
  });

  it("should return empty array when no matches", () => {
    const result = applyQuestFilters(quests, {
      traderId: "trader-1",
      statuses: ["completed"],
    });
    expect(result.length).toBe(0);
  });

  it("should handle empty quests array", () => {
    const result = applyQuestFilters([], {
      traderId: "trader-1",
      statuses: ["available"],
    });
    expect(result.length).toBe(0);
  });
});

describe("buildQuestQueryParams", () => {
  it("should return empty params when no filters active", () => {
    const result = buildQuestQueryParams({
      kappaOnly: false,
      search: "",
    });
    expect(result.toString()).toBe("");
  });

  it("should include kappa param when kappaOnly is true", () => {
    const result = buildQuestQueryParams({
      kappaOnly: true,
      search: "",
    });
    expect(result.get("kappa")).toBe("true");
  });

  it("should include search param when search has value", () => {
    const result = buildQuestQueryParams({
      kappaOnly: false,
      search: "delivery",
    });
    expect(result.get("search")).toBe("delivery");
  });

  it("should include both params when both filters active", () => {
    const result = buildQuestQueryParams({
      kappaOnly: true,
      search: "gunsmith",
    });
    expect(result.get("kappa")).toBe("true");
    expect(result.get("search")).toBe("gunsmith");
  });

  it("should encode special characters in search", () => {
    const result = buildQuestQueryParams({
      kappaOnly: false,
      search: "test & query",
    });
    expect(result.get("search")).toBe("test & query");
  });
});

describe("filtersHaveChanged", () => {
  it("should return false for identical filters", () => {
    const filters: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(filters, filters)).toBe(false);
  });

  it("should return false for structurally equal filters", () => {
    const pending: QuestFilters = { ...defaultFilters };
    const applied: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(pending, applied)).toBe(false);
  });

  it("should return true when traderId differs", () => {
    const pending: QuestFilters = { ...defaultFilters, traderId: "trader-1" };
    const applied: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(pending, applied)).toBe(true);
  });

  it("should return true when statuses differ", () => {
    const pending: QuestFilters = {
      ...defaultFilters,
      statuses: ["completed"],
    };
    const applied: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(pending, applied)).toBe(true);
  });

  it("should return true when search differs", () => {
    const pending: QuestFilters = { ...defaultFilters, search: "test" };
    const applied: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(pending, applied)).toBe(true);
  });

  it("should return true when kappaOnly differs", () => {
    const pending: QuestFilters = { ...defaultFilters, kappaOnly: true };
    const applied: QuestFilters = { ...defaultFilters };
    expect(filtersHaveChanged(pending, applied)).toBe(true);
  });
});

describe("mergeFilters", () => {
  it("should return new object with merged values", () => {
    const current: QuestFilters = { ...defaultFilters };
    const result = mergeFilters(current, { kappaOnly: true });

    expect(result.kappaOnly).toBe(true);
    expect(result.traderId).toBeNull();
    expect(result).not.toBe(current);
  });

  it("should override multiple properties", () => {
    const current: QuestFilters = { ...defaultFilters };
    const result = mergeFilters(current, {
      traderId: "trader-1",
      search: "test",
      kappaOnly: true,
    });

    expect(result.traderId).toBe("trader-1");
    expect(result.search).toBe("test");
    expect(result.kappaOnly).toBe(true);
  });

  it("should handle empty updates", () => {
    const current: QuestFilters = { ...defaultFilters };
    const result = mergeFilters(current, {});

    expect(result).toEqual(current);
    expect(result).not.toBe(current);
  });

  it("should not mutate the original filters", () => {
    const current: QuestFilters = { ...defaultFilters };
    mergeFilters(current, { kappaOnly: true });

    expect(current.kappaOnly).toBe(false);
  });
});

describe("validateTraderId", () => {
  const traderIds = ["trader-1", "trader-2", "trader-3"];

  it("should return the traderId if it exists in the list", () => {
    expect(validateTraderId("trader-1", traderIds)).toBe("trader-1");
  });

  it("should return null if traderId not in list", () => {
    expect(validateTraderId("trader-999", traderIds)).toBeNull();
  });

  it("should return null for null input", () => {
    expect(validateTraderId(null, traderIds)).toBeNull();
  });

  it("should return null for empty traderIds list", () => {
    expect(validateTraderId("trader-1", [])).toBeNull();
  });
});

describe("filterByStatuses", () => {
  const quests: QuestWithProgress[] = [
    createMockQuest({ id: "quest-1", computedStatus: "available" }),
    createMockQuest({ id: "quest-2", computedStatus: "completed" }),
    createMockQuest({ id: "quest-3", computedStatus: "locked" }),
    createMockQuest({ id: "quest-4", computedStatus: "failed" }),
  ];

  it("should return all quests for empty statuses array", () => {
    const result = filterByStatuses(quests, []);
    expect(result.length).toBe(4);
  });

  it("should filter by single status", () => {
    const result = filterByStatuses(quests, ["available"]);
    expect(result.length).toBe(1);
    expect(result[0].computedStatus).toBe("available");
  });

  it("should filter by multiple statuses", () => {
    const result = filterByStatuses(quests, ["available", "completed"]);
    expect(result.length).toBe(2);
  });

  it("should return empty array when no matches", () => {
    const result = filterByStatuses(quests, ["unknown" as QuestStatus]);
    expect(result.length).toBe(0);
  });
});

describe("filterByTrader", () => {
  const quests: QuestWithProgress[] = [
    createMockQuest({ id: "quest-1", traderId: "trader-1" }),
    createMockQuest({ id: "quest-2", traderId: "trader-2" }),
    createMockQuest({ id: "quest-3", traderId: "trader-1" }),
  ];

  it("should return all quests for null traderId", () => {
    const result = filterByTrader(quests, null);
    expect(result.length).toBe(3);
  });

  it("should filter by traderId", () => {
    const result = filterByTrader(quests, "trader-1");
    expect(result.length).toBe(2);
    expect(result.every((q) => q.traderId === "trader-1")).toBe(true);
  });

  it("should return empty array when no matches", () => {
    const result = filterByTrader(quests, "trader-999");
    expect(result.length).toBe(0);
  });

  it("should handle empty quests array", () => {
    const result = filterByTrader([], "trader-1");
    expect(result.length).toBe(0);
  });
});

describe("countByStatus", () => {
  it("should count quests by status", () => {
    const quests: QuestWithProgress[] = [
      createMockQuest({ computedStatus: "available" }),
      createMockQuest({ computedStatus: "available" }),
      createMockQuest({ computedStatus: "completed" }),
      createMockQuest({ computedStatus: "locked" }),
    ];

    const result = countByStatus(quests);

    expect(result.available).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.locked).toBe(1);
  });

  it("should return empty object for empty quests array", () => {
    const result = countByStatus([]);
    expect(Object.keys(result).length).toBe(0);
  });

  it("should handle quests without computedStatus", () => {
    const quests: QuestWithProgress[] = [
      createMockQuest({ computedStatus: undefined as unknown as string }),
    ];

    const result = countByStatus(quests);
    expect(result.unknown).toBe(1);
  });

  it("should count all unique statuses", () => {
    const quests: QuestWithProgress[] = [
      createMockQuest({ computedStatus: "available" }),
      createMockQuest({ computedStatus: "locked" }),
      createMockQuest({ computedStatus: "completed" }),
      createMockQuest({ computedStatus: "failed" }),
    ];

    const result = countByStatus(quests);

    expect(Object.keys(result).length).toBe(4);
    expect(result.available).toBe(1);
    expect(result.locked).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.failed).toBe(1);
  });
});

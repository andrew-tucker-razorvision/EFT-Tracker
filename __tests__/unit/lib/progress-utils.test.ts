/**
 * Unit tests for progress-utils.ts
 * Pure function tests - no React dependencies.
 */

import { describe, it, expect } from "vitest";
import {
  convertProgressToMap,
  mergeUnlockedQuests,
  mergeLockedQuests,
  addToOfflineQueue,
  removeFirstFromQueue,
  shouldDebounce,
  applyOptimisticUpdate,
  type ProgressEntry,
  type QueuedUpdate,
} from "@/lib/progress-utils";
import type { QuestStatus } from "@/types";

describe("convertProgressToMap", () => {
  it("should convert an empty array to an empty Map", () => {
    const result = convertProgressToMap([]);
    expect(result.size).toBe(0);
  });

  it("should convert progress entries to a Map", () => {
    const entries: ProgressEntry[] = [
      { questId: "quest-1", status: "COMPLETED" },
      { questId: "quest-2", status: "AVAILABLE" },
    ];

    const result = convertProgressToMap(entries);

    expect(result.size).toBe(2);
    expect(result.get("quest-1")).toBe("completed");
    expect(result.get("quest-2")).toBe("available");
  });

  it("should normalize status to lowercase", () => {
    const entries: ProgressEntry[] = [
      { questId: "quest-1", status: "COMPLETED" },
      { questId: "quest-2", status: "Locked" },
      { questId: "quest-3", status: "available" },
    ];

    const result = convertProgressToMap(entries);

    expect(result.get("quest-1")).toBe("completed");
    expect(result.get("quest-2")).toBe("locked");
    expect(result.get("quest-3")).toBe("available");
  });

  it("should handle entries with optional updatedAt field", () => {
    const entries: ProgressEntry[] = [
      { questId: "quest-1", status: "COMPLETED", updatedAt: "2024-01-01" },
      { questId: "quest-2", status: "AVAILABLE" },
    ];

    const result = convertProgressToMap(entries);

    expect(result.size).toBe(2);
  });

  it("should handle duplicate questIds (last wins)", () => {
    const entries: ProgressEntry[] = [
      { questId: "quest-1", status: "LOCKED" },
      { questId: "quest-1", status: "COMPLETED" },
    ];

    const result = convertProgressToMap(entries);

    expect(result.size).toBe(1);
    expect(result.get("quest-1")).toBe("completed");
  });
});

describe("mergeUnlockedQuests", () => {
  it("should return a new Map without mutating the original", () => {
    const original = new Map<string, QuestStatus>([["quest-1", "locked"]]);
    const result = mergeUnlockedQuests(original, ["quest-2"]);

    expect(result).not.toBe(original);
    expect(original.size).toBe(1);
    expect(result.size).toBe(2);
  });

  it("should set unlocked quests to 'available'", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "completed"]]);
    const result = mergeUnlockedQuests(current, ["quest-2", "quest-3"]);

    expect(result.get("quest-2")).toBe("available");
    expect(result.get("quest-3")).toBe("available");
  });

  it("should override existing status with 'available'", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "locked"]]);
    const result = mergeUnlockedQuests(current, ["quest-1"]);

    expect(result.get("quest-1")).toBe("available");
  });

  it("should handle empty unlockedQuestIds array", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "completed"]]);
    const result = mergeUnlockedQuests(current, []);

    expect(result.size).toBe(1);
    expect(result.get("quest-1")).toBe("completed");
  });

  it("should handle empty current Map", () => {
    const result = mergeUnlockedQuests(new Map(), ["quest-1"]);

    expect(result.size).toBe(1);
    expect(result.get("quest-1")).toBe("available");
  });
});

describe("mergeLockedQuests", () => {
  it("should return a new Map without mutating the original", () => {
    const original = new Map<string, QuestStatus>([["quest-1", "available"]]);
    const result = mergeLockedQuests(original, ["quest-2"]);

    expect(result).not.toBe(original);
    expect(original.size).toBe(1);
  });

  it("should set locked quests to 'locked'", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "completed"]]);
    const result = mergeLockedQuests(current, ["quest-2", "quest-3"]);

    expect(result.get("quest-2")).toBe("locked");
    expect(result.get("quest-3")).toBe("locked");
  });

  it("should override existing status with 'locked'", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "available"]]);
    const result = mergeLockedQuests(current, ["quest-1"]);

    expect(result.get("quest-1")).toBe("locked");
  });

  it("should handle empty lockedQuestIds array", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "completed"]]);
    const result = mergeLockedQuests(current, []);

    expect(result.size).toBe(1);
  });
});

describe("addToOfflineQueue", () => {
  it("should add a new entry to an empty queue", () => {
    const result = addToOfflineQueue([], "quest-1", "completed");

    expect(result.length).toBe(1);
    expect(result[0].questId).toBe("quest-1");
    expect(result[0].status).toBe("completed");
    expect(typeof result[0].timestamp).toBe("number");
  });

  it("should add a new entry to the end of the queue", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "completed", timestamp: 1000 },
    ];

    const result = addToOfflineQueue(queue, "quest-2", "available");

    expect(result.length).toBe(2);
    expect(result[1].questId).toBe("quest-2");
  });

  it("should replace an existing entry for the same questId", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "available", timestamp: 1000 },
      { questId: "quest-2", status: "locked", timestamp: 2000 },
    ];

    const result = addToOfflineQueue(queue, "quest-1", "completed");

    expect(result.length).toBe(2);
    expect(result[0].questId).toBe("quest-1");
    expect(result[0].status).toBe("completed");
    expect(result[0].timestamp).toBeGreaterThan(1000);
  });

  it("should not mutate the original queue", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "available", timestamp: 1000 },
    ];

    const result = addToOfflineQueue(queue, "quest-2", "completed");

    expect(queue.length).toBe(1);
    expect(result.length).toBe(2);
    expect(result).not.toBe(queue);
  });
});

describe("removeFirstFromQueue", () => {
  it("should remove the first item from the queue", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "completed", timestamp: 1000 },
      { questId: "quest-2", status: "available", timestamp: 2000 },
    ];

    const result = removeFirstFromQueue(queue);

    expect(result.length).toBe(1);
    expect(result[0].questId).toBe("quest-2");
  });

  it("should return empty array when removing from single-item queue", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "completed", timestamp: 1000 },
    ];

    const result = removeFirstFromQueue(queue);

    expect(result.length).toBe(0);
  });

  it("should return empty array for empty queue", () => {
    const result = removeFirstFromQueue([]);
    expect(result.length).toBe(0);
  });

  it("should not mutate the original queue", () => {
    const queue: QueuedUpdate[] = [
      { questId: "quest-1", status: "completed", timestamp: 1000 },
    ];

    const result = removeFirstFromQueue(queue);

    expect(queue.length).toBe(1);
    expect(result).not.toBe(queue);
  });
});

describe("shouldDebounce", () => {
  it("should return true if questId is in the set", () => {
    const recentlyUpdated = new Set(["quest-1", "quest-2"]);
    expect(shouldDebounce(recentlyUpdated, "quest-1")).toBe(true);
  });

  it("should return false if questId is not in the set", () => {
    const recentlyUpdated = new Set(["quest-1"]);
    expect(shouldDebounce(recentlyUpdated, "quest-2")).toBe(false);
  });

  it("should return false for empty set", () => {
    const recentlyUpdated = new Set<string>();
    expect(shouldDebounce(recentlyUpdated, "quest-1")).toBe(false);
  });
});

describe("applyOptimisticUpdate", () => {
  it("should add a new status to the Map", () => {
    const current = new Map<string, QuestStatus>();
    const result = applyOptimisticUpdate(current, "quest-1", "completed");

    expect(result.get("quest-1")).toBe("completed");
  });

  it("should update an existing status", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "available"]]);
    const result = applyOptimisticUpdate(current, "quest-1", "completed");

    expect(result.get("quest-1")).toBe("completed");
  });

  it("should not mutate the original Map", () => {
    const current = new Map<string, QuestStatus>([["quest-1", "available"]]);
    const result = applyOptimisticUpdate(current, "quest-1", "completed");

    expect(current.get("quest-1")).toBe("available");
    expect(result).not.toBe(current);
  });

  it("should preserve other entries in the Map", () => {
    const current = new Map<string, QuestStatus>([
      ["quest-1", "completed"],
      ["quest-2", "locked"],
    ]);
    const result = applyOptimisticUpdate(current, "quest-3", "available");

    expect(result.size).toBe(3);
    expect(result.get("quest-1")).toBe("completed");
    expect(result.get("quest-2")).toBe("locked");
    expect(result.get("quest-3")).toBe("available");
  });
});

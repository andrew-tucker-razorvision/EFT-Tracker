/**
 * Pure utility functions extracted from useProgress hook.
 * These functions are testable without React dependencies.
 */

import type { QuestStatus } from "@/types";

export interface ProgressEntry {
  questId: string;
  status: string;
  updatedAt?: string;
}

export interface QueuedUpdate {
  questId: string;
  status: QuestStatus;
  timestamp: number;
}

/**
 * Converts an array of progress entries from the API into a Map.
 * Normalizes status values to lowercase.
 */
export function convertProgressToMap(
  entries: ProgressEntry[]
): Map<string, QuestStatus> {
  const progressMap = new Map<string, QuestStatus>();

  for (const entry of entries) {
    progressMap.set(entry.questId, entry.status.toLowerCase() as QuestStatus);
  }

  return progressMap;
}

/**
 * Merges unlocked quests into the progress map by setting their status to "available".
 * Returns a new Map without mutating the original.
 */
export function mergeUnlockedQuests(
  current: Map<string, QuestStatus>,
  unlockedQuestIds: string[]
): Map<string, QuestStatus> {
  const next = new Map(current);

  for (const questId of unlockedQuestIds) {
    next.set(questId, "available");
  }

  return next;
}

/**
 * Merges locked quests into the progress map by setting their status to "locked".
 * Returns a new Map without mutating the original.
 */
export function mergeLockedQuests(
  current: Map<string, QuestStatus>,
  lockedQuestIds: string[]
): Map<string, QuestStatus> {
  const next = new Map(current);

  for (const questId of lockedQuestIds) {
    next.set(questId, "locked");
  }

  return next;
}

/**
 * Adds or updates an entry in the offline queue.
 * If the questId already exists, replaces the existing entry.
 * Returns a new array without mutating the original.
 */
export function addToOfflineQueue(
  queue: QueuedUpdate[],
  questId: string,
  status: QuestStatus
): QueuedUpdate[] {
  const existingIndex = queue.findIndex((u) => u.questId === questId);
  const newUpdate: QueuedUpdate = {
    questId,
    status,
    timestamp: Date.now(),
  };

  if (existingIndex >= 0) {
    // Replace existing entry
    const newQueue = [...queue];
    newQueue[existingIndex] = newUpdate;
    return newQueue;
  }

  // Add new entry
  return [...queue, newUpdate];
}

/**
 * Removes the first item from the queue (used when successfully synced).
 * Returns a new array without mutating the original.
 */
export function removeFirstFromQueue(queue: QueuedUpdate[]): QueuedUpdate[] {
  return queue.slice(1);
}

/**
 * Checks if a quest was recently updated (for debouncing).
 */
export function shouldDebounce(
  recentlyUpdated: Set<string>,
  questId: string
): boolean {
  return recentlyUpdated.has(questId);
}

/**
 * Applies an optimistic update to the progress map.
 * Returns a new Map without mutating the original.
 */
export function applyOptimisticUpdate(
  current: Map<string, QuestStatus>,
  questId: string,
  newStatus: QuestStatus
): Map<string, QuestStatus> {
  const next = new Map(current);
  next.set(questId, newStatus);
  return next;
}

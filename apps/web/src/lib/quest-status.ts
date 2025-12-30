/**
 * Quest Status Computation Utility
 *
 * Computes the effective quest status based on stored status and objective progress.
 * This is used to determine IN_PROGRESS status when some objectives are done.
 */

import type { QuestStatus } from "@prisma/client";

export interface ObjectiveWithProgress {
  id: string;
  optional: boolean;
  count?: number | null; // Target count from Objective (for numeric objectives)
  progress?:
    | { completed: boolean; current?: number | null; target?: number | null }[]
    | null;
}

export interface ObjectiveProgressSummary {
  total: number;
  completed: number;
  requiredTotal: number;
  requiredCompleted: number;
}

/**
 * Check if an objective is complete.
 * For numeric objectives (with target), checks if current >= target.
 * For binary objectives, checks the completed flag.
 */
export function isObjectiveComplete(
  progress:
    | { completed: boolean; current?: number | null; target?: number | null }
    | null
    | undefined
): boolean {
  if (!progress) return false;

  // For numeric objectives, check current >= target
  if (
    progress.target !== null &&
    progress.target !== undefined &&
    progress.target > 0
  ) {
    const current = progress.current ?? 0;
    return current >= progress.target;
  }

  // For binary objectives, use the completed flag
  return progress.completed === true;
}

/**
 * Compute objective progress summary for a quest.
 * Returns counts of total and completed objectives, separated by required vs optional.
 */
export function computeObjectiveProgress(
  objectives: ObjectiveWithProgress[]
): ObjectiveProgressSummary {
  let total = 0;
  let completed = 0;
  let requiredTotal = 0;
  let requiredCompleted = 0;

  for (const obj of objectives) {
    total++;
    const isComplete = isObjectiveComplete(obj.progress?.[0]);

    if (isComplete) {
      completed++;
    }

    if (!obj.optional) {
      requiredTotal++;
      if (isComplete) {
        requiredCompleted++;
      }
    }
  }

  return { total, completed, requiredTotal, requiredCompleted };
}

/**
 * Compute the effective quest status based on stored status and objective progress.
 *
 * Rules:
 * - If stored status is LOCKED, always return LOCKED (dependencies not met)
 * - If all required objectives are complete, return COMPLETED
 * - If at least one required objective is complete, return IN_PROGRESS
 * - Otherwise, return the stored status (AVAILABLE or computed default)
 *
 * @param storedStatus - The status stored in QuestProgress (or null if no progress)
 * @param objectives - Array of objectives with their progress
 * @param defaultStatus - Status to use when no progress exists (default: "AVAILABLE")
 */
export function computeQuestStatus(
  storedStatus: QuestStatus | null,
  objectives: ObjectiveWithProgress[],
  defaultStatus: QuestStatus = "AVAILABLE"
): QuestStatus {
  // If locked, stay locked - dependencies take precedence
  if (storedStatus === "LOCKED") {
    return "LOCKED";
  }

  // If no objectives, use stored status or default
  if (objectives.length === 0) {
    return storedStatus ?? defaultStatus;
  }

  const { requiredTotal, requiredCompleted } =
    computeObjectiveProgress(objectives);

  // If no required objectives, treat all objectives as required
  const effectiveTotal = requiredTotal > 0 ? requiredTotal : objectives.length;
  const effectiveCompleted =
    requiredTotal > 0
      ? requiredCompleted
      : objectives.filter((o) => isObjectiveComplete(o.progress?.[0])).length;

  // All required objectives complete -> COMPLETED
  if (effectiveCompleted >= effectiveTotal && effectiveTotal > 0) {
    return "COMPLETED";
  }

  // Some required objectives complete -> IN_PROGRESS
  if (effectiveCompleted > 0) {
    return "IN_PROGRESS";
  }

  // No objectives complete, use stored status or default
  return storedStatus ?? defaultStatus;
}

/**
 * Check if a quest should auto-complete based on objective progress.
 * Returns true if all required objectives are marked as complete.
 * For numeric objectives, checks if current >= target.
 */
export function shouldAutoCompleteQuest(
  objectives: ObjectiveWithProgress[]
): boolean {
  if (objectives.length === 0) {
    return false; // Can't auto-complete a quest with no objectives
  }

  const requiredObjectives = objectives.filter((o) => !o.optional);

  // If no required objectives, all objectives must be complete
  const targetObjectives =
    requiredObjectives.length > 0 ? requiredObjectives : objectives;

  return targetObjectives.every((o) => isObjectiveComplete(o.progress?.[0]));
}

/**
 * Determine if completing/uncompleting an objective would change the quest status.
 * Useful for deciding whether to trigger auto-unlock logic.
 */
export function wouldObjectiveChangeQuestStatus(
  currentStatus: QuestStatus,
  objectives: ObjectiveWithProgress[],
  objectiveId: string,
  newCompletedValue: boolean,
  newCurrent?: number | null,
  newTarget?: number | null
): { wouldChange: boolean; newStatus: QuestStatus } {
  // Create a copy of objectives with the updated progress
  const updatedObjectives = objectives.map((obj) => {
    if (obj.id === objectiveId) {
      return {
        ...obj,
        progress: [
          {
            completed: newCompletedValue,
            current: newCurrent ?? null,
            target: newTarget ?? null,
          },
        ],
      };
    }
    return obj;
  });

  const newStatus = computeQuestStatus(currentStatus, updatedObjectives);
  return {
    wouldChange: newStatus !== currentStatus,
    newStatus,
  };
}

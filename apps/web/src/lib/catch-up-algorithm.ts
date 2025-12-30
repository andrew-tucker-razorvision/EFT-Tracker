/**
 * Catch-up algorithm for detecting sibling terminal branches
 *
 * Given a set of "target quests" (quests the user is currently on), this algorithm:
 * 1. Finds all prerequisites for those quests (required to be completed)
 * 2. Detects terminal quest branches that share ancestors with the selected quests
 *    (these are sibling branches that likely ended before the user's current position)
 */

import type {
  QuestWithProgress,
  CatchUpSelection,
  CatchUpCalculation,
} from "@eft-tracker/types";

/**
 * Build a map of quest IDs to quests for efficient lookup
 */
function buildQuestMap(
  quests: QuestWithProgress[]
): Map<string, QuestWithProgress> {
  const map = new Map<string, QuestWithProgress>();
  for (const quest of quests) {
    map.set(quest.id, quest);
  }
  return map;
}

/**
 * Recursively collect all ancestors (prerequisites) for a quest
 */
export function collectAncestors(
  questId: string,
  questMap: Map<string, QuestWithProgress>,
  visited: Set<string> = new Set()
): Set<string> {
  if (visited.has(questId)) return visited;

  const quest = questMap.get(questId);
  if (!quest) return visited;

  visited.add(questId);

  for (const dep of quest.dependsOn || []) {
    const prereqId = dep.requiredQuest?.id;
    if (prereqId) {
      collectAncestors(prereqId, questMap, visited);
    }
  }

  return visited;
}

/**
 * Recursively collect all descendants (quests that depend on this one)
 */
export function collectDescendants(
  questId: string,
  questMap: Map<string, QuestWithProgress>,
  visited: Set<string> = new Set()
): Set<string> {
  if (visited.has(questId)) return visited;

  const quest = questMap.get(questId);
  if (!quest) return visited;

  visited.add(questId);

  for (const dep of quest.dependedOnBy || []) {
    const dependentId = dep.dependentQuest?.id;
    if (dependentId) {
      collectDescendants(dependentId, questMap, visited);
    }
  }

  return visited;
}

/**
 * Check if a quest is terminal (has no dependents)
 */
function isTerminal(quest: QuestWithProgress): boolean {
  return !quest.dependedOnBy || quest.dependedOnBy.length === 0;
}

/**
 * Get the chain length (number of prerequisites) for a quest
 */
export function getChainLength(
  questId: string,
  questMap: Map<string, QuestWithProgress>
): number {
  const ancestors = collectAncestors(questId, questMap);
  return ancestors.size - 1; // Exclude the quest itself
}

/**
 * Convert a quest to a CatchUpSelection
 */
function questToSelection(
  quest: QuestWithProgress,
  questMap: Map<string, QuestWithProgress>
): CatchUpSelection {
  return {
    questId: quest.id,
    questTitle: quest.title,
    traderId: quest.traderId,
    traderName: quest.trader?.name || "Unknown",
    traderColor: quest.trader?.color || "#888888",
    levelRequired: quest.levelRequired,
    chainLength: getChainLength(quest.id, questMap),
  };
}

/**
 * Get all prerequisites for the selected quests
 * These are "locked" - they must be completed for the user to be on the target quests
 */
export function getPrerequisitesForSelection(
  targetQuestIds: string[],
  quests: QuestWithProgress[]
): CatchUpSelection[] {
  const questMap = buildQuestMap(quests);
  const allPrereqs = new Set<string>();

  // Collect all prerequisites for all target quests
  for (const targetId of targetQuestIds) {
    const ancestors = collectAncestors(targetId, questMap);
    ancestors.delete(targetId); // Don't include the target quest itself
    for (const ancestorId of ancestors) {
      allPrereqs.add(ancestorId);
    }
  }

  // Convert to selections
  const selections: CatchUpSelection[] = [];
  for (const prereqId of allPrereqs) {
    const quest = questMap.get(prereqId);
    if (quest) {
      selections.push(questToSelection(quest, questMap));
    }
  }

  // Sort by chain length (shorter chains first)
  return selections.sort((a, b) => (a.chainLength ?? 0) - (b.chainLength ?? 0));
}

/**
 * Get terminal quests that share ancestors with the selected quests
 * These are sibling branches that likely ended before the user's current position
 *
 * Logic:
 * 1. Find all ancestors of the target quests
 * 2. Find all descendants of those ancestors (entire subtrees)
 * 3. Filter to terminal quests only
 * 4. Exclude any quests that are ancestors or descendants of target quests
 */
export function getCompletedBranches(
  targetQuestIds: string[],
  quests: QuestWithProgress[]
): CatchUpSelection[] {
  const questMap = buildQuestMap(quests);
  const targetSet = new Set(targetQuestIds);

  // Step 1: Collect all ancestors of target quests
  const allAncestors = new Set<string>();
  for (const targetId of targetQuestIds) {
    const ancestors = collectAncestors(targetId, questMap);
    for (const ancestorId of ancestors) {
      allAncestors.add(ancestorId);
    }
  }

  // Step 2: Collect all descendants of target quests (to exclude)
  const allDescendants = new Set<string>();
  for (const targetId of targetQuestIds) {
    const descendants = collectDescendants(targetId, questMap);
    for (const descendantId of descendants) {
      allDescendants.add(descendantId);
    }
  }

  // Step 3: Find terminal quests that branch off from shared ancestors
  const completedBranches: CatchUpSelection[] = [];

  for (const quest of quests) {
    // Skip non-terminal quests
    if (!isTerminal(quest)) continue;

    // Skip target quests themselves
    if (targetSet.has(quest.id)) continue;

    // Skip ancestors of target quests (they're prerequisites, not siblings)
    if (allAncestors.has(quest.id)) continue;

    // Skip descendants of target quests
    if (allDescendants.has(quest.id)) continue;

    // Check if this terminal quest shares an ancestor with any target quest
    const questAncestors = collectAncestors(quest.id, questMap);

    let sharesAncestor = false;
    for (const ancestorId of questAncestors) {
      if (allAncestors.has(ancestorId)) {
        sharesAncestor = true;
        break;
      }
    }

    if (sharesAncestor) {
      const selection = questToSelection(quest, questMap);
      // Mark as auto-checked if level requirement is at or below player level
      completedBranches.push(selection);
    }
  }

  // Sort by level required, then by trader name
  return completedBranches.sort((a, b) => {
    const aLevel = a.levelRequired ?? 0;
    const bLevel = b.levelRequired ?? 0;
    if (aLevel !== bLevel) {
      return aLevel - bLevel;
    }
    const aName = a.traderName ?? "";
    const bName = b.traderName ?? "";
    return aName.localeCompare(bName);
  });
}

/**
 * Main entry point: calculate the full catch-up data
 */
export function calculateCatchUp(
  targetQuestIds: string[],
  quests: QuestWithProgress[]
): CatchUpCalculation {
  return {
    prerequisites: getPrerequisitesForSelection(targetQuestIds, quests),
    completedBranches: getCompletedBranches(targetQuestIds, quests),
  };
}

/**
 * Get all quest IDs that would be completed for a branch
 * (the terminal quest + all its prerequisites)
 */
export function getBranchQuestIds(
  terminalQuestId: string,
  quests: QuestWithProgress[]
): string[] {
  const questMap = buildQuestMap(quests);
  const ancestors = collectAncestors(terminalQuestId, questMap);
  return Array.from(ancestors);
}

/**
 * Group selections by trader for display
 */
export function groupByTrader(
  selections: CatchUpSelection[]
): Map<string, CatchUpSelection[]> {
  const groups = new Map<string, CatchUpSelection[]>();

  for (const selection of selections) {
    const traderId = selection.traderId ?? "unknown";
    const existing = groups.get(traderId) || [];
    existing.push(selection);
    groups.set(traderId, existing);
  }

  return groups;
}

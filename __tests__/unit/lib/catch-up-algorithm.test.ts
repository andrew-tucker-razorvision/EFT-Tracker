/**
 * Unit tests for catch-up algorithm
 */

import { describe, it, expect } from "vitest";
import type { QuestWithProgress } from "@eft-tracker/types";
import {
  collectAncestors,
  collectDescendants,
  getChainLength,
  getPrerequisitesForSelection,
  getCompletedBranches,
  calculateCatchUp,
  getBranchQuestIds,
  groupByTrader,
} from "@/lib/catch-up-algorithm";

// Helper to create mock quests
function createMockQuest(
  id: string,
  title: string,
  traderId: string,
  levelRequired: number,
  dependsOnIds: string[] = [],
  dependedOnByIds: string[] = []
): QuestWithProgress {
  return {
    id,
    title,
    traderId,
    levelRequired,
    kappaRequired: false,
    questType: "standard",
    factionName: null,
    wikiLink: null,
    objectives: [],
    trader: { id: traderId, name: traderId.charAt(0).toUpperCase() + traderId.slice(1), color: "#FF9800" },
    dependsOn: dependsOnIds.map((reqId) => ({
      requiredQuest: { id: reqId } as QuestWithProgress,
      requirementStatus: ["complete"] as const,
    })),
    dependedOnBy: dependedOnByIds.map((depId) => ({
      dependentQuest: { id: depId } as QuestWithProgress,
      requirementStatus: ["complete"] as const,
    })),
    progress: null,
    computedStatus: "available",
  } as QuestWithProgress;
}

// Test quest graph:
// A (Lv 10) -> B (Lv 12) -> C (terminal, Lv 14)
//                       -> D (Lv 15) -> E (terminal, Lv 17)
const mockQuests: QuestWithProgress[] = [
  createMockQuest("A", "Quest A", "prapor", 10, [], ["B"]),
  createMockQuest("B", "Quest B", "prapor", 12, ["A"], ["C", "D"]),
  createMockQuest("C", "Quest C", "prapor", 14, ["B"], []), // Terminal
  createMockQuest("D", "Quest D", "prapor", 15, ["B"], ["E"]),
  createMockQuest("E", "Quest E", "prapor", 17, ["D"], []), // Terminal
];

// More complex graph with multiple traders:
// A (prapor) -> B (prapor) -> C (terminal, prapor)
//            -> D (therapist) -> E (terminal, therapist)
// F (skier) -> G (terminal, skier)
const multiTraderQuests: QuestWithProgress[] = [
  createMockQuest("A", "Prapor Quest A", "prapor", 10, [], ["B", "D"]),
  createMockQuest("B", "Prapor Quest B", "prapor", 12, ["A"], ["C"]),
  createMockQuest("C", "Prapor Quest C", "prapor", 14, ["B"], []), // Terminal
  createMockQuest("D", "Therapist Quest D", "therapist", 11, ["A"], ["E"]),
  createMockQuest("E", "Therapist Quest E", "therapist", 13, ["D"], []), // Terminal
  createMockQuest("F", "Skier Quest F", "skier", 8, [], ["G"]),
  createMockQuest("G", "Skier Quest G", "skier", 10, ["F"], []), // Terminal
];

describe("collectAncestors", () => {
  it("returns empty set for quest with no ancestors", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    const ancestors = collectAncestors("A", questMap);
    expect(ancestors.size).toBe(1); // Just itself
    expect(ancestors.has("A")).toBe(true);
  });

  it("collects all ancestors for a deeply nested quest", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    const ancestors = collectAncestors("E", questMap);
    expect(ancestors.has("A")).toBe(true);
    expect(ancestors.has("B")).toBe(true);
    expect(ancestors.has("D")).toBe(true);
    expect(ancestors.has("E")).toBe(true);
    expect(ancestors.size).toBe(4);
  });
});

describe("collectDescendants", () => {
  it("returns empty set for terminal quest", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    const descendants = collectDescendants("C", questMap);
    expect(descendants.size).toBe(1); // Just itself
    expect(descendants.has("C")).toBe(true);
  });

  it("collects all descendants for root quest", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    const descendants = collectDescendants("A", questMap);
    expect(descendants.has("A")).toBe(true);
    expect(descendants.has("B")).toBe(true);
    expect(descendants.has("C")).toBe(true);
    expect(descendants.has("D")).toBe(true);
    expect(descendants.has("E")).toBe(true);
    expect(descendants.size).toBe(5);
  });
});

describe("getChainLength", () => {
  it("returns 0 for root quest", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    expect(getChainLength("A", questMap)).toBe(0);
  });

  it("returns correct chain length for nested quests", () => {
    const questMap = new Map(mockQuests.map((q) => [q.id, q]));
    expect(getChainLength("B", questMap)).toBe(1); // A
    expect(getChainLength("C", questMap)).toBe(2); // A, B
    expect(getChainLength("D", questMap)).toBe(2); // A, B
    expect(getChainLength("E", questMap)).toBe(3); // A, B, D
  });
});

describe("getPrerequisitesForSelection", () => {
  it("returns empty array when selecting root quest", () => {
    const prereqs = getPrerequisitesForSelection(["A"], mockQuests);
    expect(prereqs.length).toBe(0);
  });

  it("returns all prerequisites for a nested quest", () => {
    const prereqs = getPrerequisitesForSelection(["D"], mockQuests);
    expect(prereqs.length).toBe(2);
    expect(prereqs.map((p) => p.questId)).toContain("A");
    expect(prereqs.map((p) => p.questId)).toContain("B");
  });

  it("returns union of prerequisites for multiple selections", () => {
    const prereqs = getPrerequisitesForSelection(["C", "E"], mockQuests);
    expect(prereqs.map((p) => p.questId)).toContain("A");
    expect(prereqs.map((p) => p.questId)).toContain("B");
    expect(prereqs.map((p) => p.questId)).toContain("D");
    expect(prereqs.length).toBe(3);
  });

  it("sorts by chain length", () => {
    const prereqs = getPrerequisitesForSelection(["E"], mockQuests);
    expect(prereqs[0].questId).toBe("A"); // Chain length 0
    expect(prereqs[1].questId).toBe("B"); // Chain length 1
    expect(prereqs[2].questId).toBe("D"); // Chain length 2
  });
});

describe("getCompletedBranches", () => {
  it("returns terminal sibling branches", () => {
    // If user is on D, C is a sibling terminal branch
    const branches = getCompletedBranches(["D"], mockQuests);
    expect(branches.length).toBe(1);
    expect(branches[0].questId).toBe("C");
  });

  it("does not include descendants of target as siblings", () => {
    // If user is on D, E is a descendant, not a sibling
    const branches = getCompletedBranches(["D"], mockQuests);
    expect(branches.map((b) => b.questId)).not.toContain("E");
  });

  it("does not include ancestors of target", () => {
    const branches = getCompletedBranches(["E"], mockQuests);
    expect(branches.map((b) => b.questId)).not.toContain("A");
    expect(branches.map((b) => b.questId)).not.toContain("B");
    expect(branches.map((b) => b.questId)).not.toContain("D");
  });

  it("returns sibling terminal for deepest quest", () => {
    // If user is on E, C is a sibling terminal branch
    const branches = getCompletedBranches(["E"], mockQuests);
    expect(branches.length).toBe(1);
    expect(branches[0].questId).toBe("C");
  });

  it("returns empty for root quest with no siblings", () => {
    const branches = getCompletedBranches(["A"], mockQuests);
    expect(branches.length).toBe(0);
  });
});

describe("calculateCatchUp", () => {
  it("returns prerequisites and completed branches", () => {
    const result = calculateCatchUp(["D"], mockQuests);
    expect(result.prerequisites.length).toBe(2); // A, B
    expect(result.completedBranches.length).toBe(1); // C
  });

  it("handles multiple target quests", () => {
    const result = calculateCatchUp(["C", "E"], mockQuests);
    // Prerequisites should include A, B, D (union of both chains)
    expect(result.prerequisites.map((p) => p.questId)).toContain("A");
    expect(result.prerequisites.map((p) => p.questId)).toContain("B");
    expect(result.prerequisites.map((p) => p.questId)).toContain("D");
    // No completed branches since both terminal quests are selected
    expect(result.completedBranches.length).toBe(0);
  });
});

describe("getBranchQuestIds", () => {
  it("returns terminal quest and all its prerequisites", () => {
    const branchIds = getBranchQuestIds("C", mockQuests);
    expect(branchIds).toContain("A");
    expect(branchIds).toContain("B");
    expect(branchIds).toContain("C");
    expect(branchIds.length).toBe(3);
  });

  it("returns full chain for deeply nested quest", () => {
    const branchIds = getBranchQuestIds("E", mockQuests);
    expect(branchIds).toContain("A");
    expect(branchIds).toContain("B");
    expect(branchIds).toContain("D");
    expect(branchIds).toContain("E");
    expect(branchIds.length).toBe(4);
  });
});

describe("groupByTrader", () => {
  it("groups selections by trader", () => {
    const selections = [
      { questId: "A", questTitle: "Quest A", traderId: "prapor", traderName: "Prapor", traderColor: "#FF0000", levelRequired: 10, chainLength: 0 },
      { questId: "B", questTitle: "Quest B", traderId: "prapor", traderName: "Prapor", traderColor: "#FF0000", levelRequired: 12, chainLength: 1 },
      { questId: "C", questTitle: "Quest C", traderId: "therapist", traderName: "Therapist", traderColor: "#00FF00", levelRequired: 11, chainLength: 0 },
    ];

    const groups = groupByTrader(selections);
    expect(groups.size).toBe(2);
    expect(groups.get("prapor")?.length).toBe(2);
    expect(groups.get("therapist")?.length).toBe(1);
  });

  it("returns empty map for empty input", () => {
    const groups = groupByTrader([]);
    expect(groups.size).toBe(0);
  });
});

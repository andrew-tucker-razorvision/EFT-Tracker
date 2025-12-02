import { describe, it, expect, vi } from "vitest";
import {
  buildQuestGraph,
  filterQuestsByTrader,
  getQuestMaps,
  computeQuestStatus,
  getQuestChain,
} from "@/lib/quest-layout";
import {
  mockQuests,
  mockQuestsWithProgress,
  createQuestWithProgress,
  QUEST_IDS,
} from "../../../test/fixtures/quests";
import type { QuestWithProgress } from "@/types";

describe("quest-layout", () => {
  describe("buildQuestGraph", () => {
    const mockOptions = {
      onStatusChange: vi.fn(),
      onClick: vi.fn(),
      onFocus: vi.fn(),
      selectedQuestId: null,
    };

    it("should return nodes and edges", () => {
      const graph = buildQuestGraph(mockQuestsWithProgress, mockOptions);

      expect(graph).toHaveProperty("nodes");
      expect(graph).toHaveProperty("edges");
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
    });

    it("should create a node for each quest", () => {
      const graph = buildQuestGraph(mockQuestsWithProgress, mockOptions);

      expect(graph.nodes.length).toBe(mockQuestsWithProgress.length);

      // Each node should have required properties
      graph.nodes.forEach((node) => {
        expect(node).toHaveProperty("id");
        expect(node).toHaveProperty("type", "quest");
        expect(node).toHaveProperty("position");
        expect(node.position).toHaveProperty("x");
        expect(node.position).toHaveProperty("y");
        expect(node).toHaveProperty("data");
      });
    });

    it("should position nodes (x, y should be numbers)", () => {
      const graph = buildQuestGraph(mockQuestsWithProgress, mockOptions);

      graph.nodes.forEach((node) => {
        expect(typeof node.position.x).toBe("number");
        expect(typeof node.position.y).toBe("number");
        // Positions should be finite numbers
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
      });
    });

    it("should create edges for quest dependencies", () => {
      const graph = buildQuestGraph(mockQuestsWithProgress, mockOptions);

      // We have one dependency: Checking depends on Debut
      const debutToCheckingEdge = graph.edges.find(
        (e) => e.source === QUEST_IDS.DEBUT && e.target === QUEST_IDS.CHECKING
      );

      expect(debutToCheckingEdge).toBeDefined();
      expect(debutToCheckingEdge?.type).toBe("default"); // Bezier curves
    });

    it("should mark selected quest", () => {
      const selectedId = QUEST_IDS.DEBUT;
      const graph = buildQuestGraph(mockQuestsWithProgress, {
        ...mockOptions,
        selectedQuestId: selectedId,
      });

      const selectedNode = graph.nodes.find((n) => n.id === selectedId);
      const otherNode = graph.nodes.find((n) => n.id !== selectedId);

      expect(selectedNode?.data.isSelected).toBe(true);
      expect(otherNode?.data.isSelected).toBe(false);
    });

    it("should include callback functions in node data", () => {
      const onStatusChange = vi.fn();
      const onClick = vi.fn();
      const onFocus = vi.fn();

      const graph = buildQuestGraph(mockQuestsWithProgress, {
        onStatusChange,
        onClick,
        onFocus,
        selectedQuestId: null,
      });

      const node = graph.nodes[0];
      expect(node.data.onStatusChange).toBe(onStatusChange);
      expect(node.data.onClick).toBe(onClick);
      expect(node.data.onFocus).toBe(onFocus);
    });

    it("should handle empty quest array", () => {
      const graph = buildQuestGraph([], mockOptions);

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });

    it("should animate edges for available quests", () => {
      // Create quests where "Checking" is available (Debut completed)
      const questsWithAvailable = [
        createQuestWithProgress(mockQuests[0], "completed"), // Debut
        createQuestWithProgress(mockQuests[1], "available"), // Checking
      ];

      const graph = buildQuestGraph(questsWithAvailable, mockOptions);

      const edge = graph.edges.find((e) => e.target === QUEST_IDS.CHECKING);
      expect(edge?.animated).toBe(true);
    });
  });

  describe("filterQuestsByTrader", () => {
    it("should filter quests by trader ID", () => {
      const praporQuests = filterQuestsByTrader(
        mockQuestsWithProgress,
        "trader_prapor"
      );

      expect(praporQuests.length).toBeGreaterThan(0);
      praporQuests.forEach((quest) => {
        expect(quest.traderId).toBe("trader_prapor");
      });
    });

    it("should return empty array for unknown trader", () => {
      const quests = filterQuestsByTrader(
        mockQuestsWithProgress,
        "unknown_trader"
      );

      expect(quests).toEqual([]);
    });

    it("should return empty array for empty input", () => {
      const quests = filterQuestsByTrader([], "trader_prapor");

      expect(quests).toEqual([]);
    });
  });

  describe("getQuestMaps", () => {
    it("should extract unique maps from quests", () => {
      const maps = getQuestMaps(mockQuestsWithProgress);

      expect(Array.isArray(maps)).toBe(true);
      expect(maps).toContain("Customs");
      expect(maps).toContain("Factory");
    });

    it("should return sorted maps", () => {
      const maps = getQuestMaps(mockQuestsWithProgress);

      const sortedMaps = [...maps].sort();
      expect(maps).toEqual(sortedMaps);
    });

    it("should exclude null maps", () => {
      const maps = getQuestMaps(mockQuestsWithProgress);

      maps.forEach((map) => {
        expect(map).not.toBeNull();
        expect(map).not.toBe("");
      });
    });

    it("should handle quests with no objectives", () => {
      const questsWithoutObjectives: QuestWithProgress[] = [
        {
          ...mockQuestsWithProgress[0],
          objectives: [],
        },
      ];

      const maps = getQuestMaps(questsWithoutObjectives);

      expect(maps).toEqual([]);
    });

    it("should return empty array for empty quest array", () => {
      const maps = getQuestMaps([]);

      expect(maps).toEqual([]);
    });
  });

  describe("computeQuestStatus", () => {
    it("should return progress status if user has progress", () => {
      const questMap = new Map(mockQuestsWithProgress.map((q) => [q.id, q]));

      // Find a quest with progress
      const questWithProgress = mockQuestsWithProgress.find(
        (q) => q.progress !== null
      );

      if (questWithProgress) {
        const status = computeQuestStatus(questWithProgress, questMap);
        expect(status).toBe(questWithProgress.progress?.status);
      }
    });

    it("should return available for quest with no dependencies", () => {
      const questWithNoDeps: QuestWithProgress = {
        ...mockQuestsWithProgress[0],
        progress: null,
        dependsOn: [],
      };

      const questMap = new Map([[questWithNoDeps.id, questWithNoDeps]]);

      const status = computeQuestStatus(questWithNoDeps, questMap);
      expect(status).toBe("available");
    });

    it("should return available when all dependencies completed", () => {
      // Create parent quest that is completed
      const parentQuest: QuestWithProgress = createQuestWithProgress(
        mockQuests[0],
        "completed"
      );

      // Create child quest with dependency
      const childQuest: QuestWithProgress = {
        ...createQuestWithProgress(mockQuests[1], "locked"),
        progress: null, // No explicit progress
        dependsOn: [
          { requiredQuest: parentQuest, requirementStatus: ["complete"] },
        ],
      };

      const questMap = new Map([
        [parentQuest.id, parentQuest],
        [childQuest.id, childQuest],
      ]);

      const status = computeQuestStatus(childQuest, questMap);
      expect(status).toBe("available");
    });

    it("should return locked when dependencies not completed", () => {
      // Create parent quest that is NOT completed
      const parentQuest: QuestWithProgress = createQuestWithProgress(
        mockQuests[0],
        "available"
      );

      // Create child quest with dependency
      const childQuest: QuestWithProgress = {
        ...createQuestWithProgress(mockQuests[1], "locked"),
        progress: null, // No explicit progress
        dependsOn: [
          { requiredQuest: parentQuest, requirementStatus: ["complete"] },
        ],
      };

      const questMap = new Map([
        [parentQuest.id, parentQuest],
        [childQuest.id, childQuest],
      ]);

      const status = computeQuestStatus(childQuest, questMap);
      expect(status).toBe("locked");
    });
  });

  describe("getQuestChain", () => {
    it("should include the focused quest itself", () => {
      const chain = getQuestChain(QUEST_IDS.DEBUT, mockQuestsWithProgress);
      expect(chain.has(QUEST_IDS.DEBUT)).toBe(true);
    });

    it("should include dependents of the focused quest", () => {
      // Checking depends on Debut, so Checking should be in Debut's chain
      const chain = getQuestChain(QUEST_IDS.DEBUT, mockQuestsWithProgress);
      expect(chain.has(QUEST_IDS.CHECKING)).toBe(true);
    });

    it("should include prerequisites of the focused quest", () => {
      // Debut is a prerequisite for Checking, so Debut should be in Checking's chain
      const chain = getQuestChain(QUEST_IDS.CHECKING, mockQuestsWithProgress);
      expect(chain.has(QUEST_IDS.DEBUT)).toBe(true);
    });

    it("should return only the quest when it has no dependencies", () => {
      // BP Depot has no dependencies
      const chain = getQuestChain(QUEST_IDS.BP_DEPOT, mockQuestsWithProgress);
      expect(chain.has(QUEST_IDS.BP_DEPOT)).toBe(true);
      // Should not include unrelated quests
      expect(chain.has(QUEST_IDS.DEBUT)).toBe(false);
    });
  });
});

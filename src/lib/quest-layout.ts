import dagre from "dagre";
import type { QuestWithProgress, QuestNode, QuestEdge, QuestStatus } from "@/types";
import { QUEST_NODE_WIDTH, QUEST_NODE_HEIGHT } from "@/components/quest-tree/QuestNode";

const LAYOUT_CONFIG = {
  rankdir: "LR" as const, // Left-to-right layout
  nodesep: 50, // Vertical spacing between nodes
  ranksep: 120, // Horizontal spacing (dependency levels)
  marginx: 40,
  marginy: 40,
};

interface BuildQuestGraphOptions {
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onClick: (questId: string) => void;
  selectedQuestId?: string | null;
}

export interface QuestGraph {
  nodes: QuestNode[];
  edges: QuestEdge[];
}

export function buildQuestGraph(
  quests: QuestWithProgress[],
  options: BuildQuestGraphOptions
): QuestGraph {
  const { onStatusChange, onClick, selectedQuestId } = options;

  // Create a map for quick quest lookup
  const questMap = new Map(quests.map((q) => [q.id, q]));

  // Create Dagre graph
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph(LAYOUT_CONFIG);

  // Add nodes
  for (const quest of quests) {
    g.setNode(quest.id, {
      width: QUEST_NODE_WIDTH,
      height: QUEST_NODE_HEIGHT,
    });
  }

  // Add edges (from required quest to dependent quest)
  const edges: QuestEdge[] = [];
  for (const quest of quests) {
    for (const dep of quest.dependsOn || []) {
      const requiredQuest = questMap.get(dep.requiredQuest.id);
      if (requiredQuest) {
        g.setEdge(dep.requiredQuest.id, quest.id);
        edges.push({
          id: `${dep.requiredQuest.id}-${quest.id}`,
          source: dep.requiredQuest.id,
          target: quest.id,
          type: "smoothstep",
          animated: quest.computedStatus === "available",
          style: {
            stroke:
              quest.computedStatus === "completed"
                ? "#10B981"
                : quest.computedStatus === "available"
                  ? "#3B82F6"
                  : "#9CA3AF",
            strokeWidth: 2,
          },
          data: {
            sourceStatus: requiredQuest.computedStatus,
            targetStatus: quest.computedStatus,
          },
        });
      }
    }
  }

  // Run Dagre layout
  dagre.layout(g);

  // Convert to React Flow nodes
  const nodes: QuestNode[] = quests.map((quest) => {
    const nodeWithPosition = g.node(quest.id);
    return {
      id: quest.id,
      type: "quest",
      position: {
        // Dagre returns center position, adjust to top-left for React Flow
        x: nodeWithPosition.x - QUEST_NODE_WIDTH / 2,
        y: nodeWithPosition.y - QUEST_NODE_HEIGHT / 2,
      },
      data: {
        quest,
        isSelected: quest.id === selectedQuestId,
        onStatusChange,
        onClick,
      },
    };
  });

  return { nodes, edges };
}

// Filter quests by trader and return subgraph
export function filterQuestsByTrader(
  quests: QuestWithProgress[],
  traderId: string
): QuestWithProgress[] {
  return quests.filter((q) => q.traderId === traderId);
}

// Get all unique maps from quest objectives
export function getQuestMaps(quests: QuestWithProgress[]): string[] {
  const maps = new Set<string>();
  for (const quest of quests) {
    for (const obj of quest.objectives || []) {
      if (obj.map) {
        maps.add(obj.map);
      }
    }
  }
  return Array.from(maps).sort();
}

// Compute quest status based on dependencies
export function computeQuestStatus(
  quest: QuestWithProgress,
  questMap: Map<string, QuestWithProgress>
): QuestStatus {
  // If user has explicit progress, use that
  if (quest.progress) {
    return quest.progress.status;
  }

  // Check if all dependencies are completed
  const allDepsCompleted = (quest.dependsOn || []).every((dep) => {
    const requiredQuest = questMap.get(dep.requiredQuest.id);
    return requiredQuest?.computedStatus === "completed";
  });

  // If no dependencies or all completed, quest is available
  if (quest.dependsOn?.length === 0 || allDepsCompleted) {
    return "available";
  }

  return "locked";
}

import dagre from "dagre";
import type { Edge } from "@xyflow/react";
import type {
  QuestWithProgress,
  QuestNode,
  QuestEdge,
  QuestStatus,
  Trader,
  TraderNode,
  TraderQuestGroup,
} from "@/types";
import {
  QUEST_NODE_WIDTH,
  QUEST_NODE_HEIGHT,
} from "@/components/quest-tree/QuestNode";
import { getTraderColor } from "@/lib/trader-colors";

const LAYOUT_CONFIG = {
  rankdir: "LR" as const, // Left-to-right layout
  nodesep: 35, // Vertical spacing between nodes (tighter grouping)
  ranksep: 160, // Horizontal spacing (more room for horizontal edges)
  marginx: 50,
  marginy: 30,
};

// Lane-based layout configuration
export const LANE_CONFIG = {
  TRADER_NODE_WIDTH: 100,
  TRADER_NODE_HEIGHT: 60,
  BASE_LANE_HEIGHT: 100, // Minimum lane height
  LANE_SPACING: 30, // Gap between lanes
  TRADER_TO_QUEST_GAP: 60, // Gap after trader header
  QUEST_VERTICAL_GAP: 15, // Gap between quests in same column (branching)
};

// Fixed trader order (optimized for common cross-dependencies)
const TRADER_ORDER = [
  "prapor",
  "therapist",
  "skier",
  "peacekeeper",
  "mechanic",
  "ragman",
  "jaeger",
  "fence",
  "lightkeeper",
];

interface BuildQuestGraphOptions {
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onClick: (questId: string) => void;
  onFocus: (questId: string) => void;
  selectedQuestId?: string | null;
  focusedQuestId?: string | null;
  focusChain?: Set<string>;
}

export interface QuestGraph {
  nodes: QuestNode[];
  edges: QuestEdge[];
}

/**
 * Calculate the full dependency chain for a quest (prerequisites + dependents)
 */
export function getQuestChain(
  questId: string,
  quests: QuestWithProgress[]
): Set<string> {
  const questMap = new Map(quests.map((q) => [q.id, q]));
  const chain = new Set<string>();

  // Add the focused quest itself
  chain.add(questId);

  // Recursively get all prerequisites (quests this one depends on)
  function getPrerequisites(id: string) {
    const quest = questMap.get(id);
    if (!quest) return;

    for (const dep of quest.dependsOn || []) {
      if (!chain.has(dep.requiredQuest.id)) {
        chain.add(dep.requiredQuest.id);
        getPrerequisites(dep.requiredQuest.id);
      }
    }
  }

  // Recursively get all dependents (quests that depend on this one)
  function getDependents(id: string) {
    const quest = questMap.get(id);
    if (!quest) return;

    for (const dep of quest.dependedOnBy || []) {
      if (!chain.has(dep.dependentQuest.id)) {
        chain.add(dep.dependentQuest.id);
        getDependents(dep.dependentQuest.id);
      }
    }
  }

  getPrerequisites(questId);
  getDependents(questId);

  return chain;
}

export function buildQuestGraph(
  quests: QuestWithProgress[],
  options: BuildQuestGraphOptions
): QuestGraph {
  const {
    onStatusChange,
    onClick,
    onFocus,
    selectedQuestId,
    focusedQuestId,
    focusChain,
  } = options;
  const hasFocusMode = focusedQuestId !== null && focusedQuestId !== undefined;

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

        // Check if this edge is part of the focus chain
        const isEdgeInFocusChain =
          focusChain?.has(quest.id) && focusChain?.has(dep.requiredQuest.id);
        const shouldDimEdge = hasFocusMode && !isEdgeInFocusChain;

        edges.push({
          id: `${dep.requiredQuest.id}-${quest.id}`,
          source: dep.requiredQuest.id,
          target: quest.id,
          type: "default", // Bezier curves for smoother flow
          animated: quest.computedStatus === "available" && !shouldDimEdge,
          style: {
            stroke: shouldDimEdge
              ? "#D1D5DB" // Dim gray when not in focus chain
              : quest.computedStatus === "completed"
                ? "#10B981"
                : quest.computedStatus === "available"
                  ? "#3B82F6"
                  : quest.computedStatus === "locked"
                    ? "#6B7280"
                    : "#9CA3AF",
            strokeWidth: isEdgeInFocusChain ? 3 : quest.kappaRequired ? 3 : 2,
            opacity: shouldDimEdge
              ? 0.2
              : quest.computedStatus === "locked"
                ? 0.4
                : 1,
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

  // Find root quests (no incoming edges / no dependencies)
  const rootQuestIds = new Set(
    quests.filter((q) => !q.dependsOn?.length).map((q) => q.id)
  );

  // Find leaf quests (no outgoing edges / no dependents)
  const leafQuestIds = new Set(
    quests.filter((q) => !q.dependedOnBy?.length).map((q) => q.id)
  );

  // Find the minimum x position among root quests to align them at the left
  let minRootX = Infinity;
  for (const questId of rootQuestIds) {
    const node = g.node(questId);
    if (node && node.x < minRootX) {
      minRootX = node.x;
    }
  }

  // Calculate shift to align roots at left margin
  const shiftX = minRootX - QUEST_NODE_WIDTH / 2 - LAYOUT_CONFIG.marginx;

  // Convert to React Flow nodes with adjusted positions
  const nodes: QuestNode[] = quests.map((quest) => {
    const nodeWithPosition = g.node(quest.id);
    const isInFocusChain = focusChain?.has(quest.id) ?? false;
    return {
      id: quest.id,
      type: "quest",
      position: {
        // Dagre returns center position, adjust to top-left for React Flow
        // Also shift all nodes left so roots align at the margin
        x: nodeWithPosition.x - QUEST_NODE_WIDTH / 2 - shiftX,
        y: nodeWithPosition.y - QUEST_NODE_HEIGHT / 2,
      },
      data: {
        quest,
        isSelected: quest.id === selectedQuestId,
        isRoot: rootQuestIds.has(quest.id),
        isLeaf: leafQuestIds.has(quest.id),
        isFocused: quest.id === focusedQuestId,
        isInFocusChain,
        hasFocusMode,
        onStatusChange,
        onClick,
        onFocus,
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

// ============================================================================
// TRADER LANE LAYOUT FUNCTIONS
// ============================================================================

/**
 * Split quests by trader and categorize dependencies
 */
export function splitQuestsByTrader(
  quests: QuestWithProgress[]
): Map<string, TraderQuestGroup> {
  const groups = new Map<string, TraderQuestGroup>();

  // Group quests by trader
  for (const quest of quests) {
    const traderId = quest.traderId.toLowerCase();
    if (!groups.has(traderId)) {
      groups.set(traderId, {
        traderId,
        trader: quest.trader,
        quests: [],
        rootQuests: [],
        intraTraderDeps: [],
        crossTraderDeps: [],
      });
    }
    groups.get(traderId)!.quests.push(quest);
  }

  // Classify dependencies for each quest
  for (const quest of quests) {
    const traderId = quest.traderId.toLowerCase();
    const group = groups.get(traderId)!;
    let hasIntraTraderDep = false;

    for (const dep of quest.dependsOn || []) {
      const sourceTraderId = dep.requiredQuest.traderId.toLowerCase();

      if (sourceTraderId === traderId) {
        // Intra-trader dependency
        group.intraTraderDeps.push({
          sourceId: dep.requiredQuest.id,
          targetId: quest.id,
        });
        hasIntraTraderDep = true;
      } else {
        // Cross-trader dependency
        group.crossTraderDeps.push({
          sourceQuestId: dep.requiredQuest.id,
          sourceTraderId,
          targetQuestId: quest.id,
          targetTraderId: traderId,
        });

        // Also add to the source trader's group
        const sourceGroup = groups.get(sourceTraderId);
        if (sourceGroup) {
          sourceGroup.crossTraderDeps.push({
            sourceQuestId: dep.requiredQuest.id,
            sourceTraderId,
            targetQuestId: quest.id,
            targetTraderId: traderId,
          });
        }
      }
    }

    // If no intra-trader dependencies, it's a root quest for this trader
    if (!hasIntraTraderDep) {
      group.rootQuests.push(quest);
    }
  }

  return groups;
}

/**
 * Compute optimal trader order based on cross-dependencies
 */
export function computeTraderOrder(
  groups: Map<string, TraderQuestGroup>
): string[] {
  // Build adjacency weights (count of cross-trader dependencies)
  const weights = new Map<string, Map<string, number>>();

  for (const group of groups.values()) {
    if (!weights.has(group.traderId)) {
      weights.set(group.traderId, new Map());
    }

    for (const dep of group.crossTraderDeps) {
      // Count connections between traders
      const w = weights.get(group.traderId)!;
      const currentWeight = w.get(dep.sourceTraderId) || 0;
      w.set(dep.sourceTraderId, currentWeight + 1);
    }
  }

  // Start with fixed order, but could be optimized with barycenter heuristic
  const traderIds = Array.from(groups.keys());

  // Sort by TRADER_ORDER, unknown traders go to end
  traderIds.sort((a, b) => {
    const aIndex = TRADER_ORDER.indexOf(a);
    const bIndex = TRADER_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return traderIds;
}

interface TraderLaneLayout {
  traderId: string;
  nodes: QuestNode[];
  edges: QuestEdge[];
  laneHeight: number;
  laneWidth: number;
}

/**
 * Layout a single trader's quest lane using Dagre
 */
export function layoutTraderLane(
  group: TraderQuestGroup,
  options: BuildQuestGraphOptions
): TraderLaneLayout {
  const { onStatusChange, onClick, onFocus, selectedQuestId, focusedQuestId, focusChain } =
    options;
  const hasFocusMode = focusedQuestId !== null && focusedQuestId !== undefined;

  // Create Dagre graph for this trader only
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 25, // Tighter vertical spacing within lane
    ranksep: LAYOUT_CONFIG.ranksep,
    marginx: 10,
    marginy: 10,
  });

  // Add quest nodes
  for (const quest of group.quests) {
    g.setNode(quest.id, {
      width: QUEST_NODE_WIDTH,
      height: QUEST_NODE_HEIGHT,
    });
  }

  // Add only intra-trader edges
  const edges: QuestEdge[] = [];
  const questMap = new Map(group.quests.map((q) => [q.id, q]));

  for (const dep of group.intraTraderDeps) {
    g.setEdge(dep.sourceId, dep.targetId);

    const sourceQuest = questMap.get(dep.sourceId);
    const targetQuest = questMap.get(dep.targetId);

    if (sourceQuest && targetQuest) {
      const isEdgeInFocusChain =
        focusChain?.has(targetQuest.id) && focusChain?.has(dep.sourceId);
      const shouldDimEdge = hasFocusMode && !isEdgeInFocusChain;

      edges.push({
        id: `${dep.sourceId}-${dep.targetId}`,
        source: dep.sourceId,
        target: dep.targetId,
        type: "default",
        animated: targetQuest.computedStatus === "available" && !shouldDimEdge,
        style: {
          stroke: shouldDimEdge
            ? "#D1D5DB"
            : targetQuest.computedStatus === "completed"
              ? "#10B981"
              : targetQuest.computedStatus === "available"
                ? "#3B82F6"
                : targetQuest.computedStatus === "locked"
                  ? "#6B7280"
                  : "#9CA3AF",
          strokeWidth: isEdgeInFocusChain ? 3 : targetQuest.kappaRequired ? 3 : 2,
          opacity: shouldDimEdge
            ? 0.2
            : targetQuest.computedStatus === "locked"
              ? 0.4
              : 1,
        },
        data: {
          sourceStatus: sourceQuest.computedStatus,
          targetStatus: targetQuest.computedStatus,
        },
      });
    }
  }

  // Run Dagre layout
  dagre.layout(g);

  // Find bounds
  let maxX = 0;
  let maxY = 0;
  let minY = Infinity;

  for (const quest of group.quests) {
    const node = g.node(quest.id);
    if (node) {
      maxX = Math.max(maxX, node.x + QUEST_NODE_WIDTH / 2);
      maxY = Math.max(maxY, node.y + QUEST_NODE_HEIGHT / 2);
      minY = Math.min(minY, node.y - QUEST_NODE_HEIGHT / 2);
    }
  }

  // Calculate lane height based on actual content
  const contentHeight = group.quests.length > 0 ? maxY - minY : QUEST_NODE_HEIGHT;
  const laneHeight = Math.max(LANE_CONFIG.BASE_LANE_HEIGHT, contentHeight + 20);

  // Find root quests for visual indicator
  const rootQuestIds = new Set(group.rootQuests.map((q) => q.id));

  // Find leaf quests
  const hasOutgoingDep = new Set(group.intraTraderDeps.map((d) => d.sourceId));
  const leafQuestIds = new Set(
    group.quests.filter((q) => !hasOutgoingDep.has(q.id)).map((q) => q.id)
  );

  // Convert to nodes (positions relative to lane origin)
  const nodes: QuestNode[] = group.quests.map((quest) => {
    const nodeWithPosition = g.node(quest.id);
    const isInFocusChain = focusChain?.has(quest.id) ?? false;

    // Normalize Y position relative to lane center
    const normalizedY = nodeWithPosition.y - minY;

    return {
      id: quest.id,
      type: "quest",
      position: {
        x: nodeWithPosition.x - QUEST_NODE_WIDTH / 2,
        y: normalizedY,
      },
      data: {
        quest,
        isSelected: quest.id === selectedQuestId,
        isRoot: rootQuestIds.has(quest.id),
        isLeaf: leafQuestIds.has(quest.id),
        isFocused: quest.id === focusedQuestId,
        isInFocusChain,
        hasFocusMode,
        onStatusChange,
        onClick,
        onFocus,
      },
    };
  });

  return {
    traderId: group.traderId,
    nodes,
    edges,
    laneHeight,
    laneWidth: maxX,
  };
}

interface StackedLayout {
  nodes: Array<QuestNode | TraderNode>;
  edges: QuestEdge[];
  laneYOffsets: Map<string, { y: number; height: number }>;
}

/**
 * Stack trader lanes vertically
 */
export function stackTraderLanes(
  laneLayouts: TraderLaneLayout[],
  traderOrder: string[],
  groups: Map<string, TraderQuestGroup>
): StackedLayout {
  const allNodes: Array<QuestNode | TraderNode> = [];
  const allEdges: QuestEdge[] = [];
  const laneYOffsets = new Map<string, { y: number; height: number }>();

  let currentY = LAYOUT_CONFIG.marginy;

  for (const traderId of traderOrder) {
    const lane = laneLayouts.find((l) => l.traderId === traderId);
    const group = groups.get(traderId);

    if (!lane || !group) continue;

    // Store lane position
    laneYOffsets.set(traderId, { y: currentY, height: lane.laneHeight });

    // Create trader header node
    const traderColor = getTraderColor(traderId);
    const completedCount = group.quests.filter(
      (q) => q.computedStatus === "completed"
    ).length;

    const traderNode: TraderNode = {
      id: `trader-${traderId}`,
      type: "trader",
      position: {
        x: LAYOUT_CONFIG.marginx,
        y: currentY + lane.laneHeight / 2 - LANE_CONFIG.TRADER_NODE_HEIGHT / 2,
      },
      data: {
        traderId,
        traderName: group.trader.name,
        color: traderColor.primary,
        questCount: group.quests.length,
        completedCount,
      },
    };
    allNodes.push(traderNode);

    // Offset quest nodes for this lane
    const xOffset =
      LAYOUT_CONFIG.marginx +
      LANE_CONFIG.TRADER_NODE_WIDTH +
      LANE_CONFIG.TRADER_TO_QUEST_GAP;

    for (const node of lane.nodes) {
      allNodes.push({
        ...node,
        position: {
          x: node.position.x + xOffset,
          y: node.position.y + currentY,
        },
      });
    }

    // Add edges
    allEdges.push(...lane.edges);

    // Move to next lane
    currentY += lane.laneHeight + LANE_CONFIG.LANE_SPACING;
  }

  return { nodes: allNodes, edges: allEdges, laneYOffsets };
}

/**
 * Build cross-trader dependency edges
 */
export function buildCrossTraderEdges(
  groups: Map<string, TraderQuestGroup>,
  options: { focusChain?: Set<string>; hasFocusMode: boolean }
): Edge[] {
  const { focusChain, hasFocusMode } = options;
  const crossEdges: Edge[] = [];
  const seenEdges = new Set<string>();

  for (const group of groups.values()) {
    for (const dep of group.crossTraderDeps) {
      // Only add edge once (from source side)
      if (dep.sourceTraderId !== group.traderId) continue;

      const edgeId = `cross-${dep.sourceQuestId}-${dep.targetQuestId}`;
      if (seenEdges.has(edgeId)) continue;
      seenEdges.add(edgeId);

      const isInFocusChain =
        focusChain?.has(dep.sourceQuestId) && focusChain?.has(dep.targetQuestId);
      const shouldDim = hasFocusMode && !isInFocusChain;

      crossEdges.push({
        id: edgeId,
        source: dep.sourceQuestId,
        target: dep.targetQuestId,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: shouldDim ? "#E5E7EB" : "#9CA3AF",
          strokeWidth: 1.5,
          strokeDasharray: "6,4",
          opacity: shouldDim ? 0.2 : 0.6,
        },
        data: {
          isCrossTrader: true,
          sourceTraderId: dep.sourceTraderId,
          targetTraderId: dep.targetTraderId,
        },
      });
    }
  }

  return crossEdges;
}

export interface TraderLaneGraph {
  nodes: Array<QuestNode | TraderNode>;
  edges: Array<QuestEdge | Edge>;
  laneYOffsets: Map<string, { y: number; height: number }>;
  traderOrder: string[];
}

/**
 * Main function to build the trader lane graph
 */
export function buildTraderLaneGraph(
  quests: QuestWithProgress[],
  traders: Trader[],
  options: BuildQuestGraphOptions
): TraderLaneGraph {
  const { focusedQuestId, focusChain } = options;
  const hasFocusMode = focusedQuestId !== null && focusedQuestId !== undefined;

  // Step 1: Split quests by trader
  const groups = splitQuestsByTrader(quests);

  // Step 2: Compute trader order
  const traderOrder = computeTraderOrder(groups);

  // Step 3: Layout each trader lane
  const laneLayouts: TraderLaneLayout[] = [];
  for (const traderId of traderOrder) {
    const group = groups.get(traderId);
    if (group && group.quests.length > 0) {
      laneLayouts.push(layoutTraderLane(group, options));
    }
  }

  // Step 4: Stack lanes vertically
  const stackedLayout = stackTraderLanes(laneLayouts, traderOrder, groups);

  // Note: Cross-trader edges removed - they create confusing long paths.
  // Cross-trader dependencies are shown via badges on QuestNode instead.

  return {
    nodes: stackedLayout.nodes,
    edges: stackedLayout.edges,
    laneYOffsets: stackedLayout.laneYOffsets,
    traderOrder,
  };
}

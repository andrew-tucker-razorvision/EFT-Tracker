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
  RequirementStatusType,
} from "@/types";
import {
  QUEST_NODE_WIDTH,
  QUEST_NODE_HEIGHT,
} from "@/components/quest-tree/QuestNode";
import { getTraderColor } from "@/lib/trader-colors";

const LAYOUT_CONFIG = {
  rankdir: "LR" as const, // Left-to-right layout
  nodesep: 10, // Comfortable vertical spacing between nodes
  ranksep: 20, // Comfortable horizontal spacing between ranks
  marginx: 5, // Minimal padding from left edge
  marginy: 10, // Minimal padding from top edge
};

// Lane-based layout configuration
export const LANE_CONFIG = {
  TRADER_NODE_WIDTH: 60,
  TRADER_NODE_HEIGHT: 40,
  BASE_LANE_HEIGHT: 80, // Minimum lane height (increased for better spacing)
  LANE_SPACING: 25, // Comfortable gap between lanes (increased)
  TRADER_TO_QUEST_GAP: 20, // Comfortable gap after trader header
  QUEST_VERTICAL_GAP: 25, // Gap between quests
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

/**
 * Calculate dynamic node height based on quest title length
 * Allows quest names to span multiple lines instead of truncating
 *
 * Current node specs: 155px width, p-2 padding (8px each side), 14px title font
 */
export function calculateNodeHeight(title: string): number {
  // Base height for single-line title (matches QUEST_NODE_HEIGHT)
  const baseHeight = QUEST_NODE_HEIGHT;

  // Approximate characters per line at 14px font for 155px width node with 16px total padding
  // Content width ~139px, at ~9px per char average = ~15 chars per line
  const charsPerLine = 15;
  const estimatedLines = Math.ceil(title.length / charsPerLine);

  // Cap at 2 lines maximum (matches line-clamp-2 in QuestNode)
  const lines = Math.min(estimatedLines, 2);

  // 18px per additional line (14px font + line spacing)
  return baseHeight + (lines - 1) * 18;
}

interface BuildQuestGraphOptions {
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onClick: (questId: string) => void;
  onFocus: (questId: string) => void;
  selectedQuestId?: string | null;
  focusedQuestId?: string | null;
  focusChain?: Set<string>;
  playerLevel?: number | null;
  maxColumns?: number | null; // Limit number of columns (depth) shown per trader - null = show all
  savingQuestIds?: Set<string>; // Set of quest IDs currently being saved
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

/**
 * Get all incomplete prerequisites for a quest (recursively).
 * Returns quests that need to be completed before this quest can be started.
 * Does NOT include the target quest itself.
 */
export function getIncompletePrerequisites(
  questId: string,
  quests: QuestWithProgress[]
): QuestWithProgress[] {
  const questMap = new Map(quests.map((q) => [q.id, q]));
  const prerequisites: QuestWithProgress[] = [];
  const seen = new Set<string>();

  function collectPrereqs(id: string) {
    const quest = questMap.get(id);
    if (!quest) return;

    for (const dep of quest.dependsOn || []) {
      const prereqId = dep.requiredQuest.id;
      if (seen.has(prereqId)) continue;
      seen.add(prereqId);

      const prereqQuest = questMap.get(prereqId);
      if (prereqQuest && prereqQuest.computedStatus !== "completed") {
        prerequisites.push(prereqQuest);
      }
      // Recursively get prerequisites of prerequisites
      collectPrereqs(prereqId);
    }
  }

  collectPrereqs(questId);

  // Sort by trader then by title for consistent display
  return prerequisites.sort((a, b) => {
    if (a.trader.name !== b.trader.name) {
      return a.trader.name.localeCompare(b.trader.name);
    }
    return a.title.localeCompare(b.title);
  });
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
    playerLevel,
    savingQuestIds,
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

        // Get requirement status (default to ["complete"] for backwards compatibility)
        const requirementStatus = (dep.requirementStatus || [
          "complete",
        ]) as RequirementStatusType[];
        const isActiveOnly =
          requirementStatus.includes("active") &&
          !requirementStatus.includes("complete");

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
            strokeDasharray: isActiveOnly ? "5,5" : undefined, // Dashed line for "active only" requirements
            opacity: shouldDimEdge
              ? 0.2
              : quest.computedStatus === "locked"
                ? 0.4
                : 1,
          },
          data: {
            sourceStatus: requiredQuest.computedStatus,
            targetStatus: quest.computedStatus,
            requirementStatus,
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
        playerLevel: playerLevel ?? null,
        isSaving: savingQuestIds?.has(quest.id) ?? false,
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

/**
 * Calculate depth (column) for each quest within a trader's tree.
 * Depth 0 = root quests (no same-trader prerequisites)
 * Depth N = max depth of same-trader prerequisites + 1
 */
export function calculateTraderLocalDepths(
  quests: QuestWithProgress[],
  traderId: string
): Map<string, number> {
  const depths = new Map<string, number>();
  const traderQuests = quests.filter(
    (q) => q.traderId.toLowerCase() === traderId.toLowerCase()
  );
  const questMap = new Map(traderQuests.map((q) => [q.id, q]));

  function getDepth(questId: string, visited: Set<string>): number {
    if (visited.has(questId)) return 0;
    visited.add(questId);

    if (depths.has(questId)) return depths.get(questId)!;

    const quest = questMap.get(questId);
    if (!quest) return 0;

    // Find same-trader prerequisites
    const sameTraderPrereqs = (quest.dependsOn || []).filter((dep) => {
      const prereq = questMap.get(dep.requiredQuest.id);
      return prereq !== undefined;
    });

    if (sameTraderPrereqs.length === 0) {
      depths.set(questId, 0);
      return 0;
    }

    let maxPrereqDepth = 0;
    for (const dep of sameTraderPrereqs) {
      const prereqDepth = getDepth(dep.requiredQuest.id, new Set(visited));
      maxPrereqDepth = Math.max(maxPrereqDepth, prereqDepth);
    }

    const depth = maxPrereqDepth + 1;
    depths.set(questId, depth);
    return depth;
  }

  for (const quest of traderQuests) {
    getDepth(quest.id, new Set());
  }

  return depths;
}

/**
 * Filter quests to only include those within the first N columns (depths).
 * maxColumns: number of columns to show (1 = only root quests, 2 = roots + their direct dependents, etc.)
 * globalDepths: Optional pre-computed global depths that consider cross-trader dependencies.
 *               If provided, uses global depths for filtering (recommended for accurate cross-trader handling).
 *               If not provided, falls back to local depths (same-trader only).
 */
export function filterQuestsByColumns(
  quests: QuestWithProgress[],
  traderId: string,
  maxColumns: number | null,
  globalDepths?: Map<string, number>
): QuestWithProgress[] {
  if (maxColumns === null) return quests;

  const traderQuests = quests.filter(
    (q) => q.traderId.toLowerCase() === traderId.toLowerCase()
  );

  // Use global depths if provided, otherwise fall back to local depths
  const depths = globalDepths ?? calculateTraderLocalDepths(quests, traderId);

  // Include quests with depth < maxColumns (0-indexed, so depth 0-4 for maxColumns=5)
  return traderQuests.filter((q) => {
    const depth = depths.get(q.id) ?? 0;
    return depth < maxColumns;
  });
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
 * Calculate the global depth for each quest considering ALL dependencies
 * (both intra-trader and cross-trader). This ensures quests are positioned
 * in the correct column based on when they can actually be started.
 */
export function calculateGlobalDepths(
  quests: QuestWithProgress[]
): Map<string, number> {
  const depths = new Map<string, number>();
  const questMap = new Map(quests.map((q) => [q.id, q]));

  // Recursive function to calculate depth with memoization
  function getDepth(questId: string, visited: Set<string>): number {
    // Prevent infinite loops
    if (visited.has(questId)) return 0;
    visited.add(questId);

    // Return cached result if available
    if (depths.has(questId)) {
      return depths.get(questId)!;
    }

    const quest = questMap.get(questId);
    if (!quest) return 0;

    // No dependencies = depth 0 (root quest)
    if (!quest.dependsOn || quest.dependsOn.length === 0) {
      depths.set(questId, 0);
      return 0;
    }

    // Depth = max depth of all dependencies + 1
    let maxDepPrereqDepth = 0;
    for (const dep of quest.dependsOn) {
      const prereqDepth = getDepth(dep.requiredQuest.id, new Set(visited));
      maxDepPrereqDepth = Math.max(maxDepPrereqDepth, prereqDepth);
    }

    const depth = maxDepPrereqDepth + 1;
    depths.set(questId, depth);
    return depth;
  }

  // Calculate depth for all quests
  for (const quest of quests) {
    getDepth(quest.id, new Set());
  }

  return depths;
}

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
 * Uses global depths to position quests correctly based on cross-trader dependencies
 */
export function layoutTraderLane(
  group: TraderQuestGroup,
  options: BuildQuestGraphOptions,
  globalDepths: Map<string, number>
): TraderLaneLayout {
  const {
    onStatusChange,
    onClick,
    onFocus,
    selectedQuestId,
    focusedQuestId,
    focusChain,
    playerLevel,
    savingQuestIds,
  } = options;
  const hasFocusMode = focusedQuestId !== null && focusedQuestId !== undefined;

  // Create Dagre graph for this trader only
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: LANE_CONFIG.QUEST_VERTICAL_GAP, // Vertical spacing between nodes
    ranksep: LAYOUT_CONFIG.ranksep,
    marginx: 0,
    marginy: 0,
  });

  // Find minimum depth in this trader's quests (to normalize positions)
  let minDepthInLane = Infinity;
  for (const quest of group.quests) {
    const depth = globalDepths.get(quest.id) ?? 0;
    minDepthInLane = Math.min(minDepthInLane, depth);
  }
  if (minDepthInLane === Infinity) minDepthInLane = 0;

  // Add quest nodes with dynamic heights
  for (const quest of group.quests) {
    const nodeHeight = calculateNodeHeight(quest.title);
    g.setNode(quest.id, {
      width: QUEST_NODE_WIDTH,
      height: nodeHeight,
    });
  }

  // For quests with cross-trader deps, we need to add invisible spacer nodes
  // to push them to the correct column based on their global depth.
  // This handles both: quests with ONLY cross-trader deps, AND quests with
  // both intra-trader AND cross-trader deps (Dagre uses max constraint).
  const questsWithCrossTraderDeps = group.quests.filter((quest) => {
    return group.crossTraderDeps.some((d) => d.targetQuestId === quest.id);
  });

  // Create a chain of spacer nodes for each depth level needed
  const spacersByDepth = new Map<number, string>();
  let maxSpacerDepth = 0;

  for (const quest of questsWithCrossTraderDeps) {
    const globalDepth = globalDepths.get(quest.id) ?? 0;
    // Normalize to lane-relative depth
    const localDepth = globalDepth - minDepthInLane;
    if (localDepth > 0) {
      maxSpacerDepth = Math.max(maxSpacerDepth, localDepth);
    }
  }

  // Create spacer chain: spacer-0 -> spacer-1 -> spacer-2 -> ...
  // The spacer chain is anchored to root quests so Dagre aligns them properly
  if (maxSpacerDepth > 0) {
    for (let i = 0; i <= maxSpacerDepth; i++) {
      const spacerId = `__spacer_${group.traderId}_${i}`;
      spacersByDepth.set(i, spacerId);
      g.setNode(spacerId, {
        width: 1, // Invisible, minimal width
        height: 1,
      });
      if (i > 0) {
        const prevSpacerId = spacersByDepth.get(i - 1)!;
        g.setEdge(prevSpacerId, spacerId);
      }
    }

    // Anchor spacer_0 to root quests so the spacer chain aligns with the quest tree
    const spacer0 = spacersByDepth.get(0);
    if (spacer0) {
      for (const rootQuest of group.rootQuests) {
        // Only connect if this root quest doesn't have cross-trader deps
        // (otherwise it will be connected to a deeper spacer)
        const hasCrossTraderDep = questsWithCrossTraderDeps.some(
          (q) => q.id === rootQuest.id
        );
        if (!hasCrossTraderDep) {
          g.setEdge(spacer0, rootQuest.id);
        }
      }
    }
  }

  // Connect quests with cross-trader deps to the appropriate spacer
  // Dagre will use the maximum of all incoming edge constraints
  for (const quest of questsWithCrossTraderDeps) {
    const globalDepth = globalDepths.get(quest.id) ?? 0;
    const localDepth = globalDepth - minDepthInLane;
    if (localDepth > 0) {
      // Connect from the spacer at depth-1 to this quest
      const spacerId = spacersByDepth.get(localDepth - 1);
      if (spacerId) {
        g.setEdge(spacerId, quest.id);
      }
    }
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

      // Find the dependency to get requirementStatus
      const dependency = targetQuest.dependsOn?.find(
        (d) => d.requiredQuest.id === dep.sourceId
      );
      const requirementStatus = (dependency?.requirementStatus || [
        "complete",
      ]) as RequirementStatusType[];
      const isActiveOnly =
        requirementStatus.includes("active") &&
        !requirementStatus.includes("complete");

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
          strokeWidth: isEdgeInFocusChain
            ? 3
            : targetQuest.kappaRequired
              ? 3
              : 2,
          strokeDasharray: isActiveOnly ? "5,5" : undefined, // Dashed line for "active only" requirements
          opacity: shouldDimEdge
            ? 0.2
            : targetQuest.computedStatus === "locked"
              ? 0.4
              : 1,
        },
        data: {
          sourceStatus: sourceQuest.computedStatus,
          targetStatus: targetQuest.computedStatus,
          requirementStatus,
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
  const contentHeight =
    group.quests.length > 0 ? maxY - minY : QUEST_NODE_HEIGHT;
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

    // Calculate dynamic height for this quest
    const nodeHeight = calculateNodeHeight(quest.title);

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
        nodeHeight, // Pass dynamic height to component
        isSelected: quest.id === selectedQuestId,
        isRoot: rootQuestIds.has(quest.id),
        isLeaf: leafQuestIds.has(quest.id),
        isFocused: quest.id === focusedQuestId,
        isInFocusChain,
        hasFocusMode,
        playerLevel: playerLevel ?? null,
        isSaving: savingQuestIds?.has(quest.id) ?? false,
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

    // Create trader node on the left, spanning full lane height
    const traderNode: TraderNode = {
      id: `trader-${traderId}`,
      type: "trader",
      position: {
        x: 0, // Will be at left edge after normalization
        y: currentY,
      },
      data: {
        traderId,
        traderName: group.trader.name,
        color: traderColor.primary,
        questCount: group.quests.length,
        completedCount,
        laneHeight: lane.laneHeight, // Pass lane height for full-height rendering
      },
    };
    allNodes.push(traderNode);

    // Offset quest nodes to the right of trader
    const xOffset =
      LANE_CONFIG.TRADER_NODE_WIDTH + LANE_CONFIG.TRADER_TO_QUEST_GAP;

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

  // Normalize positions so content starts near (0, 0) with padding
  // Include ALL nodes (traders + quests) in minX calculation so traders don't end up negative
  if (allNodes.length > 0) {
    const minX = Math.min(...allNodes.map((n) => n.position.x));
    const minY = Math.min(...allNodes.map((n) => n.position.y));

    // Normalize all nodes
    const normalizedNodes = allNodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x - minX + LAYOUT_CONFIG.marginx,
        y: node.position.y - minY + LAYOUT_CONFIG.marginy,
      },
    }));

    return { nodes: normalizedNodes, edges: allEdges, laneYOffsets };
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
        focusChain?.has(dep.sourceQuestId) &&
        focusChain?.has(dep.targetQuestId);
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
 * @param quests - Filtered quests to display
 * @param allQuests - All quests (unfiltered) for accurate global depth calculation
 * @param traders - Trader data
 * @param options - Build options
 */
export function buildTraderLaneGraph(
  quests: QuestWithProgress[],
  allQuests: QuestWithProgress[],
  traders: Trader[],
  options: BuildQuestGraphOptions
): TraderLaneGraph {
  const { maxColumns } = options;

  // Step 1: Calculate global depths using ALL quests (not just filtered)
  // This ensures cross-trader dependencies are correctly positioned even when filtered
  const globalDepths = calculateGlobalDepths(allQuests);

  // Step 2: Split quests by trader
  const groups = splitQuestsByTrader(quests);

  // Step 2.5: Apply column-based filtering if maxColumns is set
  // Use global depths so cross-trader dependencies are correctly accounted for
  if (maxColumns !== null && maxColumns !== undefined) {
    for (const [traderId, group] of groups) {
      const filteredQuests = filterQuestsByColumns(
        quests,
        traderId,
        maxColumns,
        globalDepths // Pass global depths to properly filter cross-trader quests
      );

      // Update group with filtered quests
      group.quests = filteredQuests;

      // Recalculate root quests and dependencies for filtered set
      const filteredIds = new Set(filteredQuests.map((q) => q.id));

      // Filter intra-trader deps to only include edges where both quests are visible
      group.intraTraderDeps = group.intraTraderDeps.filter(
        (dep) => filteredIds.has(dep.sourceId) && filteredIds.has(dep.targetId)
      );

      // Recalculate root quests (no intra-trader deps pointing to them)
      const hasIncomingDep = new Set(
        group.intraTraderDeps.map((d) => d.targetId)
      );
      group.rootQuests = filteredQuests.filter(
        (q) => !hasIncomingDep.has(q.id)
      );

      // Filter cross-trader deps to only include visible quests
      group.crossTraderDeps = group.crossTraderDeps.filter(
        (dep) =>
          filteredIds.has(dep.sourceQuestId) ||
          filteredIds.has(dep.targetQuestId)
      );
    }
  }

  // Step 3: Compute trader order
  const traderOrder = computeTraderOrder(groups);

  // Step 4: Layout each trader lane (with global depths for cross-trader positioning)
  const laneLayouts: TraderLaneLayout[] = [];
  for (const traderId of traderOrder) {
    const group = groups.get(traderId);
    if (group && group.quests.length > 0) {
      laneLayouts.push(layoutTraderLane(group, options, globalDepths));
    }
  }

  // Step 5: Stack lanes vertically
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

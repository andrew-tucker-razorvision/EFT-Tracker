import type { Node, Edge } from "@xyflow/react";

// Quest status enum
export type QuestStatus = "locked" | "available" | "in_progress" | "completed";

// Trader from database
export interface Trader {
  id: string;
  name: string;
  color: string;
}

// Objective from database
export interface Objective {
  id: string;
  description: string;
  map: string | null;
  questId: string;
}

// Requirement status types from tarkov.dev API
export type RequirementStatusType =
  | "complete" // Must complete the quest
  | "active" // Must have quest active (in progress)
  | "failed"; // Must have failed the quest

// Quest dependency shape from API
export interface QuestDependency {
  requiredQuest: Quest;
  requirementStatus: RequirementStatusType[]; // e.g., ["complete"], ["active", "complete"]
}

export interface QuestDependent {
  dependentQuest: Quest;
  requirementStatus: RequirementStatusType[];
}

// Quest from database
export interface Quest {
  id: string;
  title: string;
  wikiLink: string | null;
  levelRequired: number;
  kappaRequired: boolean;
  traderId: string;
  trader: Trader;
  objectives: Objective[];
  dependsOn: QuestDependency[];
  dependedOnBy: QuestDependent[];
}

// Quest progress from database
export interface QuestProgress {
  id: string;
  status: QuestStatus;
  completedAt: Date | null;
  userId: string;
  questId: string;
}

// Quest with progress for frontend
export interface QuestWithProgress extends Quest {
  progress: QuestProgress | null;
  computedStatus: QuestStatus;
}

// Level range filter options
export interface LevelRange {
  min: number;
  max: number;
  label: string;
}

// Filter options for quest list/tree
export interface QuestFilters {
  traderId: string | null;
  status: QuestStatus | null;
  search: string;
  kappaOnly: boolean;
  map: string | null;
  playerLevel: number | null;
  levelRange: LevelRange | null;
  questsPerTree: number | null; // null = show all
  bypassLevelRequirement: boolean; // Show all quests regardless of level
}

// View mode for quest display
export type ViewMode = "trader-lanes" | "level-timeline";

// React Flow node data for quest nodes
export interface QuestNodeData extends Record<string, unknown> {
  quest: QuestWithProgress;
  nodeHeight?: number; // Dynamic node height based on title length
  isSelected: boolean;
  isRoot: boolean; // No prerequisites - starting quest
  isLeaf: boolean; // No dependents - terminal quest
  isFocused: boolean; // Currently focused quest
  isInFocusChain: boolean; // Part of focused quest's dependency chain
  hasFocusMode: boolean; // Whether any quest is focused (for dimming)
  playerLevel: number | null; // User's current PMC level for highlighting
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onClick: (questId: string) => void;
  onFocus: (questId: string) => void; // Focus on this quest's chain
}

// React Flow quest node type
export type QuestNode = Node<QuestNodeData, "quest">;

// React Flow edge data for dependency edges
export interface QuestEdgeData extends Record<string, unknown> {
  sourceStatus: QuestStatus;
  targetStatus: QuestStatus;
  requirementStatus: RequirementStatusType[]; // What status is required for the dependency
}

// React Flow quest edge type
export type QuestEdge = Edge<QuestEdgeData>;

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface QuestsResponse {
  quests: QuestWithProgress[];
  traders: Trader[];
}

export interface ProgressUpdateRequest {
  questId: string;
  status: QuestStatus;
}

export interface ProgressUpdateResponse {
  progress: QuestProgress;
  unlockedQuests?: string[];
}

// Trader lane layout types
export interface TraderNodeData extends Record<string, unknown> {
  traderId: string;
  traderName: string;
  color: string;
  questCount: number;
  completedCount: number;
  laneHeight?: number; // Height of the trader's lane for full-height rendering
}

export type TraderNode = Node<TraderNodeData, "trader">;

// Cross-trader dependency edge data
export interface CrossTraderEdgeData extends QuestEdgeData {
  isCrossTrader: true;
  sourceTraderId: string;
  targetTraderId: string;
}

// Trader quest group for layout
export interface TraderQuestGroup {
  traderId: string;
  trader: Trader;
  quests: QuestWithProgress[];
  rootQuests: QuestWithProgress[];
  intraTraderDeps: Array<{ sourceId: string; targetId: string }>;
  crossTraderDeps: Array<{
    sourceQuestId: string;
    sourceTraderId: string;
    targetQuestId: string;
    targetTraderId: string;
  }>;
}

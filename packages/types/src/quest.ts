/**
 * Quest Domain Types
 * Shared types for quest data structures used across web and companion apps
 */

import type { Node, Edge } from "@xyflow/react";

// Quest status enum
export type QuestStatus = "locked" | "available" | "in_progress" | "completed";

// Quest type enum for categorization
export type QuestType =
  | "standard" // Regular trader quests
  | "pvp_zone" // PVP Zone quests (Arena)
  | "reputation" // Fence reputation repair quests
  | "lightkeeper" // Lightkeeper questline
  | "faction_bear" // BEAR-only quests
  | "faction_usec" // USEC-only quests
  | "story" // Main story quests (1.0)
  | "prestige"; // Prestige quests (New Beginning) - require The Collector

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
  questType: QuestType;
  factionName: string | null;
  location: string | null; // null = "any map", otherwise specific map name
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
  statuses: QuestStatus[]; // Empty array = all statuses (multi-select)
  search: string;
  kappaOnly: boolean;
  map: string | null;
  playerLevel: number | null; // For display only, no filtering
}

// View mode for quest display
export type ViewMode =
  | "trader-lanes"
  | "level-timeline"
  | "map-groups"
  | "raid-planner";

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
  isSaving: boolean; // Whether quest is currently being saved
  isKeyboardSelected?: boolean; // Currently selected via keyboard navigation
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onClick: (questId: string) => void;
  onFocus: (questId: string) => void; // Focus on this quest's chain
  onDetails?: (questId: string) => void; // Open quest details modal
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

// Catch-up feature types
export interface CatchUpSelection {
  questId: string;
  questTitle: string;
  traderId: string;
  traderName: string;
  traderColor: string;
  levelRequired: number;
  chainLength: number;
}

export interface CatchUpCalculation {
  prerequisites: CatchUpSelection[];
  completedBranches: CatchUpSelection[];
}

export interface CatchUpRequest {
  targetQuests: string[];
  playerLevel: number;
  confirmedBranches: string[];
}

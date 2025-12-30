/**
 * Quest Tree Test Helpers
 * Shared utilities for E2E and integration tests
 * Issue #132: https://github.com/tuckerandrew21/EFT-Tracker/issues/132
 */

import type {
  QuestFilters,
  QuestWithProgress,
  QuestStatus,
  Quest,
} from "@/types";
import { mockTraders } from "./traders";

// ============================================================================
// SESSION MOCKS
// ============================================================================

/**
 * Mock authenticated session for next-auth
 */
export const authenticatedSession = {
  data: {
    user: {
      id: "test_user_id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  status: "authenticated" as const,
};

/**
 * Mock unauthenticated session for next-auth
 */
export const unauthenticatedSession = {
  data: null,
  status: "unauthenticated" as const,
};

/**
 * Mock loading session for next-auth
 */
export const loadingSession = {
  data: null,
  status: "loading" as const,
};

// ============================================================================
// DEFAULT FILTER STATE
// ============================================================================

/**
 * Default filter state matching useQuests defaults
 */
export const defaultTestFilters: QuestFilters = {
  traderId: null,
  statuses: ["available", "locked"], // Default to showing available and locked quests
  search: "",
  kappaOnly: false,
  map: null,
  playerLevel: 1,
};

// ============================================================================
// QUEST CREATION HELPERS
// ============================================================================

/**
 * Helper to create a minimal quest object
 */
function createQuest(
  id: string,
  title: string,
  traderId: string,
  levelRequired: number,
  options: Partial<Quest> = {}
): Quest {
  const trader = mockTraders.find((t) => t.id === traderId) || mockTraders[0];
  return {
    id,
    title,
    wikiLink: `https://escapefromtarkov.fandom.com/wiki/${title.replace(/ /g, "_")}`,
    levelRequired,
    kappaRequired: true,
    questType: "standard",
    factionName: null,
    traderId,
    trader,
    objectives: [],
    dependsOn: [],
    dependedOnBy: [],
    ...options,
  };
}

/**
 * Helper to convert Quest to QuestWithProgress
 */
function toQuestWithProgress(
  quest: Quest,
  status: QuestStatus
): QuestWithProgress {
  return {
    ...quest,
    progress:
      status === "locked"
        ? null
        : {
            id: `progress_${quest.id}`,
            status,
            completedAt: status === "completed" ? new Date() : null,
            userId: "test_user_id",
            questId: quest.id,
          },
    computedStatus: status,
  };
}

// ============================================================================
// MIXED STATUS QUESTS
// ============================================================================

/**
 * Creates a set of quests with all statuses represented
 * Useful for testing status-based styling and filtering
 */
export function createMixedStatusQuests(): QuestWithProgress[] {
  const quests: Quest[] = [
    createQuest("quest_locked_1", "Locked Quest", "trader_prapor", 15),
    createQuest("quest_available_1", "Available Quest", "trader_prapor", 1),
    createQuest(
      "quest_available_3",
      "Third Available Quest",
      "trader_therapist",
      3
    ),
    createQuest("quest_completed_1", "Completed Quest", "trader_skier", 1),
    createQuest(
      "quest_available_2",
      "Another Available",
      "trader_peacekeeper",
      5
    ),
    createQuest("quest_completed_2", "Another Completed", "trader_mechanic", 2),
  ];

  return [
    toQuestWithProgress(quests[0], "locked"),
    toQuestWithProgress(quests[1], "available"),
    toQuestWithProgress(quests[2], "available"),
    toQuestWithProgress(quests[3], "completed"),
    toQuestWithProgress(quests[4], "available"),
    toQuestWithProgress(quests[5], "completed"),
  ];
}

/**
 * Mixed status quest IDs for easy test reference
 */
export const MIXED_STATUS_IDS = {
  LOCKED: "quest_locked_1",
  AVAILABLE: "quest_available_1",
  AVAILABLE_3: "quest_available_3",
  COMPLETED: "quest_completed_1",
  AVAILABLE_2: "quest_available_2",
  COMPLETED_2: "quest_completed_2",
} as const;

// ============================================================================
// QUEST CHAIN FOR FOCUS MODE
// ============================================================================

/**
 * Creates a linear chain of quests for testing focus mode
 * Chain: Root -> Quest2 -> Quest3 -> Leaf
 */
export function createQuestChain(): QuestWithProgress[] {
  // Create base quests
  const root = createQuest("chain_root", "Chain Root", "trader_prapor", 1);
  const quest2 = createQuest(
    "chain_quest_2",
    "Chain Quest 2",
    "trader_prapor",
    3
  );
  const quest3 = createQuest(
    "chain_quest_3",
    "Chain Quest 3",
    "trader_prapor",
    5
  );
  const leaf = createQuest("chain_leaf", "Chain Leaf", "trader_prapor", 7);

  // Set up dependency chain (without circular refs)
  const rootRef = { ...root, dependsOn: [], dependedOnBy: [] };
  const quest2Ref = { ...quest2, dependsOn: [], dependedOnBy: [] };
  const quest3Ref = { ...quest3, dependsOn: [], dependedOnBy: [] };
  const leafRef = { ...leaf, dependsOn: [], dependedOnBy: [] };

  // Root -> Quest2
  quest2.dependsOn = [
    { requiredQuest: rootRef, requirementStatus: ["complete"] },
  ];
  root.dependedOnBy = [
    { dependentQuest: quest2Ref, requirementStatus: ["complete"] },
  ];

  // Quest2 -> Quest3
  quest3.dependsOn = [
    { requiredQuest: quest2Ref, requirementStatus: ["complete"] },
  ];
  quest2.dependedOnBy = [
    { dependentQuest: quest3Ref, requirementStatus: ["complete"] },
  ];

  // Quest3 -> Leaf
  leaf.dependsOn = [
    { requiredQuest: quest3Ref, requirementStatus: ["complete"] },
  ];
  quest3.dependedOnBy = [
    { dependentQuest: leafRef, requirementStatus: ["complete"] },
  ];

  return [
    toQuestWithProgress(root, "completed"),
    toQuestWithProgress(quest2, "completed"),
    toQuestWithProgress(quest3, "available"),
    toQuestWithProgress(leaf, "locked"),
  ];
}

/**
 * Chain quest IDs for easy test reference
 */
export const CHAIN_IDS = {
  ROOT: "chain_root",
  QUEST_2: "chain_quest_2",
  QUEST_3: "chain_quest_3",
  LEAF: "chain_leaf",
} as const;

// ============================================================================
// CROSS-TRADER DEPENDENCY QUESTS
// ============================================================================

/**
 * Creates quests with cross-trader dependencies for testing
 * Prapor Quest -> Therapist Quest (cross-trader dependency)
 */
export function createCrossTraderQuests(): QuestWithProgress[] {
  const praporQuest = createQuest(
    "cross_prapor",
    "Prapor Quest",
    "trader_prapor",
    1
  );
  const therapistQuest = createQuest(
    "cross_therapist",
    "Therapist Quest",
    "trader_therapist",
    3
  );

  // Therapist quest depends on Prapor quest
  const praporRef = { ...praporQuest, dependsOn: [], dependedOnBy: [] };
  therapistQuest.dependsOn = [
    { requiredQuest: praporRef, requirementStatus: ["complete"] },
  ];

  const therapistRef = { ...therapistQuest, dependsOn: [], dependedOnBy: [] };
  praporQuest.dependedOnBy = [
    { dependentQuest: therapistRef, requirementStatus: ["complete"] },
  ];

  return [
    toQuestWithProgress(praporQuest, "completed"),
    toQuestWithProgress(therapistQuest, "available"),
  ];
}

// ============================================================================
// LARGE QUEST SET FOR PERFORMANCE TESTING
// ============================================================================

/**
 * Creates a large set of quests for performance testing
 * @param count Number of quests to create
 * @param tradersToUse Array of trader IDs to distribute quests across
 */
export function createLargeQuestSet(
  count: number = 50,
  tradersToUse: string[] = mockTraders.map((t) => t.id)
): QuestWithProgress[] {
  const quests: QuestWithProgress[] = [];
  const statuses: QuestStatus[] = ["locked", "available", "completed"];

  for (let i = 0; i < count; i++) {
    const traderId = tradersToUse[i % tradersToUse.length];
    const status = statuses[i % statuses.length];
    const level = Math.floor(i / 4) + 1; // Spread across levels 1-13

    const quest = createQuest(
      `perf_quest_${i}`,
      `Performance Quest ${i}`,
      traderId,
      level
    );
    quests.push(toQuestWithProgress(quest, status));
  }

  return quests;
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

/**
 * Creates a mock API response for /api/quests
 */
export function createQuestsApiResponse(quests: QuestWithProgress[]) {
  return {
    quests,
    traders: mockTraders,
  };
}

/**
 * Creates a mock API response for /api/progress POST
 */
export function createProgressApiResponse(
  questId: string,
  status: QuestStatus,
  unlockedQuests: string[] = []
) {
  return {
    progress: {
      id: `progress_${questId}`,
      status,
      completedAt: status === "completed" ? new Date().toISOString() : null,
      userId: "test_user_id",
      questId,
    },
    unlockedQuests,
  };
}

// ============================================================================
// E2E HELPER FUNCTIONS
// ============================================================================

/**
 * Get zoom level from React Flow transform attribute
 * For use in Playwright E2E tests
 */
export function parseZoomFromTransform(transform: string | null): number {
  if (!transform) return 1;
  const match = transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : 1;
}

/**
 * CSS selectors for common quest tree elements
 */
export const SELECTORS = {
  // React Flow elements
  VIEWPORT: ".react-flow__viewport",
  NODES: ".react-flow__nodes",
  EDGES: ".react-flow__edges",
  CONTROLS: ".react-flow__controls",
  MINIMAP: ".react-flow__minimap",

  // Controls
  ZOOM_IN: ".react-flow__controls-zoomin",
  ZOOM_OUT: ".react-flow__controls-zoomout",
  FIT_VIEW: ".react-flow__controls-fitview",

  // Quest nodes (use data-testid in components for more reliable selection)
  QUEST_NODE: "[data-testid^='quest-node-']",

  // Toast notifications (sonner)
  TOAST: "[data-sonner-toast]",
  TOAST_SUCCESS: "[data-sonner-toast][data-type='success']",
  TOAST_ERROR: "[data-sonner-toast][data-type='error']",

  // Filter elements
  FILTER_BAR: "[data-testid='quest-filters']",
  SEARCH_INPUT: "[data-testid='search-input']",
  APPLY_BUTTON: "[data-testid='apply-filters']",

  // Focus mode
  FOCUS_INDICATOR: "[data-testid='focus-mode-indicator']",

  // Skeleton loader
  SKELETON: "[data-testid='quest-tree-skeleton']",
} as const;

/**
 * Wait times for various operations (in ms)
 */
export const WAIT_TIMES = {
  DEBOUNCE: 350, // Filter debounce (300ms) + buffer
  SEARCH_DEBOUNCE: 550, // Search debounce (500ms) + buffer
  ANIMATION: 350, // CSS animation duration + buffer
  API_RESPONSE: 100, // Mock API delay
  VIEWPORT_UPDATE: 100, // React Flow viewport update
} as const;

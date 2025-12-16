import type { Quest, QuestWithProgress, QuestStatus, Objective } from "@/types";
import { mockTraders } from "./traders";

// Helper to create a flat quest reference (without circular dependencies)
// This matches how the API returns nested quest data
function createFlatQuestRef(quest: Quest): Quest {
  return {
    ...quest,
    dependsOn: [], // Don't include nested dependencies to avoid circular refs
    dependedOnBy: [],
  };
}

// Helper to create objectives
function createObjective(
  id: string,
  description: string,
  map: string | null,
  questId: string
): Objective {
  return { id, description, map, questId };
}

// Base quests without progress
export const mockQuests: Quest[] = [
  {
    id: "quest_debut",
    title: "Debut",
    wikiLink: "https://escapefromtarkov.fandom.com/wiki/Debut",
    levelRequired: 1,
    kappaRequired: true,
    questType: "standard",
    factionName: null,
    traderId: "trader_prapor",
    trader: mockTraders[0],
    objectives: [
      createObjective("obj_1", "Kill 5 Scavs", "Customs", "quest_debut"),
    ],
    dependsOn: [],
    dependedOnBy: [],
  },
  {
    id: "quest_checking",
    title: "Checking",
    wikiLink: "https://escapefromtarkov.fandom.com/wiki/Checking",
    levelRequired: 2,
    kappaRequired: true,
    questType: "standard",
    factionName: null,
    traderId: "trader_prapor",
    trader: mockTraders[0],
    objectives: [
      createObjective(
        "obj_2",
        "Find the bronze pocket watch",
        "Customs",
        "quest_checking"
      ),
    ],
    dependsOn: [
      { requiredQuest: {} as Quest, requirementStatus: ["complete"] },
    ], // Will be filled in later
    dependedOnBy: [],
  },
  {
    id: "quest_shortage",
    title: "Shortage",
    wikiLink: "https://escapefromtarkov.fandom.com/wiki/Shortage",
    levelRequired: 5,
    kappaRequired: true,
    questType: "standard",
    factionName: null,
    traderId: "trader_therapist",
    trader: mockTraders[1],
    objectives: [
      createObjective(
        "obj_3",
        "Find Salewa first aid kits",
        null,
        "quest_shortage"
      ),
    ],
    dependsOn: [],
    dependedOnBy: [],
  },
  {
    id: "quest_delivery",
    title: "Delivery from the Past",
    wikiLink: "https://escapefromtarkov.fandom.com/wiki/Delivery_from_the_Past",
    levelRequired: 7,
    kappaRequired: true,
    questType: "standard",
    factionName: null,
    traderId: "trader_prapor",
    trader: mockTraders[0],
    objectives: [
      createObjective(
        "obj_4",
        "Pick up package in Customs",
        "Customs",
        "quest_delivery"
      ),
      createObjective(
        "obj_5",
        "Place package in Factory",
        "Factory",
        "quest_delivery"
      ),
    ],
    dependsOn: [],
    dependedOnBy: [],
  },
  {
    id: "quest_bp_depot",
    title: "BP Depot",
    wikiLink: "https://escapefromtarkov.fandom.com/wiki/BP_Depot",
    levelRequired: 10,
    kappaRequired: false, // Not required for Kappa
    questType: "standard",
    factionName: null,
    traderId: "trader_prapor",
    trader: mockTraders[0],
    objectives: [
      createObjective(
        "obj_6",
        "Destroy fuel tanks",
        "Customs",
        "quest_bp_depot"
      ),
    ],
    dependsOn: [],
    dependedOnBy: [],
  },
];

// Fix dependencies after creation (use flat refs to avoid circular JSON)
mockQuests[1].dependsOn = [
  {
    requiredQuest: createFlatQuestRef(mockQuests[0]),
    requirementStatus: ["complete"],
  },
];
mockQuests[0].dependedOnBy = [
  {
    dependentQuest: createFlatQuestRef(mockQuests[1]),
    requirementStatus: ["complete"],
  },
];

// Create quests with different statuses for testing
export function createQuestWithProgress(
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
            userId: "test_user_qa",
            questId: quest.id,
          },
    computedStatus: status,
  };
}

// Default mock quests with progress
export const mockQuestsWithProgress: QuestWithProgress[] = [
  createQuestWithProgress(mockQuests[0], "completed"), // Debut - completed
  createQuestWithProgress(mockQuests[1], "available"), // Checking - available (unlocked by Debut)
  createQuestWithProgress(mockQuests[2], "in_progress"), // Shortage - in progress
  createQuestWithProgress(mockQuests[3], "locked"), // Delivery - locked
  createQuestWithProgress(mockQuests[4], "available"), // BP Depot - available
];

// Helper to create quest set with specific statuses
export function createMockQuestSet(
  statuses: Record<string, QuestStatus>
): QuestWithProgress[] {
  return mockQuests.map((quest) => {
    const status = statuses[quest.id] || "locked";
    return createQuestWithProgress(quest, status);
  });
}

// Quest IDs for easy reference in tests
export const QUEST_IDS = {
  DEBUT: "quest_debut",
  CHECKING: "quest_checking",
  SHORTAGE: "quest_shortage",
  DELIVERY: "quest_delivery",
  BP_DEPOT: "quest_bp_depot",
} as const;

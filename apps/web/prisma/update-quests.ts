import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, QuestType } from "@prisma/client";

/**
 * Update quest data from tarkov.dev API WITHOUT deleting user progress.
 * Use this instead of seed.ts when you need to update quest metadata.
 *
 * What this script does:
 * - Updates existing quests with new data (title, level, location, etc.)
 * - Creates new quests that don't exist
 * - Updates/creates objectives and dependencies
 * - PRESERVES all QuestProgress records
 *
 * What this script does NOT do:
 * - Delete QuestProgress (user progress is preserved)
 * - Delete quests that no longer exist in the API (orphans are kept)
 */

// Prisma 7 requires a driver adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Trader color mapping for UI
const TRADER_COLORS: Record<string, string> = {
  prapor: "#b8860b",
  therapist: "#dc143c",
  skier: "#4169e1",
  peacekeeper: "#228b22",
  mechanic: "#708090",
  ragman: "#9932cc",
  jaeger: "#8b4513",
  fence: "#696969",
  lightkeeper: "#ffd700",
  "btr-driver": "#556b2f",
  ref: "#2f4f4f",
  "radio-station": "#483d8b",
  taran: "#8b0000",
  "mr-kerman": "#4682b4",
  voevoda: "#800080",
};

// Known prestige quest IDs
const PRESTIGE_QUEST_IDS = [
  "6761f28a022f60bb320f3e95",
  "6761ff17cdc36bd66102e9d0",
  "6848100b00afffa81f09e365",
  "68481881f43abfdda2058369",
];

const THE_COLLECTOR_QUEST_ID = "5c51aac186f77432ea65c552";

function determineQuestType(
  task: TarkovDevTask,
  traderNormalizedName: string
): QuestType {
  if (PRESTIGE_QUEST_IDS.includes(task.id)) return "PRESTIGE";
  if (task.name.includes("[PVP ZONE]")) return "PVP_ZONE";
  if (traderNormalizedName === "fence") return "REPUTATION";
  if (traderNormalizedName === "lightkeeper") return "LIGHTKEEPER";
  if (task.factionName === "BEAR") return "FACTION_BEAR";
  if (task.factionName === "USEC") return "FACTION_USEC";
  return "STANDARD";
}

// tarkov.dev GraphQL API types
interface TarkovDevTrader {
  id: string;
  name: string;
  normalizedName: string;
  imageLink: string | null;
}

interface TarkovDevMap {
  id: string;
  name: string;
  normalizedName: string;
}

interface TarkovDevTaskRequirement {
  task: { id: string; name: string; normalizedName: string };
  status: string[];
}

interface TarkovDevObjective {
  id: string;
  type: string;
  description: string;
  optional: boolean;
  maps: TarkovDevMap[];
  count?: number; // Only present for countable objectives (Shoot, Item, Extract, etc.)
}

interface TarkovDevTask {
  id: string;
  tarkovDataId: number | null;
  name: string;
  normalizedName: string;
  trader: TarkovDevTrader;
  map: TarkovDevMap | null;
  experience: number;
  wikiLink: string | null;
  minPlayerLevel: number | null;
  kappaRequired: boolean | null;
  lightkeeperRequired: boolean | null;
  factionName: string | null;
  taskRequirements: TarkovDevTaskRequirement[];
  objectives: TarkovDevObjective[];
}

interface TarkovDevResponse {
  data: {
    tasks: TarkovDevTask[];
    traders: TarkovDevTrader[];
  };
}

const TARKOV_DEV_QUERY = `
{
  tasks(limit: 600) {
    id
    tarkovDataId
    name
    normalizedName
    trader {
      id
      name
      normalizedName
      imageLink
    }
    map {
      id
      name
      normalizedName
    }
    experience
    wikiLink
    minPlayerLevel
    kappaRequired
    lightkeeperRequired
    factionName
    taskRequirements {
      task {
        id
        name
        normalizedName
      }
      status
    }
    objectives {
      id
      type
      description
      optional
      maps {
        id
        name
        normalizedName
      }
      ... on TaskObjectiveShoot { count }
      ... on TaskObjectiveItem { count }
      ... on TaskObjectiveExtract { count }
      ... on TaskObjectiveQuestItem { count }
      ... on TaskObjectiveExperience { count }
      ... on TaskObjectiveUseItem { count }
    }
  }
  traders {
    id
    name
    normalizedName
    imageLink
  }
}
`;

async function fetchTarkovDevData(): Promise<TarkovDevResponse> {
  const response = await fetch("https://api.tarkov.dev/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: TARKOV_DEV_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from tarkov.dev: ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  console.log("Fetching data from tarkov.dev GraphQL API...");

  const { data } = await fetchTarkovDevData();
  const { tasks, traders } = data;

  console.log(`Found ${traders.length} traders and ${tasks.length} tasks`);

  // Upsert traders (create or update)
  console.log("Updating traders...");
  const traderIdMap = new Map<string, string>();

  for (const trader of traders) {
    const traderId = trader.normalizedName;
    traderIdMap.set(trader.id, traderId);

    await prisma.trader.upsert({
      where: { id: traderId },
      update: {
        name: trader.name,
        color: TRADER_COLORS[traderId] || "#666666",
      },
      create: {
        id: traderId,
        name: trader.name,
        color: TRADER_COLORS[traderId] || "#666666",
      },
    });
  }

  // Upsert quests
  console.log("Updating quests...");
  const questIdMap = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const task of tasks) {
    const questId = task.id;
    questIdMap.set(task.id, questId);

    const traderId = traderIdMap.get(task.trader.id);
    if (!traderId) {
      console.warn(`Unknown trader for task ${task.name}`);
      skipped++;
      continue;
    }

    const questType = determineQuestType(task, task.trader.normalizedName);

    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (existingQuest) {
      // Update existing quest
      await prisma.quest.update({
        where: { id: questId },
        data: {
          title: task.name,
          wikiLink: task.wikiLink || null,
          levelRequired: task.minPlayerLevel || 1,
          kappaRequired: task.kappaRequired ?? false,
          questType: questType,
          factionName: task.factionName || null,
          location: task.map?.name || null,
          traderId: traderId,
        },
      });

      // Update objectives - use upsert to preserve ObjectiveProgress relations
      // First, get existing objective IDs for this quest
      const existingObjectives = await prisma.objective.findMany({
        where: { questId },
        select: { id: true, description: true },
      });
      const existingByDesc = new Map(
        existingObjectives.map((o) => [o.description, o.id])
      );

      // Track which objectives we've seen
      const seenDescriptions = new Set<string>();

      for (const obj of task.objectives || []) {
        seenDescriptions.add(obj.description);
        const existingId = existingByDesc.get(obj.description);

        if (existingId) {
          // Update existing objective (preserves ObjectiveProgress)
          await prisma.objective.update({
            where: { id: existingId },
            data: {
              map: obj.maps?.[0]?.name || null,
              maps: obj.maps?.map((m) => m.name) || [],
              optional: obj.optional || false,
              type: obj.type || null,
              count: obj.count ?? null, // Numeric count from API (for countable objectives)
            },
          });
        } else {
          // Create new objective
          await prisma.objective.create({
            data: {
              questId,
              description: obj.description,
              map: obj.maps?.[0]?.name || null,
              maps: obj.maps?.map((m) => m.name) || [],
              optional: obj.optional || false,
              type: obj.type || null,
              count: obj.count ?? null, // Numeric count from API (for countable objectives)
            },
          });
        }
      }

      // Delete objectives that no longer exist in API (rare, but possible)
      for (const existing of existingObjectives) {
        if (!seenDescriptions.has(existing.description)) {
          await prisma.objective.delete({ where: { id: existing.id } });
        }
      }
      updated++;
    } else {
      // Create new quest
      await prisma.quest.create({
        data: {
          id: questId,
          title: task.name,
          wikiLink: task.wikiLink || null,
          levelRequired: task.minPlayerLevel || 1,
          kappaRequired: task.kappaRequired ?? false,
          questType: questType,
          factionName: task.factionName || null,
          location: task.map?.name || null,
          traderId: traderId,
          objectives: {
            create: (task.objectives || []).map((obj) => ({
              description: obj.description,
              map: obj.maps?.[0]?.name || null, // Deprecated, kept for backward compat
              maps: obj.maps?.map((m) => m.name) || [], // Store ALL maps
              optional: obj.optional || false,
              type: obj.type || null,
              count: obj.count ?? null, // Numeric count from API (for countable objectives)
            })),
          },
        },
      });
      created++;
    }
  }

  console.log(
    `Quests: ${created} created, ${updated} updated, ${skipped} skipped`
  );

  // Update dependencies - delete all and recreate
  console.log("Updating quest dependencies...");
  await prisma.questDependency.deleteMany();

  let depsCreated = 0;
  for (const task of tasks) {
    const questId = questIdMap.get(task.id);
    if (!questId) continue;

    for (const req of task.taskRequirements || []) {
      const requiredQuestId = questIdMap.get(req.task.id);
      if (!requiredQuestId) continue;

      await prisma.questDependency.create({
        data: {
          dependentId: questId,
          requiredId: requiredQuestId,
          requirementStatus: req.status,
        },
      });
      depsCreated++;
    }
  }

  // Add prestige quest dependencies
  const collectorQuestId = questIdMap.get(THE_COLLECTOR_QUEST_ID);
  if (collectorQuestId) {
    for (const prestigeId of PRESTIGE_QUEST_IDS) {
      const prestigeQuestId = questIdMap.get(prestigeId);
      if (prestigeQuestId) {
        await prisma.questDependency.create({
          data: {
            dependentId: prestigeQuestId,
            requiredId: collectorQuestId,
            requirementStatus: ["complete"],
          },
        });
        depsCreated++;
      }
    }
  }

  console.log(`Created ${depsCreated} dependencies`);

  // Count preserved progress
  const progressCount = await prisma.questProgress.count();
  console.log(
    `\n✅ Update complete! Preserved ${progressCount} progress records.`
  );

  // Summary
  const questCount = await prisma.quest.count();
  const kappaCount = await prisma.quest.count({
    where: { kappaRequired: true },
  });
  console.log(`Total quests: ${questCount} (${kappaCount} required for Kappa)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7 requires a driver adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Trader color mapping for UI
const TRADER_COLORS: Record<string, string> = {
  prapor: "#b8860b", // Dark goldenrod
  therapist: "#dc143c", // Crimson
  skier: "#4169e1", // Royal blue
  peacekeeper: "#228b22", // Forest green
  mechanic: "#708090", // Slate gray
  ragman: "#9932cc", // Dark orchid
  jaeger: "#8b4513", // Saddle brown
  fence: "#696969", // Dim gray
  lightkeeper: "#ffd700", // Gold
  "btr-driver": "#556b2f", // Dark olive green
  ref: "#2f4f4f", // Dark slate gray
  "radio-station": "#483d8b", // Dark slate blue
  taran: "#8b0000", // Dark red
  "mr-kerman": "#4682b4", // Steel blue
  voevoda: "#800080", // Purple
};

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
  task: {
    id: string;
    name: string;
    normalizedName: string;
  };
  status: string[];
}

interface TarkovDevObjective {
  id: string;
  type: string;
  description: string;
  optional: boolean;
  maps: TarkovDevMap[];
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
    headers: {
      "Content-Type": "application/json",
    },
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

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.questProgress.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.questDependency.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.trader.deleteMany();

  // Create traders
  console.log("Creating traders...");
  const traderIdMap = new Map<string, string>();

  for (const trader of traders) {
    // Use normalizedName as our internal ID for consistency
    const traderId = trader.normalizedName;
    traderIdMap.set(trader.id, traderId);

    await prisma.trader.create({
      data: {
        id: traderId,
        name: trader.name,
        color: TRADER_COLORS[traderId] || "#666666",
      },
    });
  }

  // Create quests (first pass - without dependencies)
  console.log("Creating quests...");
  const questIdMap = new Map<string, string>();
  let skippedTasks = 0;

  for (const task of tasks) {
    // Use the tarkov.dev ID directly
    const questId = task.id;
    questIdMap.set(task.id, questId);

    const traderId = traderIdMap.get(task.trader.id);
    if (!traderId) {
      console.warn(
        `Unknown trader ${task.trader.name} (${task.trader.id}) for task ${task.name}`
      );
      skippedTasks++;
      continue;
    }

    // Extract unique maps from objectives
    const objectiveMaps = new Set<string>();
    for (const obj of task.objectives || []) {
      for (const map of obj.maps || []) {
        objectiveMaps.add(map.name);
      }
    }

    await prisma.quest.create({
      data: {
        id: questId,
        title: task.name,
        wikiLink: task.wikiLink || null,
        levelRequired: task.minPlayerLevel || 1,
        kappaRequired: task.kappaRequired ?? false,
        traderId: traderId,
        objectives: {
          create: (task.objectives || []).map((obj) => ({
            description: obj.description,
            map: obj.maps?.[0]?.name || null,
          })),
        },
      },
    });
  }

  if (skippedTasks > 0) {
    console.warn(`Skipped ${skippedTasks} tasks due to unknown traders`);
  }

  // Create quest dependencies (second pass)
  console.log("Creating quest dependencies...");
  let skippedDeps = 0;

  // Track status type distribution for logging
  const statusCounts: Record<string, number> = {};

  for (const task of tasks) {
    const questId = questIdMap.get(task.id);
    if (!questId) continue;

    for (const req of task.taskRequirements || []) {
      const requiredQuestId = questIdMap.get(req.task.id);
      if (!requiredQuestId) {
        console.warn(
          `Unknown required task ${req.task.name} (${req.task.id}) for task ${task.name}`
        );
        skippedDeps++;
        continue;
      }

      // Track status distribution
      const statusKey = JSON.stringify(req.status.sort());
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

      await prisma.questDependency.create({
        data: {
          dependentId: questId,
          requiredId: requiredQuestId,
          requirementStatus: req.status,
        },
      });
    }
  }

  if (skippedDeps > 0) {
    console.warn(`Skipped ${skippedDeps} dependencies due to unknown tasks`);
  }

  // Log status type distribution
  console.log("\nDependency status types:");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }

  // Summary
  const traderCount = await prisma.trader.count();
  const questCount = await prisma.quest.count();
  const kappaCount = await prisma.quest.count({
    where: { kappaRequired: true },
  });
  const objectiveCount = await prisma.objective.count();
  const dependencyCount = await prisma.questDependency.count();

  console.log("\nSeed completed!");
  console.log(`- ${traderCount} traders`);
  console.log(`- ${questCount} quests (${kappaCount} required for Kappa)`);
  console.log(`- ${objectiveCount} objectives`);
  console.log(`- ${dependencyCount} dependencies`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
};

// Map ID to name mapping
const MAP_NAMES: Record<number, string> = {
  0: "Factory",
  1: "Customs",
  2: "Woods",
  3: "Shoreline",
  4: "Interchange",
  5: "Reserve",
  6: "Labs",
  7: "Lighthouse",
  8: "Streets of Tarkov",
  9: "Ground Zero",
};

// Quest title corrections (fix upstream data inconsistencies)
const TITLE_CORRECTIONS: Record<string, string> = {
  "No offence": "No Offense",
  // Future corrections can be added here
};

interface TarkovTrader {
  locale: { en: string };
  wiki: string;
}

interface TarkovObjective {
  type: string;
  id?: number;
  location?: number;
  hint?: string;
  target?: string;
  number?: number;
}

interface TarkovQuest {
  id: number;
  require: {
    level: number;
    quests: number[];
  };
  giver: number;
  turnin: number;
  title: string;
  locales: {
    en: string;
  };
  wiki: string;
  objectives: TarkovObjective[];
  reputation?: Array<{ trader: number; rep: number }>;
  nokappa?: boolean; // If true, quest is NOT required for Kappa
}

async function main() {
  console.log("Fetching data from TarkovTracker...");

  // Fetch traders (object keyed by trader id)
  const tradersRes = await fetch(
    "https://raw.githubusercontent.com/TarkovTracker/tarkovdata/master/traders.json"
  );
  const tradersObj: Record<string, TarkovTrader> = await tradersRes.json();

  // Fetch quests (array)
  const questsRes = await fetch(
    "https://raw.githubusercontent.com/TarkovTracker/tarkovdata/master/quests.json"
  );
  const questsData: TarkovQuest[] = await questsRes.json();

  const traderKeys = Object.keys(tradersObj);
  console.log(
    `Found ${traderKeys.length} traders and ${questsData.length} quests`
  );

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.questProgress.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.questDependency.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.trader.deleteMany();

  // Create traders
  console.log("Creating traders...");
  // Map from trader key (prapor, therapist, etc.) to index for quest giver lookup
  const traderKeyToIndex: Record<string, number> = {};
  const traderIndexToKey: Record<number, string> = {};

  // Build trader mapping - the giver field in quests uses numeric indices
  traderKeys.forEach((key, idx) => {
    traderKeyToIndex[key] = idx;
    traderIndexToKey[idx] = key;
  });

  for (const traderKey of traderKeys) {
    const trader = tradersObj[traderKey];
    const traderId = traderKey.toLowerCase().replace(/\s+/g, "");

    await prisma.trader.create({
      data: {
        id: traderId,
        name: trader.locale?.en || traderKey,
        color: TRADER_COLORS[traderId] || "#666666",
      },
    });
  }

  // Create quests (first pass - without dependencies)
  console.log("Creating quests...");
  const questIdMap = new Map<number, string>();

  for (const quest of questsData) {
    const questId = `quest_${quest.id}`;
    questIdMap.set(quest.id, questId);

    const traderKey = traderIndexToKey[quest.giver];
    const traderId = traderKey?.toLowerCase().replace(/\s+/g, "");
    if (!traderId) {
      console.warn(`Unknown trader index ${quest.giver} for quest ${quest.id}`);
      continue;
    }

    // Extract maps from objectives
    const objectiveMaps = new Set<string>();
    for (const obj of quest.objectives || []) {
      if (
        obj.location !== undefined &&
        obj.location >= 0 &&
        MAP_NAMES[obj.location]
      ) {
        objectiveMaps.add(MAP_NAMES[obj.location]);
      }
    }

    // Apply any title corrections
    const originalTitle =
      quest.locales?.en || quest.title || `Quest ${quest.id}`;
    const correctedTitle = TITLE_CORRECTIONS[originalTitle] || originalTitle;

    await prisma.quest.create({
      data: {
        id: questId,
        title: correctedTitle,
        wikiLink: quest.wiki || null,
        levelRequired: quest.require?.level || 1,
        kappaRequired: !quest.nokappa, // nokappa=true means NOT required for Kappa
        traderId: traderId,
        objectives: {
          create: (quest.objectives || []).map((obj) => {
            // Convert description to string (some objectives have numeric values)
            const desc =
              obj.hint || obj.target || obj.type || "Complete objective";
            return {
              description: String(desc),
              map:
                obj.location !== undefined && obj.location >= 0
                  ? MAP_NAMES[obj.location] || null
                  : null,
            };
          }),
        },
      },
    });
  }

  // Create quest dependencies (second pass)
  console.log("Creating quest dependencies...");
  let depCount = 0;

  for (const quest of questsData) {
    const questId = questIdMap.get(quest.id);
    if (!questId) continue;

    for (const reqId of quest.require?.quests || []) {
      const requiredQuestId = questIdMap.get(reqId);
      if (!requiredQuestId) {
        console.warn(`Unknown required quest ${reqId} for quest ${quest.id}`);
        continue;
      }

      await prisma.questDependency.create({
        data: {
          dependentId: questId,
          requiredId: requiredQuestId,
        },
      });
      depCount++;
    }
  }

  console.log(`Created ${depCount} quest dependencies`);

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

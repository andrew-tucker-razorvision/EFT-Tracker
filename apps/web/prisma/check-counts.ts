import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking Objective.count distribution...\n");

  // Count objectives with/without count
  const withCount = await prisma.objective.count({
    where: { count: { not: null } },
  });
  const total = await prisma.objective.count();

  console.log(`Total objectives: ${total}`);
  console.log(`With count (numeric): ${withCount}`);
  console.log(`Without count (binary): ${total - withCount}`);
  console.log(`Percentage numeric: ${((withCount / total) * 100).toFixed(1)}%`);

  // Sample objectives with counts
  const samples = await prisma.objective.findMany({
    where: { count: { not: null } },
    orderBy: { count: "desc" },
    take: 10,
    select: {
      description: true,
      count: true,
      type: true,
    },
  });

  console.log("\nSample objectives with counts:");
  samples.forEach((obj) => {
    console.log(`  - [${obj.type}] count=${obj.count}: ${obj.description.substring(0, 60)}...`);
  });

  // Check ObjectiveProgress current/target
  const progressWithTarget = await prisma.objectiveProgress.count({
    where: { target: { not: null } },
  });
  const totalProgress = await prisma.objectiveProgress.count();

  console.log("\n--- ObjectiveProgress ---");
  console.log(`Total records: ${totalProgress}`);
  console.log(`With target set: ${progressWithTarget}`);
  console.log(`Without target (needs backfill): ${totalProgress - progressWithTarget}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

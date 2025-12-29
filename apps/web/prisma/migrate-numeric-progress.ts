import "dotenv/config";
import * as fs from "fs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load .env.local (for local development)
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
} catch {
  // .env.local not found, use existing env
}

/**
 * Backfill numeric progress fields (current, target) for existing ObjectiveProgress records.
 *
 * This script:
 * 1. Gets all existing ObjectiveProgress records
 * 2. For each record, looks up the Objective.count field
 * 3. Sets:
 *    - target = Objective.count (or null for binary objectives)
 *    - current = target if completed, 0 if not completed (or null for binary)
 *
 * Safe to run multiple times - uses upsert pattern (idempotent).
 *
 * Run with: npx tsx prisma/migrate-numeric-progress.ts
 */

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    "Migrating ObjectiveProgress records to include numeric progress...\n"
  );

  // First, let's see how many objectives have counts
  const objectivesWithCount = await prisma.objective.count({
    where: { count: { not: null } },
  });
  const totalObjectives = await prisma.objective.count();
  console.log(
    `Objectives with count: ${objectivesWithCount} / ${totalObjectives}`
  );

  // Get all existing ObjectiveProgress records with their objective data
  const progressRecords = await prisma.objectiveProgress.findMany({
    include: {
      objective: {
        select: {
          id: true,
          count: true,
          description: true,
        },
      },
    },
  });

  console.log(
    `Found ${progressRecords.length} ObjectiveProgress records to migrate\n`
  );

  let updated = 0;
  let skippedBinary = 0;
  let skippedAlreadySet = 0;

  for (const record of progressRecords) {
    const objectiveCount = record.objective.count;

    // Skip binary objectives (no count)
    if (objectiveCount === null) {
      skippedBinary++;
      continue;
    }

    // Skip if already has target set (already migrated)
    if (record.target !== null) {
      skippedAlreadySet++;
      continue;
    }

    // Calculate current based on completed status
    const newCurrent = record.completed ? objectiveCount : 0;
    const newTarget = objectiveCount;

    await prisma.objectiveProgress.update({
      where: { id: record.id },
      data: {
        current: newCurrent,
        target: newTarget,
      },
    });

    updated++;
    if (updated % 100 === 0) {
      console.log(`  Updated ${updated} records...`);
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  - Updated: ${updated} records with numeric progress`);
  console.log(
    `  - Skipped (binary): ${skippedBinary} records (no count on objective)`
  );
  console.log(`  - Skipped (already set): ${skippedAlreadySet} records`);

  // Summary stats
  const withNumericProgress = await prisma.objectiveProgress.count({
    where: { target: { not: null } },
  });
  console.log(
    `\nTotal ObjectiveProgress with numeric tracking: ${withNumericProgress}`
  );
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

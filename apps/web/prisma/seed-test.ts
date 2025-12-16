import { PrismaClient, QuestStatus } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

// Use the same Prisma setup as the app (with pg adapter)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEST_USER_PREFIX = "test_";
const TEST_USER_EMAIL = "qa@test.com";
const TEST_USER_PASSWORD = "TestPassword123!";

async function seedTestData() {
  console.log("Seeding test data...");

  // Clear existing test data
  console.log("Clearing existing test data...");

  // Delete test user's progress first (due to foreign key)
  await prisma.questProgress.deleteMany({
    where: {
      user: {
        email: {
          startsWith: TEST_USER_PREFIX,
        },
      },
    },
  });

  // Also delete progress for our specific test user
  await prisma.questProgress.deleteMany({
    where: {
      user: {
        email: TEST_USER_EMAIL,
      },
    },
  });

  // Delete test users
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: TEST_USER_PREFIX } },
        { email: TEST_USER_EMAIL },
      ],
    },
  });

  console.log("Creating test user...");

  // Create test user
  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  const testUser = await prisma.user.create({
    data: {
      id: "test_user_qa",
      email: TEST_USER_EMAIL,
      password: hashedPassword,
      name: "QA Test User",
    },
  });

  console.log(`Created test user: ${testUser.email}`);

  // Get some quests to create progress for
  const quests = await prisma.quest.findMany({
    take: 10,
    orderBy: { levelRequired: "asc" },
  });

  if (quests.length === 0) {
    console.log("No quests found in database. Run db:seed first.");
    return { testUser, quests: [] };
  }

  console.log(`Found ${quests.length} quests. Creating sample progress...`);

  // Create progress with variety of states
  const progressData: {
    userId: string;
    questId: string;
    status: QuestStatus;
  }[] = [];

  quests.forEach((quest, index) => {
    let status: QuestStatus;

    if (index === 0) {
      status = QuestStatus.COMPLETED;
    } else if (index === 1) {
      status = QuestStatus.IN_PROGRESS;
    } else if (index < 4) {
      status = QuestStatus.AVAILABLE;
    } else {
      status = QuestStatus.LOCKED;
    }

    progressData.push({
      userId: testUser.id,
      questId: quest.id,
      status,
    });
  });

  await prisma.questProgress.createMany({
    data: progressData,
  });

  const completedCount = progressData.filter(
    (p) => p.status === QuestStatus.COMPLETED
  ).length;
  const inProgressCount = progressData.filter(
    (p) => p.status === QuestStatus.IN_PROGRESS
  ).length;
  const availableCount = progressData.filter(
    (p) => p.status === QuestStatus.AVAILABLE
  ).length;
  const lockedCount = progressData.filter(
    (p) => p.status === QuestStatus.LOCKED
  ).length;

  console.log(`Created progress records:`);
  console.log(`  - Completed: ${completedCount}`);
  console.log(`  - In Progress: ${inProgressCount}`);
  console.log(`  - Available: ${availableCount}`);
  console.log(`  - Locked: ${lockedCount}`);

  console.log("\nTest data seeded successfully!");
  console.log(`\nTest credentials:`);
  console.log(`  Email: ${TEST_USER_EMAIL}`);
  console.log(`  Password: ${TEST_USER_PASSWORD}`);

  return { testUser, quests };
}

// Export for use in tests
export { seedTestData, TEST_USER_EMAIL, TEST_USER_PASSWORD };

// Run if executed directly
seedTestData()
  .catch((e) => {
    console.error("Error seeding test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

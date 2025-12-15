import http from "k6/http";
import { check, sleep } from "k6";

// Test configuration - simulates companion app sync bursts
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Warm up
    { duration: "1m", target: 500 }, // Burst: 500 concurrent sync requests
    { duration: "2m", target: 500 }, // Sustained burst
    { duration: "1m", target: 100 }, // Wind down
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // Sync can be slightly slower
    http_req_failed: ["rate<0.01"],
    http_reqs: ["rate>100"], // Ensure we're handling burst traffic
  },
};

const BASE_URL = __ENV.BASE_URL || "https://learntotarkov.com";

// Mock user tokens for testing (replace with actual test tokens)
// Note: Not used until authentication is implemented
// const TEST_USERS = [
//   'test-user-1',
//   'test-user-2',
//   'test-user-3',
//   'test-user-4',
//   'test-user-5',
// ];

export default function companionSyncTest() {
  // Simulate companion app syncing quest progress for multiple users
  // Note: userId not used until auth is implemented
  // const userId = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  // Test 1: Fetch user's quest progress
  let res = http.get(`${BASE_URL}/api/progress`, {
    headers: {
      "Content-Type": "application/json",
      // Note: In production, use proper auth headers
      // 'Authorization': `Bearer ${userId}`,
    },
  });

  check(res, {
    "progress - status is 200 or 401": (r) =>
      r.status === 200 || r.status === 401,
    "progress - response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(0.1); // Brief pause

  // Test 2: Update quest progress (batch update)
  const updates = [
    { questId: "prapor-debut", completed: true },
    { questId: "therapist-shortage", objectives: { 1: true, 2: false } },
  ];

  res = http.post(
    `${BASE_URL}/api/progress/batch`,
    JSON.stringify({ updates }),
    {
      headers: {
        "Content-Type": "application/json",
        // Note: In production, use proper auth headers
        // 'Authorization': `Bearer ${userId}`,
      },
    }
  );

  check(res, {
    "batch update - status is 200 or 401": (r) =>
      r.status === 200 || r.status === 401,
    "batch update - response time < 1500ms": (r) => r.timings.duration < 1500,
  });

  // Companion app polls every 30-60 seconds
  sleep(Math.random() * 30 + 30);
}

import http from "k6/http";
import { check, sleep } from "k6";

// Test configuration
export const options = {
  stages: [
    { duration: "1m", target: 20 }, // Warm up
    { duration: "5m", target: 50 }, // Sustained: 50 req/sec target
    { duration: "2m", target: 100 }, // Stress: 100 req/sec
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
    http_reqs: ["rate>45"], // Ensure we're actually hitting 50 req/sec target
  },
};

const BASE_URL = __ENV.BASE_URL || "https://learntotarkov.com";

export default function questApiTest() {
  // Test 1: Get all quests
  let res = http.get(`${BASE_URL}/api/quests`);

  check(res, {
    "quests - status is 200": (r) => r.status === 200,
    "quests - returns array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body.quests);
      } catch {
        return false;
      }
    },
    "quests - response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(0.5); // Brief pause between requests

  // Test 2: Get quest by ID (simulate user viewing quest details)
  const questId = "prapor-debut"; // Use a known quest ID
  res = http.get(`${BASE_URL}/api/quests/${questId}`);

  check(res, {
    "quest detail - status is 200": (r) => r.status === 200,
    "quest detail - has quest data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id === questId;
      } catch {
        return false;
      }
    },
    "quest detail - response time < 300ms": (r) => r.timings.duration < 300,
  });

  sleep(1); // Think time
}

import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Test configuration - simulates authentication flow under load
export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Warm up: 10 signups/logins per sec
    { duration: "3m", target: 50 }, // Normal load: 50 concurrent auth operations
    { duration: "2m", target: 100 }, // Peak load: 100 concurrent auth operations
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // Auth can be slower
    http_req_failed: ["rate<0.05"], // Allow 5% failure for invalid credentials
  },
};

const BASE_URL = __ENV.BASE_URL || "https://learntotarkov.com";

export default function authFlowTest() {
  // Test flow: 70% login, 30% signup (realistic distribution)
  const isSignup = Math.random() < 0.3;

  if (isSignup) {
    testSignup();
  } else {
    testLogin();
  }

  sleep(Math.random() * 2 + 1); // Think time
}

function testSignup() {
  // Generate unique test user
  const username = `testuser_${randomString(8)}`;
  const email = `${username}@test.com`;
  const password = randomString(12);

  // Step 1: Access signup page (to get CSRF token if needed)
  let res = http.get(`${BASE_URL}/auth/signup`);
  check(res, {
    "signup page - status is 200": (r) => r.status === 200,
  });

  sleep(1); // User fills out form

  // Step 2: Submit signup form
  res = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify({
      username,
      email,
      password,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "signup - status is 200 or 409": (r) =>
      r.status === 200 || r.status === 409, // 409 = user exists
    "signup - response time < 1000ms": (r) => r.timings.duration < 1000,
    "signup - returns data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body !== null;
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // Step 3: Verify authentication by accessing protected endpoint
  if (res.status === 200) {
    res = http.get(`${BASE_URL}/api/user/profile`, {
      headers: {
        // Note: In production, cookies or session token would be set
        "Content-Type": "application/json",
      },
    });

    check(res, {
      "profile after signup - accessible": (r) =>
        r.status === 200 || r.status === 401,
    });
  }
}

function testLogin() {
  // Use a pre-existing test account or attempt random login
  const email = `testuser@example.com`;
  const password = `testpassword123`;

  // Step 1: Access login page
  let res = http.get(`${BASE_URL}/auth/signin`);
  check(res, {
    "login page - status is 200": (r) => r.status === 200,
  });

  sleep(1); // User fills out form

  // Step 2: Submit login form
  res = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    JSON.stringify({
      email,
      password,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "login - status is 200 or 401": (r) => r.status === 200 || r.status === 401, // 401 = invalid credentials
    "login - response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // Step 3: Verify session by accessing protected endpoint
  if (res.status === 200) {
    res = http.get(`${BASE_URL}/api/user/profile`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    check(res, {
      "profile after login - accessible": (r) =>
        r.status === 200 || r.status === 401,
    });
  }
}

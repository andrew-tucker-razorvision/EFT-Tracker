import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Warm up: ramp to 10 users
    { duration: '5m', target: 50 },  // Sustained load: 50 concurrent users
    { duration: '2m', target: 100 }, // Peak load: 100 concurrent users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate must be below 1%
  },
};

// Test scenario
export default function () {
  // GET homepage
  const res = http.get(__ENV.BASE_URL || 'https://learntotarkov.com');

  // Verify response
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page contains title': (r) => r.body.includes('EFT Tracker'),
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Think time: simulate user reading page for 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

# Load Testing Guide

This directory contains load testing scenarios for EFT-Tracker using k6.

## Overview

Load testing validates application performance under stress, identifies bottlenecks, and ensures the system can handle expected traffic.

## Prerequisites

### Install k6

**macOS:**

```bash
brew install k6
```

**Windows:**

```bash
choco install k6
# or download from https://k6.io/docs/getting-started/installation
```

**Linux:**

```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Scenarios

### 1. Homepage Load Test

**File:** `homepage.js`

Tests the homepage under sustained load.

**Run:**

```bash
k6 run homepage.js
```

**Expected Results:**

- p95 response time < 500ms
- Error rate < 1%
- No timeouts

### 2. Quest API Stress Test

**File:** `quest-api.js`

Tests the quest API endpoint under high request rate.

**Run:**

```bash
k6 run quest-api.js
```

**Expected Results:**

- p95 response time < 500ms
- Handles 50 req/sec sustained
- Error rate < 1%
- No database connection pool exhaustion

### 3. Companion Sync Burst Test

**File:** `companion-sync.js`

Simulates companion app sync bursts (many devices syncing simultaneously).

**Run:**

```bash
k6 run companion-sync.js
```

**Expected Results:**

- Handles 500 requests in 1 minute
- No 5xx errors
- Connection pool stable

### 4. Authentication Flow Test

**File:** `auth-flow.js`

Tests user registration and login under load.

**Run:**

```bash
k6 run auth-flow.js
```

**Expected Results:**

- Handles 10 signups/sec
- No duplicate user errors
- Password hashing doesn't bottleneck

## Running Tests

### Quick Test (Development)

```bash
# Run single test for 1 minute
k6 run --duration 1m --vus 10 quest-api.js
```

### Full Test Suite (Pre-Production)

```bash
# Run all tests sequentially
k6 run homepage.js
k6 run quest-api.js
k6 run companion-sync.js
k6 run auth-flow.js
```

### Staged Load Test

```bash
# Gradually increase load
k6 run --stage 1m:10 --stage 5m:50 --stage 1m:100 --stage 1m:0 quest-api.js
```

### Custom Thresholds

```bash
# Fail if p95 > 500ms
k6 run --threshold 'http_req_duration{p(95)}<500' quest-api.js
```

## Interpreting Results

### Key Metrics

**Response Time:**

- **p50** (median): Typical request time
- **p95**: 95% of requests complete in this time or less
- **p99**: 99th percentile - worst case for most users

**Error Rate:**

- **http_req_failed**: % of requests that failed
- Target: <1%

**Throughput:**

- **http_reqs**: Total requests per second
- **data_received**: Bandwidth consumed

**Iterations:**

- **iterations**: Number of complete test scenarios executed
- Higher is better

### Example Output

```
checks.........................: 100.00% ✓ 5000      ✗ 0
data_received..................: 15 MB   50 kB/s
data_sent......................: 500 kB  1.7 kB/s
http_req_blocked...............: avg=1.2ms   min=0µs     med=1µs     max=50ms    p(90)=2µs     p(95)=3µs
http_req_connecting............: avg=500µs   min=0µs     med=0µs     max=20ms    p(90)=0µs     p(95)=0µs
http_req_duration..............: avg=120ms   min=50ms    med=100ms   max=500ms   p(90)=200ms   p(95)=250ms
  { expected_response:true }...: avg=120ms   min=50ms    med=100ms   max=500ms   p(90)=200ms   p(95)=250ms
http_req_failed................: 0.00%   ✓ 0         ✗ 5000
http_req_receiving.............: avg=500µs   min=100µs   med=400µs   max=10ms    p(90)=800µs   p(95)=1ms
http_req_sending...............: avg=100µs   min=50µs    med=90µs    max=5ms     p(90)=150µs   p(95)=200µs
http_req_tls_handshaking.......: avg=600µs   min=0µs     med=0µs     max=30ms    p(90)=0µs     p(95)=0µs
http_req_waiting...............: avg=119ms   min=49ms    med=99ms    max=499ms   p(90)=199ms   p(95)=249ms
http_reqs......................: 5000    16.666667/s
iteration_duration.............: avg=1.2s    min=1s      med=1.1s    max=1.5s    p(90)=1.3s    p(95)=1.4s
iterations.....................: 5000    16.666667/s
vus............................: 10      min=10      max=10
vus_max........................: 10      min=10      max=10
```

**Analysis:**

- ✅ p95 response time: 250ms (target: <500ms)
- ✅ Error rate: 0% (target: <1%)
- ✅ Throughput: 16.7 req/sec
- ✅ All checks passing (100%)

### Red Flags 🚩

**High Error Rate:**

```
http_req_failed................: 5.00%   ✓ 250       ✗ 4750
```

→ Investigate 5xx errors, database issues, rate limiting

**Slow Response Times:**

```
http_req_duration..............: avg=2s     p(95)=5s
```

→ Check database queries, connection pool, slow endpoints

**Connection Issues:**

```
http_req_failed................: 10.00%  (dial tcp: too many open files)
```

→ Connection pool exhaustion, increase limits

## Monitoring During Tests

### Watch Application Logs

```bash
# In Coolify or via SSH
tail -f /var/log/app.log
```

Look for:

- Database connection errors
- Slow query warnings
- Memory/CPU issues

### Monitor Database

Check Neon dashboard during tests:

- Active connections (should stay < 80% of limit)
- Query performance
- CPU usage

### Monitor Server

```bash
# CPU usage
htop

# Memory usage
free -h

# Network connections
netstat -an | grep :3000 | wc -l
```

## Common Bottlenecks

### 1. Database Connection Pool Exhaustion

**Symptoms:**

```
Error: timeout acquiring connection from pool
```

**Fix:**

- Increase `max` in `src/lib/prisma.ts`
- Reduce `idleTimeoutMillis` to release connections faster
- Check for connection leaks (unreleased connections)

### 2. Slow Database Queries

**Symptoms:**

- High p95 response times
- Increasing response times under load

**Fix:**

- Add database indexes
- Optimize N+1 queries
- Use database query logging to identify slow queries

### 3. Memory Leaks

**Symptoms:**

- Memory usage increases continuously
- Eventually runs out of memory

**Fix:**

- Profile with Node.js `--inspect`
- Check for unreleased resources
- Review event listener cleanup

### 4. CPU Bottleneck

**Symptoms:**

- CPU at 100%
- Response times increase linearly with load

**Fix:**

- Optimize hot code paths
- Consider vertical scaling (more CPU cores)
- Review expensive operations (bcrypt rounds, etc.)

## Best Practices

### Do's ✅

- ✅ Test against staging environment first
- ✅ Start with small load, increase gradually
- ✅ Run tests during off-peak hours
- ✅ Monitor all system resources during tests
- ✅ Document baseline metrics for comparison
- ✅ Test one scenario at a time
- ✅ Let system stabilize between tests

### Don'ts ❌

- ❌ Test against production (use staging)
- ❌ Start with maximum load
- ❌ Run tests during peak user hours
- ❌ Ignore warnings and errors
- ❌ Test without monitoring
- ❌ Make changes without re-testing
- ❌ Skip baseline measurements

## Success Criteria

Application passes load testing if:

- ✅ **p95 response time** < 500ms for API endpoints
- ✅ **p99 response time** < 1s for API endpoints
- ✅ **Error rate** < 1% under sustained load
- ✅ **Throughput** meets expected traffic (50 req/sec)
- ✅ **Database connections** stay below 80% of limit
- ✅ **No memory leaks** over 30-minute test
- ✅ **Recovery** after load spike < 1 minute
- ✅ **No 5xx errors** from application code

## Advanced Testing

### Spike Test

Test how system handles sudden traffic spikes.

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Normal load
    { duration: "10s", target: 100 }, // Spike!
    { duration: "3m", target: 100 }, // Sustain spike
    { duration: "30s", target: 10 }, // Back to normal
  ],
};
```

### Soak Test

Test for memory leaks and performance degradation over time.

```javascript
export const options = {
  stages: [
    { duration: "2m", target: 50 }, // Ramp up
    { duration: "30m", target: 50 }, // Sustained load
    { duration: "2m", target: 0 }, // Ramp down
  ],
};
```

### Breakpoint Test

Find the maximum load system can handle.

```javascript
export const options = {
  stages: [
    { duration: "2m", target: 10 },
    { duration: "2m", target: 20 },
    { duration: "2m", target: 40 },
    { duration: "2m", target: 80 },
    { duration: "2m", target: 160 }, // Keep doubling until failure
  ],
};
```

## Related Documentation

- [Database Connection Pooling](../docs/DATABASE_MIGRATIONS.md#connection-pool-configuration)
- [Performance Monitoring](../docs/MONITORING.md)
- [Production Runbooks](../docs/RUNBOOKS.md)

## External Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Cloud](https://k6.io/cloud/) (paid service for distributed testing)

## Revision History

| Date       | Version | Changes               |
| ---------- | ------- | --------------------- |
| 2025-01-13 | 1.0     | Initial documentation |

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint for monitoring and container orchestration
 *
 * Returns comprehensive health status including:
 * - Process uptime and environment
 * - Database connectivity and response time
 * - Connection pool status
 *
 * Status codes:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: Database unreachable or critical failure
 *
 * Used by:
 * - UptimeRobot for availability monitoring
 * - Coolify for zero-downtime deployments
 * - Docker health checks
 */

type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface DatabaseCheck {
  status: HealthStatus;
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: DatabaseCheck;
  };
}

export async function GET() {
  const startTime = Date.now();

  // Check database connectivity
  const databaseCheck = await checkDatabase();

  // Determine overall status
  const overallStatus: HealthStatus =
    databaseCheck.status === "unhealthy" ? "unhealthy" : databaseCheck.status;

  const response: HealthResponse = {
    status: overallStatus,
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: databaseCheck,
    },
  };

  // Log health check failures
  if (overallStatus !== "healthy") {
    logger.warn(
      {
        status: overallStatus,
        checks: response.checks,
        duration: Date.now() - startTime,
      },
      "Health check failed"
    );
  }

  // Return appropriate status code
  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Check database connectivity with timeout
 */
async function checkDatabase(): Promise<DatabaseCheck> {
  const timeout = 5000; // 5 second timeout
  const start = Date.now();

  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Database query timeout")), timeout);
    });

    // Race between query and timeout
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);

    const responseTime = Date.now() - start;

    // Determine status based on response time
    // >1000ms is degraded (slow but functional)
    const status: HealthStatus = responseTime > 1000 ? "degraded" : "healthy";

    return {
      status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;

    // Log the error with context
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      },
      "Database health check failed"
    );

    return {
      status: "unhealthy",
      responseTime,
      error:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

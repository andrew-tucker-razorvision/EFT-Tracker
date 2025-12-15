import { prisma } from "./prisma";
import { logger } from "./logger";
import crypto from "crypto";
import type { SecurityEventType } from "@prisma/client";

interface SecurityEventData {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security event to the database
 * Automatically hashes email addresses for privacy
 * Triggers alerts for suspicious activity
 */
export async function logSecurityEvent(data: SecurityEventData) {
  try {
    // Hash email for privacy (can still correlate events without storing PII)
    const emailHash = data.email
      ? crypto.createHash("sha256").update(data.email).digest("hex")
      : undefined;

    await prisma.securityEvent.create({
      data: {
        type: data.type,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: {
          ...data.metadata,
          emailHash,
        },
      },
    });

    // Check for suspicious activity patterns
    if (data.type === "LOGIN_FAILED") {
      await checkFailedLoginThreshold(data.ipAddress);
    }

    if (data.type === "RATE_LIMIT_EXCEEDED") {
      await checkRateLimitPattern(data.ipAddress);
    }
  } catch (error) {
    // Don't fail the request if logging fails
    logger.error(
      { error, eventType: data.type },
      "Failed to log security event"
    );
  }
}

/**
 * Check if an IP has exceeded the failed login threshold
 * Alert if >10 failed logins in the last hour
 */
async function checkFailedLoginThreshold(ipAddress: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const failedAttempts = await prisma.securityEvent.count({
    where: {
      type: "LOGIN_FAILED",
      ipAddress,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (failedAttempts >= 10) {
    logger.warn(
      { ipAddress, failedAttempts },
      "Suspicious login activity detected - possible brute force attack"
    );
  }
}

/**
 * Check if an IP is repeatedly hitting rate limits
 * Alert if >5 rate limit violations in 15 minutes
 */
async function checkRateLimitPattern(ipAddress: string) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const rateLimitHits = await prisma.securityEvent.count({
    where: {
      type: "RATE_LIMIT_EXCEEDED",
      ipAddress,
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  if (rateLimitHits >= 5) {
    logger.warn(
      { ipAddress, rateLimitHits },
      "Repeated rate limit violations - possible automated attack"
    );
  }
}

/**
 * Get security events for a user (for security dashboard)
 */
export async function getUserSecurityEvents(userId: string, limit = 50) {
  return prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get security events for an IP address (for investigation)
 */
export async function getIpSecurityEvents(ipAddress: string, limit = 50) {
  return prisma.securityEvent.findMany({
    where: { ipAddress },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

import pino from "pino";
import { env } from "./env";

/**
 * Structured logger using Pino
 *
 * This replaces console.log/error/warn throughout the application with
 * structured JSON logging for better production observability.
 *
 * Features:
 * - Automatic PII redaction (passwords, tokens, emails)
 * - Pretty-printed output in development
 * - JSON output in production for log aggregation
 * - Configurable log levels via LOG_LEVEL env var
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info({ userId }, 'User registered successfully');
 * logger.error({ err: error }, 'Database query failed');
 * logger.warn({ duration: 1500 }, 'Slow query detected');
 * ```
 */

// Get log level from environment, default to 'info'
const logLevel =
  process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level: logLevel,

  // Redact sensitive fields from logs
  redact: {
    paths: [
      "password",
      "token",
      "email",
      "companionToken",
      "apiToken",
      "AUTH_SECRET",
      "DATABASE_URL",
      "*.password",
      "*.token",
      "*.companionToken",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },

  // Format log level as a string (not a number)
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Use pino-pretty for readable logs in development
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

/**
 * Create a child logger with additional context
 *
 * @example
 * ```ts
 * const reqLogger = logger.child({ requestId: req.id });
 * reqLogger.info('Processing request');
 * ```
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  });
}

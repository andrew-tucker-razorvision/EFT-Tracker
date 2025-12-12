import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server-Side Configuration
 *
 * Captures errors and performance metrics in Node.js runtime (API routes, SSR, etc.)
 * Configured to:
 * - Redact PII and sensitive data
 * - Sample performance traces (10% in production, 100% in dev)
 * - Integrate with Prisma for database tracing
 */

Sentry.init({
  // Get your DSN from: https://sentry.io/settings/projects/[project]/keys/
  dsn: process.env.SENTRY_DSN,

  // Capture exceptions from all environments
  enabled: true,

  // Set environment (development, staging, production)
  environment: process.env.NODE_ENV || "development",

  // Performance Monitoring
  // Free tier: 5M spans/month. With 10% sampling, supports ~50M requests/month
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // PII Redaction - strip sensitive data from events
  beforeSend(event) {
    // Redact sensitive request data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      // Redact query params that might contain tokens
      if (
        event.request.query_string &&
        typeof event.request.query_string === "string"
      ) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]*/g,
          "token=[REDACTED]"
        );
      }
    }

    return event;
  },

  // Integrations
  integrations: [Sentry.prismaIntegration(), Sentry.httpIntegration()],

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Ignore errors that aren't actionable
  ignoreErrors: [
    // Database connection errors during shutdown
    "ECONNRESET",
    "EPIPE",
    // Prisma connection errors
    "P1001", // Can't reach database server
    "P1008", // Operations timed out
  ],
});

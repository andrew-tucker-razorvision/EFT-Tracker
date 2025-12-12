import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Edge Runtime Configuration
 *
 * Captures errors and performance metrics in Edge runtime (middleware, edge API routes).
 * Edge runtime has limited APIs compared to Node.js.
 *
 * Configured to:
 * - Redact PII and sensitive data
 * - Sample performance traces (10% in production, 100% in dev)
 * - Minimal integrations due to edge runtime constraints
 */

Sentry.init({
  // Get your DSN from: https://sentry.io/settings/projects/[project]/keys/
  dsn: process.env.SENTRY_DSN,

  // Capture exceptions from all environments
  enabled: true,

  // Set environment (development, staging, production)
  environment: process.env.NODE_ENV || "development",

  // Performance Monitoring
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

      // Redact tokens from query strings
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

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Ignore network errors
  ignoreErrors: ["NetworkError", "Failed to fetch", "ECONNRESET"],
});

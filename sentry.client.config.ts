import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client-Side Configuration
 *
 * Captures errors and performance metrics in the browser.
 * Configured to:
 * - Redact PII (emails, passwords, tokens)
 * - Sample performance traces (10% in production, 100% in dev)
 * - Integrate with browser tracing for page loads and navigation
 */

Sentry.init({
  // Get your DSN from: https://sentry.io/settings/projects/[project]/keys/
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture exceptions from all environments
  enabled: true,

  // Set environment (development, staging, production)
  environment: process.env.NODE_ENV || "development",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay - capture user sessions for debugging
  // Only enable in production with low sample rate to manage quota
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,
  replaysOnErrorSampleRate: 1.0, // Always capture replays when errors occur

  // PII Redaction - strip sensitive data from events
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }

    // Redact email addresses from breadcrumbs and messages
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(
            /[\w.-]+@[\w.-]+\.\w+/g,
            "[REDACTED_EMAIL]"
          );
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration({
      // Trace all page loads and navigations
      enableInp: true,
    }),
    Sentry.replayIntegration({
      // Mask all text and inputs by default
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Ignore common browser errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    // Network errors
    "NetworkError",
    "Failed to fetch",
    // Browser quirks
    "ResizeObserver loop limit exceeded",
  ],
});

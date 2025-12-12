import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Enable standalone output for Docker deployment

  // Configure server-side externals for Pino
  serverExternalPackages: ["pino", "pino-pretty"],
};

// Wrap Next.js config with Sentry for error tracking and performance monitoring
export default withSentryConfig(nextConfig, {
  // Sentry organization and project (set via environment variables)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only show Sentry build logs in CI
  silent: !process.env.CI,

  // Suppress Sentry CLI output
  disableLogger: true,

  // Automatically annotate React components for better error context
  reactComponentAnnotation: {
    enabled: true,
  },

  // Automatically upload source maps for error stack traces
  // Requires SENTRY_AUTH_TOKEN environment variable
  widenClientFileUpload: true,

  // Route tunneling to avoid ad-blockers
  // Creates a random route like /_sentry/<hash> to proxy requests
  tunnelRoute: "/monitoring",
});

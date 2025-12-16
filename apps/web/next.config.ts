import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Standalone for Coolify deployment

  // Configure server-side externals for Pino
  serverExternalPackages: ["pino", "pino-pretty"],

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https://api.tarkov.dev; " +
              "frame-ancestors 'self';",
          },
        ],
      },
      // CORS headers for Tauri companion app
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "tauri://localhost",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

// Wrap Next.js config with Sentry for error tracking and performance monitoring
export default withSentryConfig(nextConfig, {
  // Sentry organization and project (set via environment variables)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only show Sentry build logs in CI
  silent: !process.env.CI,

  // Webpack configuration for Sentry
  webpack: {
    // Remove debug logging from production builds
    treeshake: {
      removeDebugLogging: true,
    },
    // Automatically annotate React components for better error context
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Automatically upload source maps for error stack traces
  // Requires SENTRY_AUTH_TOKEN environment variable
  widenClientFileUpload: true,

  // Route tunneling to avoid ad-blockers
  // Creates a random route like /_sentry/<hash> to proxy requests
  tunnelRoute: "/monitoring",
});

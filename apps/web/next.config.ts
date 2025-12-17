import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable standalone output for development builds (causes symlink issues on Windows)
  // Re-enable for production deployments
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Required for monorepo standalone builds - preserves apps/web/ structure
  // Without this, Next.js generates a flat structure and server.js can't find static files
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Fail fast on TypeScript errors - catch all issues before deployment
  typescript: {
    ignoreBuildErrors: false,
  },

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

export default nextConfig;

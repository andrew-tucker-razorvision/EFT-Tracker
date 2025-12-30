import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Skip environment validation in tests
process.env.SKIP_ENV_VALIDATION = "1";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@eft-tracker/types": path.resolve(__dirname, "./packages/types/src"),
      "@eft-tracker/utils": path.resolve(__dirname, "./packages/utils/src"),
      "@eft-tracker/theme": path.resolve(__dirname, "./packages/theme/src"),
      "@eft-tracker/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@eft-tracker/hooks": path.resolve(__dirname, "./packages/hooks/src"),
      "@upstash/redis": path.resolve(__dirname, "./__tests__/setup/stubs/upstash-redis.ts"),
      "@upstash/ratelimit": path.resolve(__dirname, "./__tests__/setup/stubs/upstash-ratelimit.ts"),
      // Resolve React and dependencies from apps/web/node_modules where pnpm symlinks them
      "react": path.resolve(__dirname, "./apps/web/node_modules/react"),
      "react-dom": path.resolve(__dirname, "./apps/web/node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./apps/web/node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./apps/web/node_modules/react/jsx-dev-runtime"),
      "next-auth": path.resolve(__dirname, "./apps/web/node_modules/next-auth"),
      "@xyflow/react": path.resolve(__dirname, "./apps/web/node_modules/@xyflow/react"),
      "bcryptjs": path.resolve(__dirname, "./apps/web/node_modules/bcryptjs"),
      "@tanstack/react-query": path.resolve(__dirname, "./apps/web/node_modules/@tanstack/react-query"),
    },
    dedupe: ["react", "react-dom", "next-auth", "@xyflow/react", "@tanstack/react-query"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./__tests__/setup/vitest.setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**/*",
      "__tests__/e2e/**/*",
      "__tests__/smoke/**/*",
    ],
    coverage: {
      provider: "v8",
      include: ["apps/web/src/**/*.{ts,tsx}"],
      exclude: [
        "apps/web/src/types/**",
        "apps/web/src/components/ui/**",
        "**/*.d.ts",
        "apps/web/src/app/api/**",
      ],
      reporter: ["text", "html", "json"],
    },
    testTimeout: 10000,
  },
});

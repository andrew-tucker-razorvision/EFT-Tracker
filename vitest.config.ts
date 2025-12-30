import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Skip environment validation in tests
process.env.SKIP_ENV_VALIDATION = "1";

export default defineConfig({
  plugins: [react()],
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
      // Fix for Vite 7.3.0 + React JSX runtime resolution (pnpm uses .pnpm directory)
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/.pnpm/react@19.2.0/node_modules/react/jsx-dev-runtime.js"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/.pnpm/react@19.2.0/node_modules/react/jsx-runtime.js"),
      "react": path.resolve(__dirname, "./node_modules/.pnpm/react@19.2.0/node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/.pnpm/react-dom@19.2.0_react@19.2.0/node_modules/react-dom"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./__tests__/setup/vitest.setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**/*",
      "__tests__/e2e/**/*",
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

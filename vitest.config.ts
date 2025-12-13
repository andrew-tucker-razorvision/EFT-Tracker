import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Skip environment validation in tests
process.env.SKIP_ENV_VALIDATION = "1";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup/vitest.setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["__tests__/e2e/**/*", "node_modules/**/*"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/types/**",
        "src/components/ui/**",
        "**/*.d.ts",
        "src/app/api/**",
      ],
      reporter: ["text", "html", "json"],
    },
    testTimeout: 10000,
  },
});

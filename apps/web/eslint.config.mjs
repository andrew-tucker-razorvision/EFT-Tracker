import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "dist/**",
  ]),
  // Allow @ts-nocheck/@ts-expect-error on files with React 18/19 type compatibility issues
  {
    files: [
      "src/app/(auth)/**/*.tsx",
      "src/components/catch-up/CatchUpDialog.tsx",
      "src/components/progress-stats/ProgressStats.tsx",
      "src/components/quest-tree/QuestFilters.tsx",
      "src/components/quest-tree/QuestTree.tsx",
      "src/components/ui/skeleton.tsx",
      "src/components/ui/sonner.tsx",
      "src/contexts/StatsContext.tsx",
      "src/lib/auth.ts",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;

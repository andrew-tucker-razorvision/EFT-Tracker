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
  // Allow @ts-nocheck on auth pages due to React 19 component type issues
  {
    files: ["src/app/(auth)/**/*.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;

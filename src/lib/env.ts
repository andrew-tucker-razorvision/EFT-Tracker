import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This validates all required environment variables at application startup.
 * If any variables are missing or invalid, the application will fail to start
 * with a clear error message.
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Authentication
  AUTH_SECRET: z
    .string()
    .min(
      32,
      "AUTH_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32"
    ),
  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL (e.g., https://learntotarkov.com)"),

  // Optional: GitHub integration
  GITHUB_PERSONAL_ACCESS_TOKEN: z.string().optional(),

  // Optional: Search features
  BRAVE_API_KEY: z.string().optional(),
});

/**
 * Validated environment variables
 *
 * Import this instead of using process.env directly to ensure type safety
 * and runtime validation.
 *
 * @example
 * ```ts
 * import { env } from '@/lib/env';
 *
 * const dbUrl = env.DATABASE_URL; // Type-safe and validated
 * ```
 */
export const env =
  process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as z.infer<typeof envSchema>)
    : envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;

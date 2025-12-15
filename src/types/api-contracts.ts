/**
 * API Contract Types
 *
 * Centralized Zod schemas and TypeScript types for API endpoints.
 * Used by both API routes and test mocks to ensure type safety.
 *
 * Usage:
 * - Import schemas for runtime validation in API routes
 * - Import types for TypeScript type checking
 * - Import in MSW handlers to match API route behavior
 */

import { z } from "zod";

// ============================================================================
// Companion API Schemas
// ============================================================================

/**
 * POST /api/companion/link
 * Generate a new companion token for linking the desktop app.
 */
export const linkSchema = z.object({
  deviceName: z.string().min(1, "Device name is required").max(100),
  gameMode: z.enum(["PVP", "PVE"]).default("PVP"),
});

export type LinkRequest = z.infer<typeof linkSchema>;

export type LinkResponse = {
  token: string;
  tokenId: string;
  deviceName: string;
  gameMode: string;
  createdAt: Date;
  message: string;
};

/**
 * GET /api/companion/link
 * List all companion tokens for the authenticated user.
 */
export type CompanionToken = {
  id: string;
  tokenHint: string;
  deviceName: string;
  gameMode: string;
  lastSeen: Date | null;
  createdAt: Date;
};

export type ListTokensResponse = {
  tokens: CompanionToken[];
};

/**
 * POST /api/companion/sync
 * Sync quest progress events from the companion app.
 */
export const syncEventSchema = z.object({
  questId: z.string().min(1),
  status: z.enum(["STARTED", "FINISHED", "FAILED"]),
  timestamp: z.string().datetime(),
});

export const syncSchema = z.object({
  events: z.array(syncEventSchema).min(1).max(100),
  deviceInfo: z
    .object({
      version: z.string().optional(),
      os: z.string().optional(),
    })
    .optional(),
});

export type SyncEvent = z.infer<typeof syncEventSchema>;
export type SyncRequest = z.infer<typeof syncSchema>;

export type SyncResponse = {
  synced: number;
  errors: Array<{ questId: string; error: string }>;
  unlockedQuests: string[];
};

/**
 * GET /api/companion/status
 * Check companion token validity and return user/connection info.
 */
export type StatusResponse = {
  valid: boolean;
  userId?: string;
  userName?: string;
  playerLevel?: number;
  deviceName?: string;
  gameMode?: string;
  lastSeen?: Date | null;
  createdAt?: Date;
  stats?: {
    completed: number;
    inProgress: number;
    available: number;
    locked: number;
  };
  error?: string;
};

/**
 * GET /api/companion/quests
 * Returns a lightweight map of quest IDs to quest names.
 */
export type QuestInfo = {
  title: string;
  trader: string;
};

export type QuestsResponse = {
  quests: Record<string, QuestInfo>;
  count: number;
};

// ============================================================================
// Companion API Contract Map
// ============================================================================

export type CompanionAPI = {
  "POST /api/companion/link": {
    request: LinkRequest;
    response: LinkResponse;
  };
  "GET /api/companion/link": {
    request: never;
    response: ListTokensResponse;
  };
  "POST /api/companion/sync": {
    request: SyncRequest;
    response: SyncResponse;
  };
  "GET /api/companion/status": {
    request: never;
    response: StatusResponse;
  };
  "GET /api/companion/quests": {
    request: never;
    response: QuestsResponse;
  };
};

// ============================================================================
// Quest Progress API Schemas (for future use)
// ============================================================================

/**
 * POST /api/progress
 * Update quest progress (web UI).
 */
export const progressUpdateSchema = z.object({
  questId: z.string().min(1),
  status: z.enum(["AVAILABLE", "IN_PROGRESS", "COMPLETED", "LOCKED"]),
});

export type ProgressUpdateRequest = z.infer<typeof progressUpdateSchema>;

export type ProgressUpdateResponse = {
  success: boolean;
  questId: string;
  status: string;
  unlockedQuests?: string[];
  error?: string;
};

// ============================================================================
// Authentication API Schemas (for future use)
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user account.
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export type RegisterResponse = {
  success: boolean;
  userId?: string;
  error?: string;
};

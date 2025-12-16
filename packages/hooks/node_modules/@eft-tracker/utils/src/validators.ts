/**
 * Shared Validation Utilities
 * Pure validation functions using Zod schemas
 */

import { z } from "zod";

/**
 * Validate quest filter schema
 */
export const questFilterSchema = z.object({
  traderId: z.string().optional(),
  statuses: z.array(z.string()).optional(),
  search: z.string().optional(),
  kappaOnly: z.boolean().optional(),
  map: z.string().optional(),
  playerLevel: z.number().optional(),
  questType: z.string().optional(),
  hideReputationQuests: z.boolean().optional(),
});

export type QuestFilterInput = z.infer<typeof questFilterSchema>;

/**
 * Validate a quest status
 */
export const questStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "completed",
]);

export type QuestStatusType = z.infer<typeof questStatusSchema>;

/**
 * Validate a trader ID
 */
export const traderIdSchema = z.string().min(1, "Trader ID is required");

/**
 * Validate a quest ID
 */
export const questIdSchema = z.string().min(1, "Quest ID is required");

/**
 * Validate a user ID
 */
export const userIdSchema = z.string().min(1, "User ID is required");

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Safely parse quest filters
 */
export function parseQuestFilters(input: unknown): QuestFilterInput {
  return questFilterSchema.parse(input);
}

/**
 * Safely validate a quest status
 */
export function validateQuestStatus(status: unknown): QuestStatusType {
  return questStatusSchema.parse(status);
}

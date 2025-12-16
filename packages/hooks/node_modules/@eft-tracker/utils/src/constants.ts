/**
 * Shared Constants
 * Domain-specific constants used across web and companion apps
 */

export const TRADERS = [
  "Prapor",
  "Therapist",
  "Fence",
  "Skier",
  "Peacekeeper",
  "Mechanic",
  "Ragman",
  "Jaeger",
] as const;

export const QUEST_STATUSES = [
  "locked",
  "available",
  "in_progress",
  "completed",
] as const;

export const QUEST_TYPES = [
  "standard",
  "pvp_zone",
  "reputation",
  "lightkeeper",
  "faction_bear",
  "faction_usec",
  "story",
  "prestige",
] as const;

export const TRADER_COLORS: Record<string, string> = {
  Prapor: "#1f2937",
  Therapist: "#059669",
  Fence: "#7c3aed",
  Skier: "#0891b2",
  Peacekeeper: "#dc2626",
  Mechanic: "#f59e0b",
  Ragman: "#8b5cf6",
  Jaeger: "#14b8a6",
};

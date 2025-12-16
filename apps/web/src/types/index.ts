/**
 * Re-export types from shared packages for backward compatibility
 * This allows the web app to import from @/types while internally using
 * the monorepo shared types package
 */

// Re-export quest domain types from shared package
export type {
  QuestStatus,
  QuestType,
  Trader,
  Objective,
  RequirementStatusType,
  QuestDependency,
  QuestDependent,
  Quest,
  QuestProgress,
  QuestWithProgress,
  LevelRange,
  QuestFilters,
  ViewMode,
  QuestNodeData,
  QuestNode,
  QuestEdgeData,
  QuestEdge,
  TraderNodeData,
  TraderNode,
  CrossTraderEdgeData,
  TraderQuestGroup,
} from "@eft-tracker/types";

// Re-export API contract types from shared package
export type {
  LinkRequest,
  LinkResponse,
  CompanionToken,
  ListTokensResponse,
  SyncEvent,
  SyncRequest,
  SyncResponse,
  StatusResponse,
  QuestInfo,
  QuestsResponse,
  CompanionAPI,
  ProgressUpdateRequest,
  ProgressUpdateResponse,
  RegisterRequest,
  RegisterResponse,
} from "@eft-tracker/types";

export { linkSchema, syncEventSchema, syncSchema, progressUpdateSchema, registerSchema } from "@eft-tracker/types";

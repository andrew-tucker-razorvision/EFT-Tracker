import { invoke } from "@tauri-apps/api/core";

// Types
export interface SyncStatus {
  hasToken: boolean;
  pendingCount: number;
  totalSynced: number;
  totalErrors: number;
  lastSync: string | null;
}

export interface TokenValidation {
  valid: boolean;
  userId?: string;
  userName?: string;
  playerLevel?: number;
  deviceName?: string;
  gameMode?: string;
  stats?: {
    completed: number;
    inProgress: number;
    available: number;
    locked: number;
  };
  error?: string;
}

export interface SyncResult {
  synced: number;
  errors: Array<{ questId: string; error: string }>;
  unlockedQuests: string[];
  pendingCount: number;
}

export interface QuestEvent {
  questId: string;
  status: "STARTED" | "FINISHED" | "FAILED";
  timestamp: string;
  logFile: string;
}

// Tauri commands
export async function getEftPath(): Promise<string | null> {
  return invoke<string | null>("get_eft_path");
}

export async function setEftPath(path: string): Promise<boolean> {
  return invoke<boolean>("set_eft_path", { path });
}

export async function startWatching(): Promise<void> {
  return invoke("start_watching");
}

export async function stopWatching(): Promise<void> {
  return invoke("stop_watching");
}

export async function isWatching(): Promise<boolean> {
  return invoke<boolean>("is_watching");
}

export async function setCompanionToken(token: string): Promise<void> {
  return invoke("set_companion_token", { token });
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return invoke<SyncStatus>("get_sync_status");
}

export async function validateToken(token: string): Promise<TokenValidation> {
  return invoke<TokenValidation>("validate_token", { token });
}

export async function syncNow(): Promise<SyncResult> {
  return invoke<SyncResult>("sync_now");
}

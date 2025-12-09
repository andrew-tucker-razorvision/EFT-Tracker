//! Sync Manager
//!
//! Handles queuing and syncing quest events to the EFT Tracker API.
//! Supports offline operation with local queue persistence.

use chrono::{DateTime, Utc};
use log::{error, info, warn};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::VecDeque;

use crate::log_watcher::QuestEvent;

/// Maximum events to queue before forcing a sync
const MAX_QUEUE_SIZE: usize = 100;

/// Sync event for API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEvent {
    #[serde(rename = "questId")]
    pub quest_id: String,
    pub status: String,
    pub timestamp: String,
}

impl From<QuestEvent> for SyncEvent {
    fn from(event: QuestEvent) -> Self {
        Self {
            quest_id: event.quest_id,
            status: event.status.as_str().to_string(),
            timestamp: event.timestamp.to_rfc3339(),
        }
    }
}

/// Sync result from API
#[derive(Debug, Deserialize)]
pub struct SyncResult {
    pub synced: usize,
    pub errors: Vec<SyncError>,
    #[serde(rename = "unlockedQuests")]
    pub unlocked_quests: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SyncError {
    #[serde(rename = "questId")]
    pub quest_id: String,
    pub error: String,
}

/// Token validation response
#[derive(Debug, Deserialize)]
pub struct TokenValidationResponse {
    pub valid: bool,
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
    #[serde(rename = "userName")]
    pub user_name: Option<String>,
    #[serde(rename = "playerLevel")]
    pub player_level: Option<i32>,
    #[serde(rename = "deviceName")]
    pub device_name: Option<String>,
    #[serde(rename = "gameMode")]
    pub game_mode: Option<String>,
    pub stats: Option<UserStats>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UserStats {
    pub completed: i32,
    #[serde(rename = "inProgress")]
    pub in_progress: i32,
    pub available: i32,
    pub locked: i32,
}

pub struct SyncManager {
    api_base: String,
    token: Option<String>,
    client: Client,
    event_queue: VecDeque<SyncEvent>,
    last_sync: Option<DateTime<Utc>>,
    total_synced: usize,
    total_errors: usize,
}

impl SyncManager {
    pub fn new(api_base: String) -> Self {
        Self {
            api_base,
            token: None,
            client: Client::new(),
            event_queue: VecDeque::new(),
            last_sync: None,
            total_synced: 0,
            total_errors: 0,
        }
    }

    /// Set the companion token
    pub fn set_token(&mut self, token: String) {
        self.token = Some(token);
    }

    /// Get current token
    pub fn get_token(&self) -> Option<&String> {
        self.token.as_ref()
    }

    /// Check if a token is set
    pub fn has_token(&self) -> bool {
        self.token.is_some()
    }

    /// Queue an event for syncing
    pub async fn queue_event(&mut self, event: QuestEvent) -> Result<(), String> {
        let sync_event: SyncEvent = event.into();
        self.event_queue.push_back(sync_event);

        // Auto-sync if queue is getting large
        if self.event_queue.len() >= MAX_QUEUE_SIZE {
            let _ = self.sync_pending().await;
        }

        Ok(())
    }

    /// Get number of pending events
    pub fn pending_count(&self) -> usize {
        self.event_queue.len()
    }

    /// Sync pending events to the server
    pub async fn sync_pending(&mut self) -> Result<Value, String> {
        if self.event_queue.is_empty() {
            return Ok(json!({
                "synced": 0,
                "message": "No pending events"
            }));
        }

        let token = self.token.as_ref()
            .ok_or("No companion token configured")?;

        // Collect events to sync (up to 100)
        let events: Vec<SyncEvent> = self.event_queue
            .iter()
            .take(100)
            .cloned()
            .collect();

        let response = self.client
            .post(format!("{}/api/companion/sync", self.api_base))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "events": events,
                "deviceInfo": {
                    "version": env!("CARGO_PKG_VERSION"),
                    "os": "windows"
                }
            }))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        let status = response.status();

        if status.is_success() {
            let result: SyncResult = response.json().await
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            // Remove synced events from queue
            let synced_count = result.synced;
            for _ in 0..synced_count {
                self.event_queue.pop_front();
            }

            self.total_synced += synced_count;
            self.total_errors += result.errors.len();
            self.last_sync = Some(Utc::now());

            info!("Synced {} events, {} errors", synced_count, result.errors.len());

            Ok(json!({
                "synced": synced_count,
                "errors": result.errors,
                "unlockedQuests": result.unlocked_quests,
                "pendingCount": self.event_queue.len()
            }))
        } else if status.as_u16() == 401 {
            Err("Invalid or expired companion token".to_string())
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Sync failed with status {}: {}", status, error_text);
            Err(format!("Sync failed: {} - {}", status, error_text))
        }
    }

    /// Validate a companion token with the server
    pub async fn validate_token(&self, token: &str) -> Result<Value, String> {
        let response = self.client
            .get(format!("{}/api/companion/status", self.api_base))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        let status = response.status();

        if status.is_success() {
            let validation: TokenValidationResponse = response.json().await
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            Ok(json!({
                "valid": validation.valid,
                "userId": validation.user_id,
                "userName": validation.user_name,
                "playerLevel": validation.player_level,
                "deviceName": validation.device_name,
                "gameMode": validation.game_mode,
                "stats": validation.stats
            }))
        } else {
            let error_text = response.text().await.unwrap_or_default();
            Ok(json!({
                "valid": false,
                "error": error_text
            }))
        }
    }

    /// Get current sync status
    pub fn get_status(&self) -> Value {
        json!({
            "hasToken": self.has_token(),
            "pendingCount": self.event_queue.len(),
            "totalSynced": self.total_synced,
            "totalErrors": self.total_errors,
            "lastSync": self.last_sync.map(|t| t.to_rfc3339())
        })
    }

    /// Clear the event queue
    pub fn clear_queue(&mut self) {
        self.event_queue.clear();
    }

    /// Export queue for persistence
    pub fn export_queue(&self) -> Vec<SyncEvent> {
        self.event_queue.iter().cloned().collect()
    }

    /// Import queue from persistence
    pub fn import_queue(&mut self, events: Vec<SyncEvent>) {
        for event in events {
            self.event_queue.push_back(event);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_manager_creation() {
        let manager = SyncManager::new("https://test.com".to_string());
        assert!(!manager.has_token());
        assert_eq!(manager.pending_count(), 0);
    }

    #[test]
    fn test_token_management() {
        let mut manager = SyncManager::new("https://test.com".to_string());
        assert!(!manager.has_token());

        manager.set_token("cmp_test123".to_string());
        assert!(manager.has_token());
        assert_eq!(manager.get_token(), Some(&"cmp_test123".to_string()));
    }

    #[test]
    fn test_sync_event_conversion() {
        use crate::log_watcher::QuestEventStatus;

        let quest_event = QuestEvent {
            quest_id: "test_quest".to_string(),
            status: QuestEventStatus::Started,
            timestamp: Utc::now(),
            log_file: "test.log".to_string(),
        };

        let sync_event: SyncEvent = quest_event.into();
        assert_eq!(sync_event.quest_id, "test_quest");
        assert_eq!(sync_event.status, "STARTED");
    }
}

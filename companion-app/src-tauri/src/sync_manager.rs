//! Sync Manager
//!
//! Handles queuing and syncing quest events to the EFT Tracker API.
//! Supports offline operation with local queue persistence.

use chrono::{DateTime, Utc};
use log::{error, info};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::VecDeque;

use crate::log_watcher::QuestEvent;

/// Maximum events to queue before forcing a sync
const MAX_QUEUE_SIZE: usize = 100;

/// Delay before auto-sync in seconds (allows batching multiple rapid events)
const AUTO_SYNC_DELAY_SECS: u64 = 5;

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
#[derive(Debug, Deserialize, Serialize)]
pub struct SyncResult {
    pub synced: usize,
    pub errors: Vec<SyncError>,
    #[serde(rename = "unlockedQuests")]
    pub unlocked_quests: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SyncError {
    #[serde(rename = "questId")]
    pub quest_id: String,
    pub error: String,
}

/// Token validation response
#[derive(Debug, Deserialize, Serialize)]
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
    /// Returns true if auto-sync should be triggered
    pub async fn queue_event(&mut self, event: QuestEvent) -> Result<bool, String> {
        let sync_event: SyncEvent = event.into();
        self.event_queue.push_back(sync_event);

        // Auto-sync if queue is getting large
        if self.event_queue.len() >= MAX_QUEUE_SIZE {
            let _ = self.sync_pending().await;
            return Ok(false); // Already synced
        }

        // Signal that auto-sync should be scheduled
        Ok(self.has_token())
    }

    /// Get the auto-sync delay in seconds
    pub fn get_auto_sync_delay(&self) -> u64 {
        AUTO_SYNC_DELAY_SECS
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

        let token = self.token.as_ref().ok_or("No companion token configured")?;

        // Collect events to sync (up to 100)
        let events: Vec<SyncEvent> = self.event_queue.iter().take(100).cloned().collect();

        let response = self
            .client
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
            let result: SyncResult = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            // Remove synced events from queue
            let synced_count = result.synced;
            for _ in 0..synced_count {
                self.event_queue.pop_front();
            }

            self.total_synced += synced_count;
            self.total_errors += result.errors.len();
            self.last_sync = Some(Utc::now());

            info!(
                "Synced {} events, {} errors",
                synced_count,
                result.errors.len()
            );

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
        let response = self
            .client
            .get(format!("{}/api/companion/status", self.api_base))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        let status = response.status();

        if status.is_success() {
            let validation: TokenValidationResponse = response
                .json()
                .await
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

    #[test]
    fn test_sync_event_conversion_finished() {
        use crate::log_watcher::QuestEventStatus;

        let quest_event = QuestEvent {
            quest_id: "59ca2eb686f77445a80ed049".to_string(),
            status: QuestEventStatus::Finished,
            timestamp: Utc::now(),
            log_file: "application.log".to_string(),
        };

        let sync_event: SyncEvent = quest_event.into();
        assert_eq!(sync_event.quest_id, "59ca2eb686f77445a80ed049");
        assert_eq!(sync_event.status, "FINISHED");
    }

    #[test]
    fn test_sync_event_conversion_failed() {
        use crate::log_watcher::QuestEventStatus;

        let quest_event = QuestEvent {
            quest_id: "5d4bec3486f7743cac246665".to_string(),
            status: QuestEventStatus::Failed,
            timestamp: Utc::now(),
            log_file: "test.log".to_string(),
        };

        let sync_event: SyncEvent = quest_event.into();
        assert_eq!(sync_event.quest_id, "5d4bec3486f7743cac246665");
        assert_eq!(sync_event.status, "FAILED");
    }

    #[test]
    fn test_get_status_initial() {
        let manager = SyncManager::new("https://test.com".to_string());
        let status = manager.get_status();

        assert_eq!(status["hasToken"], false);
        assert_eq!(status["pendingCount"], 0);
        assert_eq!(status["totalSynced"], 0);
        assert_eq!(status["totalErrors"], 0);
        assert!(status["lastSync"].is_null());
    }

    #[test]
    fn test_get_status_with_token() {
        let mut manager = SyncManager::new("https://test.com".to_string());
        manager.set_token("cmp_test123".to_string());
        let status = manager.get_status();

        assert_eq!(status["hasToken"], true);
    }

    #[test]
    fn test_auto_sync_delay() {
        let manager = SyncManager::new("https://test.com".to_string());
        assert_eq!(manager.get_auto_sync_delay(), AUTO_SYNC_DELAY_SECS);
        assert_eq!(manager.get_auto_sync_delay(), 5); // Should be 5 seconds
    }

    #[test]
    fn test_clear_queue() {
        let mut manager = SyncManager::new("https://test.com".to_string());

        // Add some events directly to the queue
        manager.event_queue.push_back(SyncEvent {
            quest_id: "quest1".to_string(),
            status: "FINISHED".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        });
        manager.event_queue.push_back(SyncEvent {
            quest_id: "quest2".to_string(),
            status: "STARTED".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        });

        assert_eq!(manager.pending_count(), 2);

        manager.clear_queue();
        assert_eq!(manager.pending_count(), 0);
    }

    #[test]
    fn test_export_import_queue() {
        let mut manager = SyncManager::new("https://test.com".to_string());

        // Add events
        manager.event_queue.push_back(SyncEvent {
            quest_id: "quest1".to_string(),
            status: "FINISHED".to_string(),
            timestamp: "2024-01-15T10:30:00Z".to_string(),
        });
        manager.event_queue.push_back(SyncEvent {
            quest_id: "quest2".to_string(),
            status: "STARTED".to_string(),
            timestamp: "2024-01-15T10:31:00Z".to_string(),
        });

        // Export
        let exported = manager.export_queue();
        assert_eq!(exported.len(), 2);
        assert_eq!(exported[0].quest_id, "quest1");
        assert_eq!(exported[1].quest_id, "quest2");

        // Clear and import into new manager
        let mut new_manager = SyncManager::new("https://test.com".to_string());
        new_manager.import_queue(exported);
        assert_eq!(new_manager.pending_count(), 2);
    }

    #[test]
    fn test_sync_event_serialization() {
        let event = SyncEvent {
            quest_id: "59ca2eb686f77445a80ed049".to_string(),
            status: "FINISHED".to_string(),
            timestamp: "2024-01-15T10:30:00Z".to_string(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("questId")); // serde rename
        assert!(json.contains("59ca2eb686f77445a80ed049"));
        assert!(json.contains("FINISHED"));

        let deserialized: SyncEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.quest_id, event.quest_id);
        assert_eq!(deserialized.status, event.status);
    }

    #[test]
    fn test_sync_result_deserialization() {
        let json = r#"{
            "synced": 5,
            "errors": [],
            "unlockedQuests": ["quest1", "quest2"]
        }"#;

        let result: SyncResult = serde_json::from_str(json).unwrap();
        assert_eq!(result.synced, 5);
        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.unlocked_quests.len(), 2);
    }

    #[test]
    fn test_sync_result_with_errors() {
        let json = r#"{
            "synced": 3,
            "errors": [{"questId": "q1", "error": "Quest not found"}],
            "unlockedQuests": []
        }"#;

        let result: SyncResult = serde_json::from_str(json).unwrap();
        assert_eq!(result.synced, 3);
        assert_eq!(result.errors.len(), 1);
        assert_eq!(result.errors[0].quest_id, "q1");
        assert_eq!(result.errors[0].error, "Quest not found");
    }

    #[test]
    fn test_token_validation_response_valid() {
        let json = r#"{
            "valid": true,
            "userId": "user123",
            "userName": "TestUser",
            "playerLevel": 35,
            "deviceName": "Gaming PC",
            "gameMode": "PVE",
            "stats": {
                "completed": 50,
                "inProgress": 10,
                "available": 20,
                "locked": 30
            }
        }"#;

        let response: TokenValidationResponse = serde_json::from_str(json).unwrap();
        assert!(response.valid);
        assert_eq!(response.user_name, Some("TestUser".to_string()));
        assert_eq!(response.player_level, Some(35));
        assert!(response.stats.is_some());
        let stats = response.stats.unwrap();
        assert_eq!(stats.completed, 50);
        assert_eq!(stats.in_progress, 10);
    }

    #[test]
    fn test_token_validation_response_invalid() {
        let json = r#"{
            "valid": false,
            "error": "Token expired"
        }"#;

        let response: TokenValidationResponse = serde_json::from_str(json).unwrap();
        assert!(!response.valid);
        assert_eq!(response.error, Some("Token expired".to_string()));
        assert!(response.user_id.is_none());
    }

    #[tokio::test]
    async fn test_queue_event_without_token() {
        use crate::log_watcher::QuestEventStatus;

        let mut manager = SyncManager::new("https://test.com".to_string());
        // Don't set a token

        let event = QuestEvent {
            quest_id: "test_quest".to_string(),
            status: QuestEventStatus::Finished,
            timestamp: Utc::now(),
            log_file: "test.log".to_string(),
        };

        let result = manager.queue_event(event).await;
        assert!(result.is_ok());
        // Should not trigger auto-sync without token
        assert_eq!(result.unwrap(), false);
        assert_eq!(manager.pending_count(), 1);
    }

    #[tokio::test]
    async fn test_queue_event_with_token() {
        use crate::log_watcher::QuestEventStatus;

        let mut manager = SyncManager::new("https://test.com".to_string());
        manager.set_token("cmp_test123".to_string());

        let event = QuestEvent {
            quest_id: "test_quest".to_string(),
            status: QuestEventStatus::Finished,
            timestamp: Utc::now(),
            log_file: "test.log".to_string(),
        };

        let result = manager.queue_event(event).await;
        assert!(result.is_ok());
        // Should trigger auto-sync with token
        assert_eq!(result.unwrap(), true);
        assert_eq!(manager.pending_count(), 1);
    }

    #[tokio::test]
    async fn test_sync_pending_empty() {
        let mut manager = SyncManager::new("https://test.com".to_string());
        manager.set_token("cmp_test123".to_string());

        let result = manager.sync_pending().await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["synced"], 0);
        assert_eq!(value["message"], "No pending events");
    }

    #[tokio::test]
    async fn test_sync_pending_no_token() {
        let mut manager = SyncManager::new("https://test.com".to_string());
        // Add an event but no token
        manager.event_queue.push_back(SyncEvent {
            quest_id: "quest1".to_string(),
            status: "FINISHED".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        });

        let result = manager.sync_pending().await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("No companion token"));
    }
}

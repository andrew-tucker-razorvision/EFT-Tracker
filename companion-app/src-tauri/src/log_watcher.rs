//! EFT Log File Watcher
//!
//! Watches the EFT Logs directory for changes and parses quest events.
//! Uses a polling approach (5-second intervals) since EFT may have the files locked.

use chrono::{DateTime, Utc};
use log::{debug, info, warn};
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Quest event status as reported in EFT logs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QuestEventStatus {
    Started,
    Finished,
    Failed,
}

impl QuestEventStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            QuestEventStatus::Started => "STARTED",
            QuestEventStatus::Finished => "FINISHED",
            QuestEventStatus::Failed => "FAILED",
        }
    }
}

/// A quest event extracted from EFT logs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestEvent {
    pub quest_id: String,
    pub status: QuestEventStatus,
    pub timestamp: DateTime<Utc>,
    pub log_file: String,
}

/// Log file state for tracking read position
struct LogFileState {
    #[allow(dead_code)]
    path: PathBuf,
    position: u64,
    last_modified: std::time::SystemTime,
}

pub struct LogWatcher {
    logs_path: String,
    _watcher: RecommendedWatcher,
    stop_flag: Arc<Mutex<bool>>,
    file_states: Arc<Mutex<HashMap<PathBuf, LogFileState>>>,
}

impl LogWatcher {
    /// Create a new log watcher for the given logs directory
    pub fn new<F>(logs_path: String, callback: F) -> Result<Self, Box<dyn std::error::Error>>
    where
        F: Fn(QuestEvent) + Send + Sync + 'static,
    {
        let (tx, rx) = channel();
        let stop_flag = Arc::new(Mutex::new(false));
        let file_states: Arc<Mutex<HashMap<PathBuf, LogFileState>>> =
            Arc::new(Mutex::new(HashMap::new()));

        // Create file watcher
        let watcher = RecommendedWatcher::new(
            move |res| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            Config::default().with_poll_interval(Duration::from_secs(5)),
        )?;

        let logs_path_clone = logs_path.clone();
        let stop_flag_clone = stop_flag.clone();
        let file_states_clone = file_states.clone();
        let callback = Arc::new(callback);

        // Start the watcher thread
        thread::spawn(move || {
            Self::watch_loop(
                logs_path_clone,
                rx,
                stop_flag_clone,
                file_states_clone,
                callback,
            );
        });

        let mut watcher_instance = Self {
            logs_path: logs_path.clone(),
            _watcher: watcher,
            stop_flag,
            file_states,
        };

        // Start watching the logs directory
        watcher_instance
            ._watcher
            .watch(Path::new(&logs_path), RecursiveMode::NonRecursive)?;

        // Initial scan of existing log files
        watcher_instance.initial_scan()?;

        info!("Started watching logs directory: {}", logs_path);
        Ok(watcher_instance)
    }

    /// Initial scan of existing log files to find the latest one
    fn initial_scan(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let logs_dir = Path::new(&self.logs_path);
        if !logs_dir.exists() {
            return Ok(());
        }

        // Find the most recent log file
        let mut latest_file: Option<(PathBuf, std::time::SystemTime)> = None;

        for entry in fs::read_dir(logs_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map(|e| e == "log").unwrap_or(false) {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        match &latest_file {
                            None => latest_file = Some((path, modified)),
                            Some((_, latest_time)) if modified > *latest_time => {
                                latest_file = Some((path, modified));
                            }
                            _ => {}
                        }
                    }
                }
            }
        }

        // Set up state for the latest file (seek to end to only catch new events)
        if let Some((path, modified)) = latest_file {
            if let Ok(file) = File::open(&path) {
                let size = file.metadata().map(|m| m.len()).unwrap_or(0);

                let mut states = self.file_states.lock().unwrap();
                states.insert(
                    path.clone(),
                    LogFileState {
                        path,
                        position: size, // Start at end to only catch new events
                        last_modified: modified,
                    },
                );
            }
        }

        Ok(())
    }

    /// Main watch loop that processes file change events
    fn watch_loop<F>(
        logs_path: String,
        rx: std::sync::mpsc::Receiver<notify::Event>,
        stop_flag: Arc<Mutex<bool>>,
        file_states: Arc<Mutex<HashMap<PathBuf, LogFileState>>>,
        callback: Arc<F>,
    ) where
        F: Fn(QuestEvent) + Send + Sync + 'static,
    {
        // Regex patterns for parsing quest events
        // Pattern: "Got notification | ChatMessageReceived" followed by JSON
        let notification_pattern = Regex::new(r"Got notification \| ChatMessageReceived").unwrap();

        // Pattern to extract quest info from the notification JSON
        // Actual EFT log format:
        //   "text": "quest started",
        //   "templateId": "5d4bec3486f7743cac246665 successMessageText",
        // The quest ID is the first part before " successMessageText"
        // Note: Using [\s\S]*? instead of .*? to match across newlines
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();

        // Alternative pattern if templateId comes before text
        let quest_pattern_alt = Regex::new(
            r#""templateId"\s*:\s*"([a-f0-9]{24})[\s\S]*?"text"\s*:\s*"quest (started|finished|failed)""#,
        )
        .unwrap();

        loop {
            // Check stop flag
            if *stop_flag.lock().unwrap() {
                info!("Log watcher stopping");
                break;
            }

            // Process events with timeout
            match rx.recv_timeout(Duration::from_secs(1)) {
                Ok(event) => {
                    for path in event.paths {
                        if path.extension().map(|e| e == "log").unwrap_or(false) {
                            Self::process_log_file(
                                &path,
                                &file_states,
                                &notification_pattern,
                                &quest_pattern,
                                &quest_pattern_alt,
                                &callback,
                            );
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Periodic check - scan for new files
                    let logs_dir = Path::new(&logs_path);
                    if logs_dir.exists() {
                        if let Ok(entries) = fs::read_dir(logs_dir) {
                            for entry in entries.flatten() {
                                let path = entry.path();
                                if path.extension().map(|e| e == "log").unwrap_or(false) {
                                    Self::process_log_file(
                                        &path,
                                        &file_states,
                                        &notification_pattern,
                                        &quest_pattern,
                                        &quest_pattern_alt,
                                        &callback,
                                    );
                                }
                            }
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                    warn!("File watcher channel disconnected");
                    break;
                }
            }
        }
    }

    /// Process a single log file for quest events
    fn process_log_file<F>(
        path: &Path,
        file_states: &Arc<Mutex<HashMap<PathBuf, LogFileState>>>,
        notification_pattern: &Regex,
        quest_pattern: &Regex,
        quest_pattern_alt: &Regex,
        callback: &Arc<F>,
    ) where
        F: Fn(QuestEvent) + Send + Sync + 'static,
    {
        let file = match File::open(path) {
            Ok(f) => f,
            Err(e) => {
                debug!("Could not open log file {:?}: {}", path, e);
                return;
            }
        };

        let metadata = match file.metadata() {
            Ok(m) => m,
            Err(_) => return,
        };

        let modified = metadata.modified().unwrap_or(std::time::UNIX_EPOCH);
        let file_size = metadata.len();

        // Get or create file state
        let mut states = file_states.lock().unwrap();
        let state = states
            .entry(path.to_path_buf())
            .or_insert_with(|| LogFileState {
                path: path.to_path_buf(),
                position: 0,
                last_modified: modified,
            });

        // Skip if file hasn't changed
        if state.position >= file_size {
            return;
        }

        // Read new content
        let mut reader = BufReader::new(file);
        if reader.seek(SeekFrom::Start(state.position)).is_err() {
            return;
        }

        let mut line_buffer = String::new();
        let mut notification_context = String::new();
        let mut in_notification = false;

        while let Ok(bytes_read) = reader.read_line(&mut line_buffer) {
            if bytes_read == 0 {
                break;
            }

            // Check for notification start
            if notification_pattern.is_match(&line_buffer) {
                in_notification = true;
                notification_context = line_buffer.clone();
            } else if in_notification {
                // Continue collecting context for multi-line notifications
                notification_context.push_str(&line_buffer);

                // Try to parse quest event from accumulated context
                if let Some(event) = Self::parse_quest_event(
                    &notification_context,
                    quest_pattern,
                    quest_pattern_alt,
                    path,
                ) {
                    info!("Detected quest event: {:?}", event);
                    callback(event);
                    in_notification = false;
                    notification_context.clear();
                }

                // Limit context size to prevent memory issues
                if notification_context.len() > 10000 {
                    in_notification = false;
                    notification_context.clear();
                }
            }

            line_buffer.clear();
        }

        // Update position
        state.position = reader.stream_position().unwrap_or(file_size);
        state.last_modified = modified;
    }

    /// Parse a quest event from log content
    fn parse_quest_event(
        content: &str,
        quest_pattern: &Regex,
        quest_pattern_alt: &Regex,
        log_path: &Path,
    ) -> Option<QuestEvent> {
        // Try primary pattern: "text": "quest started" ... "templateId": "<quest_id>"
        if let Some(caps) = quest_pattern.captures(content) {
            let status_str = caps.get(1)?.as_str();
            let quest_id = caps.get(2)?.as_str().to_string();
            let status = Self::parse_status(status_str)?;

            return Some(QuestEvent {
                quest_id,
                status,
                timestamp: Utc::now(),
                log_file: log_path.file_name()?.to_string_lossy().to_string(),
            });
        }

        // Try alternative pattern: "templateId": "<quest_id>" ... "text": "quest started"
        if let Some(caps) = quest_pattern_alt.captures(content) {
            let quest_id = caps.get(1)?.as_str().to_string();
            let status_str = caps.get(2)?.as_str();
            let status = Self::parse_status(status_str)?;

            return Some(QuestEvent {
                quest_id,
                status,
                timestamp: Utc::now(),
                log_file: log_path.file_name()?.to_string_lossy().to_string(),
            });
        }

        None
    }

    /// Parse status string to enum
    fn parse_status(status: &str) -> Option<QuestEventStatus> {
        match status {
            "started" => Some(QuestEventStatus::Started),
            "finished" => Some(QuestEventStatus::Finished),
            "failed" => Some(QuestEventStatus::Failed),
            _ => None,
        }
    }
}

impl Drop for LogWatcher {
    fn drop(&mut self) {
        *self.stop_flag.lock().unwrap() = true;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_status_parsing() {
        assert_eq!(
            LogWatcher::parse_status("started"),
            Some(QuestEventStatus::Started)
        );
        assert_eq!(
            LogWatcher::parse_status("finished"),
            Some(QuestEventStatus::Finished)
        );
        assert_eq!(
            LogWatcher::parse_status("failed"),
            Some(QuestEventStatus::Failed)
        );
        assert_eq!(LogWatcher::parse_status("Invalid"), None);
    }

    #[test]
    fn test_status_as_str() {
        assert_eq!(QuestEventStatus::Started.as_str(), "STARTED");
        assert_eq!(QuestEventStatus::Finished.as_str(), "FINISHED");
        assert_eq!(QuestEventStatus::Failed.as_str(), "FAILED");
    }

    #[test]
    fn test_quest_pattern_matching() {
        // Test the regex patterns match actual EFT log format
        // Note: Using [\s\S]*? instead of .*? to match across newlines
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();

        let sample_log = r#"    "text": "quest started",
    "templateId": "5d4bec3486f7743cac246665 successMessageText","#;

        let caps = quest_pattern.captures(sample_log);
        assert!(caps.is_some());
        let caps = caps.unwrap();
        assert_eq!(caps.get(1).unwrap().as_str(), "started");
        assert_eq!(caps.get(2).unwrap().as_str(), "5d4bec3486f7743cac246665");
    }

    #[test]
    fn test_quest_pattern_finished() {
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();

        let sample_log = r#"    "text": "quest finished",
    "templateId": "59ca2eb686f77445a80ed049 successMessageText","#;

        let caps = quest_pattern.captures(sample_log);
        assert!(caps.is_some());
        let caps = caps.unwrap();
        assert_eq!(caps.get(1).unwrap().as_str(), "finished");
        assert_eq!(caps.get(2).unwrap().as_str(), "59ca2eb686f77445a80ed049");
    }

    #[test]
    fn test_quest_pattern_failed() {
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();

        let sample_log = r#"    "text": "quest failed",
    "templateId": "5936d90786f7742b1420ba5b successMessageText","#;

        let caps = quest_pattern.captures(sample_log);
        assert!(caps.is_some());
        let caps = caps.unwrap();
        assert_eq!(caps.get(1).unwrap().as_str(), "failed");
        assert_eq!(caps.get(2).unwrap().as_str(), "5936d90786f7742b1420ba5b");
    }

    #[test]
    fn test_parse_quest_event_primary_pattern() {
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();
        let quest_pattern_alt = Regex::new(
            r#""templateId"\s*:\s*"([a-f0-9]{24})[\s\S]*?"text"\s*:\s*"quest (started|finished|failed)""#,
        )
        .unwrap();

        let log_content = r#"Got notification | ChatMessageReceived {
    "text": "quest finished",
    "templateId": "59ca2eb686f77445a80ed049 successMessageText",
}"#;

        let log_path = PathBuf::from("test.log");
        let event = LogWatcher::parse_quest_event(
            log_content,
            &quest_pattern,
            &quest_pattern_alt,
            &log_path,
        );

        assert!(event.is_some());
        let event = event.unwrap();
        assert_eq!(event.quest_id, "59ca2eb686f77445a80ed049");
        assert_eq!(event.status, QuestEventStatus::Finished);
        assert_eq!(event.log_file, "test.log");
    }

    #[test]
    fn test_parse_quest_event_alternative_pattern() {
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();
        let quest_pattern_alt = Regex::new(
            r#""templateId"\s*:\s*"([a-f0-9]{24})[\s\S]*?"text"\s*:\s*"quest (started|finished|failed)""#,
        )
        .unwrap();

        // Alternative order: templateId before text
        let log_content = r#"Got notification | ChatMessageReceived {
    "templateId": "5d4bec3486f7743cac246665",
    "text": "quest started",
}"#;

        let log_path = PathBuf::from("test.log");
        let event = LogWatcher::parse_quest_event(
            log_content,
            &quest_pattern,
            &quest_pattern_alt,
            &log_path,
        );

        assert!(event.is_some());
        let event = event.unwrap();
        assert_eq!(event.quest_id, "5d4bec3486f7743cac246665");
        assert_eq!(event.status, QuestEventStatus::Started);
    }

    #[test]
    fn test_parse_quest_event_no_match() {
        let quest_pattern = Regex::new(
            r#""text"\s*:\s*"quest (started|finished|failed)"[\s\S]*?"templateId"\s*:\s*"([a-f0-9]{24})"#,
        )
        .unwrap();
        let quest_pattern_alt = Regex::new(
            r#""templateId"\s*:\s*"([a-f0-9]{24})[\s\S]*?"text"\s*:\s*"quest (started|finished|failed)""#,
        )
        .unwrap();

        // Non-quest notification
        let log_content = r#"Got notification | SystemMessage {
    "text": "Server maintenance in 10 minutes",
}"#;

        let log_path = PathBuf::from("test.log");
        let event = LogWatcher::parse_quest_event(
            log_content,
            &quest_pattern,
            &quest_pattern_alt,
            &log_path,
        );

        assert!(event.is_none());
    }

    #[test]
    fn test_notification_pattern() {
        let notification_pattern = Regex::new(r"Got notification \| ChatMessageReceived").unwrap();

        // Should match
        assert!(notification_pattern
            .is_match("2024.01.15 10:30:45|Got notification | ChatMessageReceived {"));
        assert!(notification_pattern.is_match("Got notification | ChatMessageReceived"));

        // Should not match
        assert!(!notification_pattern.is_match("Got notification | SystemMessage"));
        assert!(!notification_pattern.is_match("Regular log line"));
    }

    #[test]
    fn test_quest_id_format() {
        // Quest IDs are 24-character hex strings
        let quest_id_pattern = Regex::new(r"^[a-f0-9]{24}$").unwrap();

        // Valid quest IDs
        assert!(quest_id_pattern.is_match("59ca2eb686f77445a80ed049"));
        assert!(quest_id_pattern.is_match("5d4bec3486f7743cac246665"));
        assert!(quest_id_pattern.is_match("5936d90786f7742b1420ba5b"));

        // Invalid quest IDs
        assert!(!quest_id_pattern.is_match("invalid"));
        assert!(!quest_id_pattern.is_match("59ca2eb686f77445a80ed04")); // 23 chars
        assert!(!quest_id_pattern.is_match("59ca2eb686f77445a80ed0499")); // 25 chars
        assert!(!quest_id_pattern.is_match("59CA2EB686F77445A80ED049")); // uppercase
    }

    #[test]
    fn test_quest_event_serialization() {
        let event = QuestEvent {
            quest_id: "59ca2eb686f77445a80ed049".to_string(),
            status: QuestEventStatus::Finished,
            timestamp: chrono::Utc::now(),
            log_file: "test.log".to_string(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("59ca2eb686f77445a80ed049"));
        assert!(json.contains("Finished"));
        assert!(json.contains("test.log"));

        // Deserialize back
        let deserialized: QuestEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.quest_id, event.quest_id);
        assert_eq!(deserialized.status, event.status);
    }
}

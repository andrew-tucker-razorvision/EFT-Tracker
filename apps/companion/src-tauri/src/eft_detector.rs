//! EFT Installation Detection
//!
//! Detects Escape from Tarkov installation path using:
//! 1. Windows Registry (BSG Launcher stores install path)
//! 2. Custom user-provided path
//! 3. Common installation locations

use log::{info, warn};
use std::path::Path;
use std::sync::RwLock;
use winreg::enums::*;
use winreg::RegKey;

/// Default installation paths to check if registry lookup fails
const DEFAULT_PATHS: &[&str] = &[
    "C:\\Battlestate Games\\Escape from Tarkov",
    "C:\\Battlestate Games\\EFT",
    "D:\\Battlestate Games\\Escape from Tarkov",
    "D:\\Battlestate Games\\EFT",
    "C:\\Games\\Escape from Tarkov",
    "C:\\Games\\EFT",
    "D:\\Games\\Escape from Tarkov",
    "D:\\Games\\EFT",
    "E:\\Battlestate Games\\Escape from Tarkov",
    "E:\\Battlestate Games\\EFT",
];

/// Registry paths where BSG Launcher stores EFT path
const REGISTRY_PATHS: &[(&str, &str)] = &[
    // BSG Launcher stores the install path here
    (
        "SOFTWARE\\Battlestate Games\\EscapeFromTarkov",
        "InstallPath",
    ),
    (
        "SOFTWARE\\WOW6432Node\\Battlestate Games\\EscapeFromTarkov",
        "InstallPath",
    ),
];

pub struct EftDetector {
    detected_path: RwLock<Option<String>>,
    custom_path: RwLock<Option<String>>,
}

impl EftDetector {
    pub fn new() -> Self {
        let detector = Self {
            detected_path: RwLock::new(None),
            custom_path: RwLock::new(None),
        };

        // Attempt to detect on creation
        if let Some(path) = detector.detect_eft_path() {
            info!("Detected EFT installation at: {}", path);
            *detector.detected_path.write().unwrap() = Some(path);
        } else {
            warn!("Could not detect EFT installation");
        }

        detector
    }

    /// Get the EFT path (custom path takes priority over detected)
    pub fn get_eft_path(&self) -> Option<String> {
        // Custom path takes priority
        if let Some(ref custom) = *self.custom_path.read().unwrap() {
            if self.validate_eft_path(custom) {
                return Some(custom.clone());
            }
        }

        // Fall back to detected path
        self.detected_path.read().unwrap().clone()
    }

    /// Set a custom EFT path
    pub fn set_custom_path(&self, path: Option<String>) {
        *self.custom_path.write().unwrap() = path;
    }

    /// Validate that a path contains EFT installation
    pub fn validate_eft_path(&self, path: &str) -> bool {
        let path = Path::new(path);

        // Check for EFT executable
        let exe_path = path.join("EscapeFromTarkov.exe");
        if !exe_path.exists() {
            return false;
        }

        // Logs folder might not exist if game hasn't been run yet, that's ok
        // But the EFT_Data folder should always exist
        let data_path = path.join("EscapeFromTarkov_Data");
        if !data_path.exists() {
            return false;
        }

        true
    }

    /// Detect EFT installation path
    fn detect_eft_path(&self) -> Option<String> {
        // Try registry first
        if let Some(path) = self.detect_from_registry() {
            if self.validate_eft_path(&path) {
                return Some(path);
            }
        }

        // Try common paths
        for &default_path in DEFAULT_PATHS {
            if self.validate_eft_path(default_path) {
                return Some(default_path.to_string());
            }
        }

        None
    }

    /// Try to get EFT path from Windows Registry
    fn detect_from_registry(&self) -> Option<String> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

        for &(reg_path, value_name) in REGISTRY_PATHS {
            if let Ok(key) = hklm.open_subkey(reg_path) {
                if let Ok(path) = key.get_value::<String, _>(value_name) {
                    info!("Found EFT path in registry: {}", path);
                    return Some(path);
                }
            }
        }

        // Also try HKEY_CURRENT_USER
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        for &(reg_path, value_name) in REGISTRY_PATHS {
            if let Ok(key) = hkcu.open_subkey(reg_path) {
                if let Ok(path) = key.get_value::<String, _>(value_name) {
                    info!("Found EFT path in registry (HKCU): {}", path);
                    return Some(path);
                }
            }
        }

        None
    }

    /// Get the logs directory path
    pub fn get_logs_path(&self) -> Option<String> {
        self.get_eft_path()
            .map(|p| Path::new(&p).join("Logs").to_string_lossy().to_string())
    }
}

impl Default for EftDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detector_creation() {
        let detector = EftDetector::new();
        // Path may or may not be found depending on test environment
        let _ = detector.get_eft_path();
    }

    #[test]
    fn test_custom_path_priority() {
        let detector = EftDetector::new();
        detector.set_custom_path(Some("C:\\Test\\Path".to_string()));

        // Custom path won't be returned if it's not valid
        // But it should be stored
        let custom = detector.custom_path.read().unwrap();
        assert_eq!(*custom, Some("C:\\Test\\Path".to_string()));
    }
}

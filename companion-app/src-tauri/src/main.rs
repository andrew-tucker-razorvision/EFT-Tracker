// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod eft_detector;
mod log_watcher;
mod sync_manager;

use log::{error, info};
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use tokio::sync::Mutex;

use crate::eft_detector::EftDetector;
use crate::log_watcher::LogWatcher;
use crate::sync_manager::SyncManager;

/// Application state shared across commands
pub struct AppState {
    pub eft_detector: Arc<EftDetector>,
    pub log_watcher: Arc<Mutex<Option<LogWatcher>>>,
    pub sync_manager: Arc<Mutex<SyncManager>>,
    pub is_watching: Arc<Mutex<bool>>,
}

/// Get detected EFT installation path
#[tauri::command]
async fn get_eft_path(state: State<'_, AppState>) -> Result<Option<String>, String> {
    Ok(state.eft_detector.get_eft_path())
}

/// Set custom EFT path
#[tauri::command]
async fn set_eft_path(state: State<'_, AppState>, path: String) -> Result<bool, String> {
    state.eft_detector.set_custom_path(Some(path.clone()));
    Ok(state.eft_detector.validate_eft_path(&path))
}

/// Start watching EFT logs
#[tauri::command]
async fn start_watching(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut is_watching = state.is_watching.lock().await;
    if *is_watching {
        return Ok(());
    }

    let eft_path = state
        .eft_detector
        .get_eft_path()
        .ok_or("EFT installation not found")?;

    let logs_path = std::path::Path::new(&eft_path).join("Logs");
    if !logs_path.exists() {
        return Err("EFT Logs directory not found".to_string());
    }

    let sync_manager = state.sync_manager.clone();
    let app_handle = app.clone();

    let watcher = LogWatcher::new(logs_path.to_string_lossy().to_string(), move |event| {
        let sync_manager = sync_manager.clone();
        let app_handle = app_handle.clone();

        // Use tauri's async runtime to spawn the task
        // This avoids the "no reactor running" panic when called from std::thread
        tauri::async_runtime::spawn(async move {
            let should_auto_sync = {
                let mut manager = sync_manager.lock().await;
                match manager.queue_event(event.clone()).await {
                    Ok(should_sync) => should_sync,
                    Err(e) => {
                        error!("Failed to queue event: {}", e);
                        false
                    }
                }
            };

            // Emit event to frontend
            let _ = app_handle.emit("quest-event", &event);

            // Auto-sync after a short delay to batch rapid events
            if should_auto_sync {
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;

                let mut manager = sync_manager.lock().await;
                if manager.pending_count() > 0 {
                    info!("Auto-syncing {} pending events", manager.pending_count());
                    match manager.sync_pending().await {
                        Ok(result) => {
                            let _ = app_handle.emit("sync-complete", &result);
                            info!("Auto-sync complete: {:?}", result);
                        }
                        Err(e) => {
                            error!("Auto-sync failed: {}", e);
                            let _ = app_handle.emit("sync-error", &e);
                        }
                    }
                }
            }
        });
    })
    .map_err(|e| e.to_string())?;

    let mut log_watcher = state.log_watcher.lock().await;
    *log_watcher = Some(watcher);
    *is_watching = true;

    // Update tray icon to show watching state
    update_tray_status(&app, true);

    info!("Started watching EFT logs at {:?}", logs_path);
    Ok(())
}

/// Stop watching EFT logs
#[tauri::command]
async fn stop_watching(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut is_watching = state.is_watching.lock().await;
    let mut log_watcher = state.log_watcher.lock().await;

    *log_watcher = None;
    *is_watching = false;

    update_tray_status(&app, false);

    info!("Stopped watching EFT logs");
    Ok(())
}

/// Get current watching status
#[tauri::command]
async fn is_watching(state: State<'_, AppState>) -> Result<bool, String> {
    let is_watching = state.is_watching.lock().await;
    Ok(*is_watching)
}

/// Set companion token for syncing
#[tauri::command]
async fn set_companion_token(state: State<'_, AppState>, token: String) -> Result<(), String> {
    let mut sync_manager = state.sync_manager.lock().await;
    sync_manager.set_token(token);
    Ok(())
}

/// Get sync status
#[tauri::command]
async fn get_sync_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let sync_manager = state.sync_manager.lock().await;
    Ok(sync_manager.get_status())
}

/// Validate companion token with the server
#[tauri::command]
async fn validate_token(
    state: State<'_, AppState>,
    token: String,
) -> Result<serde_json::Value, String> {
    let sync_manager = state.sync_manager.lock().await;
    sync_manager.validate_token(&token).await
}

/// Manually trigger sync of pending events
#[tauri::command]
async fn sync_now(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut sync_manager = state.sync_manager.lock().await;
    sync_manager.sync_pending().await
}

fn update_tray_status(app: &AppHandle, watching: bool) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = if watching {
            "EFT Tracker Companion - Watching"
        } else {
            "EFT Tracker Companion - Idle"
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let start_item = MenuItem::with_id(app, "start", "Start Watching", true, None::<&str>)?;
    let stop_item = MenuItem::with_id(app, "stop", "Stop Watching", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &start_item, &stop_item, &quit_item])?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .tooltip("EFT Tracker Companion")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "start" => {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let state: State<AppState> = app_handle.state();
                    if let Err(e) = start_watching(app_handle.clone(), state).await {
                        error!("Failed to start watching: {}", e);
                    }
                });
            }
            "stop" => {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let state: State<AppState> = app_handle.state();
                    if let Err(e) = stop_watching(app_handle.clone(), state).await {
                        error!("Failed to stop watching: {}", e);
                    }
                });
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

fn main() {
    env_logger::init();

    let eft_detector = Arc::new(EftDetector::new());
    // Use localhost for development, production URL for release builds
    let api_base = if cfg!(debug_assertions) {
        "http://localhost:3000".to_string()
    } else {
        "https://eft-tracker.vercel.app".to_string()
    };
    let sync_manager = Arc::new(Mutex::new(SyncManager::new(api_base)));

    let app_state = AppState {
        eft_detector,
        log_watcher: Arc::new(Mutex::new(None)),
        sync_manager,
        is_watching: Arc::new(Mutex::new(false)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(app_state)
        .setup(|app| {
            setup_tray(app.handle())?;

            // Hide window on close instead of exiting
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_eft_path,
            set_eft_path,
            start_watching,
            stop_watching,
            is_watching,
            set_companion_token,
            get_sync_status,
            validate_token,
            sync_now,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

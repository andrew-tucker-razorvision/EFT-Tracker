import { useState } from "react";
import {
  ArrowLeft,
  FolderSearch,
  FolderOpen,
  Power,
  Bell,
  Volume2,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { enable, disable } from "@tauri-apps/plugin-autostart";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppSettings } from "../hooks/useStore";

interface SettingsPanelProps {
  settings: AppSettings;
  eftPath: string | null;
  onUpdateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => Promise<void>;
  onSetEftPath: (path: string) => Promise<boolean>;
  onBack: () => void;
}

export function SettingsPanel({
  settings,
  eftPath,
  onUpdateSetting,
  onSetEftPath,
  onBack,
}: SettingsPanelProps) {
  const [customPath, setCustomPath] = useState(settings.eftPath || "");
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathValid, setPathValid] = useState(false);
  const [validating, setValidating] = useState(false);

  const handlePathChange = async () => {
    if (!customPath.trim()) {
      setPathError("Please enter a path");
      return;
    }

    setValidating(true);
    const valid = await onSetEftPath(customPath);
    setValidating(false);

    if (valid) {
      setPathValid(true);
      setPathError(null);
    } else {
      setPathError("Invalid EFT installation path");
      setPathValid(false);
    }
  };

  const handlePathBlur = async () => {
    // Only validate on blur if there's a path and it hasn't been validated yet
    if (customPath.trim() && !pathValid && !pathError) {
      await handlePathChange();
    }
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select EFT Installation Folder",
      });
      if (selected && typeof selected === "string") {
        setCustomPath(selected);
        setPathError(null);
        setPathValid(false);
        // Auto-validate after selecting
        const valid = await onSetEftPath(selected);
        if (valid) {
          setPathValid(true);
        } else {
          setPathError("Invalid EFT installation path");
        }
      }
    } catch (error) {
      console.error("Failed to open folder picker:", error);
    }
  };

  const handleAutoStartToggle = async () => {
    try {
      const newValue = !settings.autoStart;
      if (newValue) {
        await enable();
      } else {
        await disable();
      }
      await onUpdateSetting("autoStart", newValue);
    } catch (error) {
      console.error("Failed to toggle autostart:", error);
    }
  };

  return (
    <div className="h-screen bg-tarkov-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-tarkov-surface border-b border-tarkov-border p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-tarkov-border text-tarkov-muted hover:text-tarkov-text"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-tarkov-text">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* EFT Path */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <h2 className="font-medium text-tarkov-text mb-3 flex items-center gap-2">
            <FolderSearch className="w-5 h-5" />
            EFT Installation Path
          </h2>

          <div className="space-y-3">
            {/* Detected path */}
            {eftPath && !settings.eftPath && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-tarkov-success mt-0.5" />
                <div>
                  <p className="text-tarkov-muted">Auto-detected:</p>
                  <p className="text-tarkov-text break-all">{eftPath}</p>
                </div>
              </div>
            )}

            {/* Custom path input */}
            <div>
              <label className="block text-sm text-tarkov-muted mb-1">
                Custom path (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => {
                    setCustomPath(e.target.value);
                    setPathError(null);
                    setPathValid(false);
                  }}
                  onBlur={handlePathBlur}
                  placeholder="C:\Battlestate Games\EFT"
                  className="flex-1 bg-tarkov-bg border border-tarkov-border rounded-lg py-2 px-3 text-tarkov-text placeholder-tarkov-muted/50 focus:outline-none focus:border-tarkov-accent text-sm"
                />
                <button
                  onClick={handleBrowse}
                  disabled={validating}
                  className="p-2 bg-tarkov-border hover:bg-tarkov-muted/30 text-tarkov-text rounded-lg disabled:opacity-50"
                  title="Browse for folder"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePathChange}
                  disabled={validating}
                  className="bg-tarkov-accent hover:bg-tarkov-accent/80 text-tarkov-bg font-medium rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                >
                  {validating ? "..." : "Set"}
                </button>
              </div>
              {pathError && (
                <p className="mt-1 text-xs text-tarkov-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {pathError}
                </p>
              )}
              {pathValid && (
                <p className="mt-1 text-xs text-tarkov-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Path validated successfully
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-start */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Power className="w-5 h-5 text-tarkov-muted" />
              <div>
                <h3 className="font-medium text-tarkov-text">
                  Start with Windows
                </h3>
                <p className="text-sm text-tarkov-muted">
                  Launch companion app when Windows starts
                </p>
              </div>
            </div>
            <button
              onClick={handleAutoStartToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoStart ? "bg-tarkov-success" : "bg-tarkov-border"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoStart ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto-watch */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-tarkov-muted" />
              <div>
                <h3 className="font-medium text-tarkov-text">
                  Auto-start Watching
                </h3>
                <p className="text-sm text-tarkov-muted">
                  Start watching logs automatically when linked
                </p>
              </div>
            </div>
            <button
              onClick={() => onUpdateSetting("autoWatch", !settings.autoWatch)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoWatch ? "bg-tarkov-success" : "bg-tarkov-border"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoWatch ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-tarkov-muted" />
              <div>
                <h3 className="font-medium text-tarkov-text">Notifications</h3>
                <p className="text-sm text-tarkov-muted">
                  Show desktop notifications for quest events
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSetting("notifications", !settings.notifications)
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notifications
                  ? "bg-tarkov-success"
                  : "bg-tarkov-border"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifications ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notification sounds */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-tarkov-muted" />
              <div>
                <h3 className="font-medium text-tarkov-text">
                  Notification Sounds
                </h3>
                <p className="text-sm text-tarkov-muted">
                  Play sound when quest event is detected
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSetting(
                  "notificationSound",
                  !settings.notificationSound
                )
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notificationSound
                  ? "bg-tarkov-success"
                  : "bg-tarkov-border"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notificationSound ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <h2 className="font-medium text-tarkov-text mb-2">About</h2>
          <div className="text-sm text-tarkov-muted space-y-1">
            <p>EFT Tracker Companion v0.1.0</p>
            <p>
              <a
                href="https://github.com/andrew-tucker-razorvision/EFT-Tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tarkov-accent hover:underline"
              >
                GitHub Repository
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

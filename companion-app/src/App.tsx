import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  Play,
  Square,
  Settings,
  Link,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useStore } from "./hooks/useStore";
import {
  getEftPath,
  setEftPath,
  startWatching,
  stopWatching,
  isWatching as checkWatching,
  setCompanionToken,
  getSyncStatus,
  validateToken,
  syncNow,
  type SyncStatus,
  type TokenValidation,
  type QuestEvent,
} from "./lib/tauri";
import { LinkAccount } from "./components/LinkAccount";
import { RecentEvents } from "./components/RecentEvents";
import { SettingsPanel } from "./components/SettingsPanel";

type View = "main" | "link" | "settings";

function App() {
  const { settings, loading: settingsLoading, setSetting } = useStore();

  const [view, setView] = useState<View>("main");
  const [eftPath, setEftPathState] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenValidation | null>(null);
  const [recentEvents, setRecentEvents] = useState<QuestEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      try {
        // Get EFT path
        const path = await getEftPath();
        setEftPathState(path);

        // Check watching state
        const isWatchingNow = await checkWatching();
        setWatching(isWatchingNow);

        // Get sync status
        const status = await getSyncStatus();
        setSyncStatus(status);
      } catch (err) {
        console.error("Init error:", err);
        setError(String(err));
      }
    }
    init();
  }, []);

  // Validate token when settings load
  useEffect(() => {
    async function validateStoredToken() {
      if (settingsLoading || !settings.companionToken) {
        setTokenInfo(null);
        return;
      }

      try {
        await setCompanionToken(settings.companionToken);
        const validation = await validateToken(settings.companionToken);
        setTokenInfo(validation);

        // Auto-start watching if enabled
        if (validation.valid && settings.autoWatch && eftPath && !watching) {
          await handleStartWatching();
        }
      } catch (err) {
        console.error("Token validation error:", err);
      }
    }
    validateStoredToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading, settings.companionToken, settings.autoWatch, eftPath]);

  // Listen for quest events from Rust
  useEffect(() => {
    const unlisten = listen<QuestEvent>("quest-event", (event) => {
      setRecentEvents((prev) => [event.payload, ...prev].slice(0, 50));

      // Play notification sound if enabled
      if (settings.notificationSound) {
        // Browser audio API for notification
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [settings.notificationSound]);

  // Periodic sync status refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getSyncStatus();
        setSyncStatus(status);
      } catch (err) {
        console.error("Status refresh error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartWatching = useCallback(async () => {
    try {
      setError(null);
      await startWatching();
      setWatching(true);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const handleStopWatching = useCallback(async () => {
    try {
      await stopWatching();
      setWatching(false);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      setError(null);
      const result = await syncNow();
      const status = await getSyncStatus();
      setSyncStatus(status);

      if (result.errors.length > 0) {
        setError(`Synced ${result.synced}, ${result.errors.length} errors`);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const handleUnlink = useCallback(async () => {
    await setSetting("companionToken", null);
    setTokenInfo(null);
    await handleStopWatching();
  }, [setSetting, handleStopWatching]);

  const handleLinkComplete = useCallback(
    async (token: string, validation: TokenValidation) => {
      await setSetting("companionToken", token);
      await setCompanionToken(token);
      setTokenInfo(validation);
      setView("main");
    },
    [setSetting]
  );

  if (settingsLoading) {
    return (
      <div className="h-screen bg-tarkov-bg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-tarkov-accent animate-spin" />
      </div>
    );
  }

  if (view === "link") {
    return (
      <LinkAccount
        onComplete={handleLinkComplete}
        onBack={() => setView("main")}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsPanel
        settings={settings}
        eftPath={eftPath}
        onUpdateSetting={setSetting}
        onSetEftPath={async (path) => {
          const valid = await setEftPath(path);
          if (valid) {
            setEftPathState(path);
            await setSetting("eftPath", path);
          }
          return valid;
        }}
        onBack={() => setView("main")}
      />
    );
  }

  const isLinked = tokenInfo?.valid === true;

  return (
    <div className="h-screen bg-tarkov-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-tarkov-surface border-b border-tarkov-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-tarkov-text">
            EFT Tracker
          </h1>
          <button
            onClick={() => setView("settings")}
            className="p-2 rounded-lg hover:bg-tarkov-border text-tarkov-muted hover:text-tarkov-text"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error banner */}
        {error && (
          <div className="bg-tarkov-error/20 border border-tarkov-error rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-tarkov-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-tarkov-error">{error}</p>
          </div>
        )}

        {/* Connection status */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-tarkov-text">Account</h2>
            {isLinked ? (
              <button
                onClick={handleUnlink}
                className="text-sm text-tarkov-error hover:text-tarkov-error/80 flex items-center gap-1"
              >
                <Unlink className="w-4 h-4" />
                Unlink
              </button>
            ) : (
              <button
                onClick={() => setView("link")}
                className="text-sm text-tarkov-accent hover:text-tarkov-accent/80 flex items-center gap-1"
              >
                <Link className="w-4 h-4" />
                Link Account
              </button>
            )}
          </div>

          {isLinked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-tarkov-success" />
                <span className="text-tarkov-text">{tokenInfo.userName}</span>
                {tokenInfo.playerLevel && (
                  <span className="text-tarkov-muted text-sm">
                    Lvl {tokenInfo.playerLevel}
                  </span>
                )}
              </div>
              {tokenInfo.stats && (
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-tarkov-bg rounded p-2">
                    <div className="text-tarkov-success font-medium">
                      {tokenInfo.stats.completed}
                    </div>
                    <div className="text-tarkov-muted text-xs">Done</div>
                  </div>
                  <div className="bg-tarkov-bg rounded p-2">
                    <div className="text-tarkov-warning font-medium">
                      {tokenInfo.stats.inProgress}
                    </div>
                    <div className="text-tarkov-muted text-xs">Active</div>
                  </div>
                  <div className="bg-tarkov-bg rounded p-2">
                    <div className="text-tarkov-accent font-medium">
                      {tokenInfo.stats.available}
                    </div>
                    <div className="text-tarkov-muted text-xs">Ready</div>
                  </div>
                  <div className="bg-tarkov-bg rounded p-2">
                    <div className="text-tarkov-muted font-medium">
                      {tokenInfo.stats.locked}
                    </div>
                    <div className="text-tarkov-muted text-xs">Locked</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-tarkov-muted text-sm">
              Link your EFT Tracker account to sync quest progress
            </p>
          )}
        </div>

        {/* EFT Installation */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <h2 className="font-medium text-tarkov-text mb-2">
            EFT Installation
          </h2>
          {eftPath ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-tarkov-success" />
              <span className="text-tarkov-muted truncate" title={eftPath}>
                {eftPath}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-tarkov-warning" />
              <span className="text-tarkov-warning">
                EFT installation not found
              </span>
              <button
                onClick={() => setView("settings")}
                className="text-tarkov-accent hover:underline"
              >
                Configure
              </button>
            </div>
          )}
        </div>

        {/* Watching controls */}
        {isLinked && eftPath && (
          <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-tarkov-text">Log Watcher</h2>
              <div className="flex items-center gap-2">
                {watching ? (
                  <span className="flex items-center gap-1 text-sm text-tarkov-success">
                    <span className="w-2 h-2 rounded-full bg-tarkov-success animate-pulse" />
                    Watching
                  </span>
                ) : (
                  <span className="text-sm text-tarkov-muted">Stopped</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {watching ? (
                <button
                  onClick={handleStopWatching}
                  className="flex-1 bg-tarkov-error/20 hover:bg-tarkov-error/30 text-tarkov-error rounded-lg py-2 px-4 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStartWatching}
                  className="flex-1 bg-tarkov-success/20 hover:bg-tarkov-success/30 text-tarkov-success rounded-lg py-2 px-4 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Watching
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sync status */}
        {isLinked && syncStatus && (
          <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-tarkov-text">Sync</h2>
              <button
                onClick={handleSync}
                disabled={syncing || syncStatus.pendingCount === 0}
                className="text-sm text-tarkov-accent hover:text-tarkov-accent/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                />
                Sync Now
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-tarkov-bg rounded p-2">
                <div className="text-tarkov-warning font-medium">
                  {syncStatus.pendingCount}
                </div>
                <div className="text-tarkov-muted text-xs">Pending</div>
              </div>
              <div className="bg-tarkov-bg rounded p-2">
                <div className="text-tarkov-success font-medium">
                  {syncStatus.totalSynced}
                </div>
                <div className="text-tarkov-muted text-xs">Synced</div>
              </div>
              <div className="bg-tarkov-bg rounded p-2">
                <div className="text-tarkov-error font-medium">
                  {syncStatus.totalErrors}
                </div>
                <div className="text-tarkov-muted text-xs">Errors</div>
              </div>
            </div>

            {syncStatus.lastSync && (
              <div className="mt-2 text-xs text-tarkov-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Recent events */}
        {isLinked && recentEvents.length > 0 && (
          <RecentEvents events={recentEvents} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-tarkov-surface border-t border-tarkov-border p-2">
        <div className="flex items-center justify-between text-xs text-tarkov-muted">
          <span>EFT Tracker Companion v0.1.0</span>
          <button
            onClick={() =>
              setSetting("notificationSound", !settings.notificationSound)
            }
            className="p-1 rounded hover:bg-tarkov-border"
            title={settings.notificationSound ? "Mute sounds" : "Unmute sounds"}
          >
            {settings.notificationSound ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;

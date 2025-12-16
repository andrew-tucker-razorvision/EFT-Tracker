import { useState, useEffect, useCallback } from "react";

const CURRENT_VERSION = "0.1.0";
const API_BASE = "https://eft-tracker.vercel.app";
const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

interface VersionInfo {
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  downloadUrl: string | null;
  releaseNotes?: string;
  loading: boolean;
  error: string | null;
}

// Compare semver versions (simple implementation)
function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export function useVersionCheck(): VersionCheckResult & {
  checkNow: () => Promise<void>;
  dismissUpdate: () => void;
} {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkVersion = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/companion/version`);
      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      const data: VersionInfo = await response.json();
      setLatestVersion(data.latestVersion);
      setDownloadUrl(data.downloadUrl);
      setReleaseNotes(data.releaseNotes);
    } catch (err) {
      // Don't show error for version check failures - it's not critical
      console.warn("Version check failed:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial check and periodic checks
  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkVersion]);

  const hasUpdate =
    !dismissed &&
    latestVersion !== null &&
    isNewerVersion(CURRENT_VERSION, latestVersion);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
    // Store dismissed version so we don't keep showing it
    localStorage.setItem("dismissedVersion", latestVersion || "");
  }, [latestVersion]);

  // Check if this version was already dismissed
  useEffect(() => {
    const dismissedVersion = localStorage.getItem("dismissedVersion");
    if (dismissedVersion === latestVersion) {
      setDismissed(true);
    }
  }, [latestVersion]);

  return {
    hasUpdate,
    currentVersion: CURRENT_VERSION,
    latestVersion,
    downloadUrl,
    releaseNotes,
    loading,
    error,
    checkNow: checkVersion,
    dismissUpdate,
  };
}

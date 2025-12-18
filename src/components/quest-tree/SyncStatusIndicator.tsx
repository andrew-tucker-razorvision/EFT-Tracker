"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, Check, Loader2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  lastSynced: Date | null;
  isOnline: boolean;
  isSaving: boolean;
  saveError?: Error | null;
  onRetry?: () => void;
  pendingOfflineCount?: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 5) {
    return "just now";
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function SyncStatusIndicator({
  lastSynced,
  isOnline,
  isSaving,
  saveError,
  onRetry,
  pendingOfflineCount = 0,
}: SyncStatusIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Update relative time every 10 seconds
  useEffect(() => {
    if (!lastSynced) return;

    const updateTime = () => {
      setRelativeTime(formatRelativeTime(lastSynced));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [lastSynced]);

  if (saveError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500">
        <XCircle className="w-3.5 h-3.5" />
        <span>Failed to save</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500">
        <CloudOff className="w-3.5 h-3.5" />
        <span>
          Offline
          {pendingOfflineCount > 0 && ` (${pendingOfflineCount} pending)`}
        </span>
      </div>
    );
  }

  // Show pending count even when online (syncing in progress)
  if (pendingOfflineCount > 0 && !isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {pendingOfflineCount} change{pendingOfflineCount > 1 ? "s" : ""}{" "}
          pending sync
        </span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSynced) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-muted-foreground",
          relativeTime === "just now" && "text-green-500"
        )}
      >
        {relativeTime === "just now" ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Cloud className="w-3.5 h-3.5" />
        )}
        <span>Synced {relativeTime}</span>
      </div>
    );
  }

  return null;
}

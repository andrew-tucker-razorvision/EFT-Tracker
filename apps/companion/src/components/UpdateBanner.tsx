import { Download, X } from "lucide-react";

interface UpdateBannerProps {
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
  onDismiss: () => void;
}

export function UpdateBanner({
  currentVersion,
  latestVersion,
  downloadUrl,
  releaseNotes,
  onDismiss,
}: UpdateBannerProps) {
  return (
    <div className="bg-tarkov-accent/20 border border-tarkov-accent/40 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-tarkov-accent flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-tarkov-text">
            Update Available
          </p>
          <p className="text-xs text-tarkov-muted mt-0.5">
            v{currentVersion} → v{latestVersion}
          </p>
          {releaseNotes && (
            <p className="text-xs text-tarkov-muted mt-1 truncate">
              {releaseNotes}
            </p>
          )}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm text-tarkov-accent hover:underline"
          >
            <Download className="w-3 h-3" />
            Download Update
          </a>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-tarkov-border rounded text-tarkov-muted hover:text-tarkov-text"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

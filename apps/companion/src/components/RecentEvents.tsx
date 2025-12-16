import { CheckCircle, Play, XCircle, Clock } from "lucide-react";
import type { QuestEvent } from "../lib/tauri";
import { useQuestNames } from "../hooks/useQuestNames";

interface RecentEventsProps {
  events: QuestEvent[];
}

function getStatusIcon(status: QuestEvent["status"]) {
  switch (status) {
    case "STARTED":
      return <Play className="w-4 h-4 text-tarkov-warning" />;
    case "FINISHED":
      return <CheckCircle className="w-4 h-4 text-tarkov-success" />;
    case "FAILED":
      return <XCircle className="w-4 h-4 text-tarkov-error" />;
  }
}

function getStatusText(status: QuestEvent["status"]) {
  switch (status) {
    case "STARTED":
      return "Started";
    case "FINISHED":
      return "Completed";
    case "FAILED":
      return "Failed";
  }
}

function getStatusColor(status: QuestEvent["status"]) {
  switch (status) {
    case "STARTED":
      return "text-tarkov-warning";
    case "FINISHED":
      return "text-tarkov-success";
    case "FAILED":
      return "text-tarkov-error";
  }
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RecentEvents({ events }: RecentEventsProps) {
  const { getQuestName, getQuestInfo } = useQuestNames();

  return (
    <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
      <h2 className="font-medium text-tarkov-text mb-3">Recent Events</h2>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {events.map((event, index) => {
          const questInfo = getQuestInfo(event.questId);
          const questName = getQuestName(event.questId);

          return (
            <div
              key={`${event.questId}-${event.timestamp}-${index}`}
              className="flex items-center gap-3 py-2 border-b border-tarkov-border last:border-0"
            >
              {getStatusIcon(event.status)}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm text-tarkov-text truncate"
                  title={questInfo ? `${questName} (${questInfo.trader})` : event.questId}
                >
                  {questName}
                </p>
                <p className={`text-xs ${getStatusColor(event.status)}`}>
                  {getStatusText(event.status)}
                  {questInfo && (
                    <span className="text-tarkov-muted ml-1">
                      ({questInfo.trader})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-tarkov-muted">
                <Clock className="w-3 h-3" />
                {formatTime(event.timestamp)}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="text-sm text-tarkov-muted text-center py-4">
          No events yet. Start a quest in EFT to see events here.
        </p>
      )}
    </div>
  );
}

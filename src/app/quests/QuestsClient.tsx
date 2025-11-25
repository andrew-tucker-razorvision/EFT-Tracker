"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { QuestTree, QuestFilters } from "@/components/quest-tree";
import { useQuests } from "@/hooks/useQuests";
import { useProgress } from "@/hooks/useProgress";
import type { QuestStatus, QuestWithProgress } from "@/types";

// Status cycle map for click handling
const STATUS_CYCLE: Record<QuestStatus, QuestStatus | null> = {
  locked: null, // Can't cycle from locked
  available: "in_progress",
  in_progress: "completed",
  completed: "available", // Reset
};

export function QuestsClient() {
  const { status: sessionStatus } = useSession();
  const { quests, traders, loading, error, filters, setFilters, refetch } =
    useQuests();
  const {
    progress,
    updateStatus,
    unlockedQuests,
    clearUnlocked,
    error: progressError,
  } = useProgress();
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // Merge progress into quests
  const questsWithProgress: QuestWithProgress[] = quests.map((quest) => {
    const userStatus = progress.get(quest.id);
    return {
      ...quest,
      computedStatus: userStatus || quest.computedStatus,
    };
  });

  // Show notification when quests are unlocked
  useEffect(() => {
    if (unlockedQuests.length > 0) {
      // Could add a toast here
      console.log("Quests unlocked:", unlockedQuests);
      clearUnlocked();
      refetch(); // Refresh to show updated statuses
    }
  }, [unlockedQuests, clearUnlocked, refetch]);

  const handleQuestSelect = useCallback((questId: string) => {
    setSelectedQuestId((prev) => (prev === questId ? null : questId));
  }, []);

  const handleStatusChange = useCallback(
    async (questId: string, clickedStatus: QuestStatus) => {
      // Find the quest to get its current status
      const quest = questsWithProgress.find((q) => q.id === questId);
      if (!quest) return;

      const currentStatus = quest.computedStatus;

      // If locked, don't allow status change
      if (currentStatus === "locked") {
        // Could show a tooltip or toast here
        console.log("Quest is locked - complete prerequisites first");
        return;
      }

      // If not authenticated, prompt to login
      if (sessionStatus !== "authenticated") {
        // Could show a modal here
        console.log("Please sign in to track progress");
        return;
      }

      // Get next status in cycle
      const nextStatus = STATUS_CYCLE[currentStatus];
      if (!nextStatus) return;

      const success = await updateStatus(questId, nextStatus);
      if (success) {
        await refetch();
      }
    },
    [questsWithProgress, sessionStatus, updateStatus, refetch]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="text-lg font-medium">Error loading quests</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate progress stats
  const stats = {
    total: questsWithProgress.length,
    completed: questsWithProgress.filter((q) => q.computedStatus === "completed").length,
    inProgress: questsWithProgress.filter((q) => q.computedStatus === "in_progress").length,
    available: questsWithProgress.filter((q) => q.computedStatus === "available").length,
    locked: questsWithProgress.filter((q) => q.computedStatus === "locked").length,
  };

  return (
    <div className="flex-1 flex flex-col">
      {progressError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 text-sm">
          {progressError}
        </div>
      )}
      {/* Progress Summary Bar */}
      <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-6 text-sm">
        <span className="font-medium">Progress:</span>
        <span className="text-green-600">
          {stats.completed} completed
        </span>
        <span className="text-amber-600">
          {stats.inProgress} in progress
        </span>
        <span className="text-blue-600">
          {stats.available} available
        </span>
        <span className="text-gray-500">
          {stats.locked} locked
        </span>
        <span className="ml-auto text-muted-foreground">
          {stats.total} quests total
        </span>
      </div>
      <QuestFilters
        traders={traders}
        filters={filters}
        onFilterChange={setFilters}
      />
      <div className="flex-1 min-h-0">
        {questsWithProgress.length > 0 ? (
          <QuestTree
            quests={questsWithProgress}
            selectedQuestId={selectedQuestId}
            onQuestSelect={handleQuestSelect}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No quests found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

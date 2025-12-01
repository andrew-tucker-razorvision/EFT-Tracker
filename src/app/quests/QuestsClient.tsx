"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { QuestTree, QuestFilters } from "@/components/quest-tree";
import { QuestTreeSkeleton } from "@/components/quest-tree/QuestTreeSkeleton";
import { ViewToggle, LevelTimelineView } from "@/components/quest-views";
import { useQuests } from "@/hooks/useQuests";
import { useProgress } from "@/hooks/useProgress";
import type { QuestStatus, QuestWithProgress, ViewMode } from "@/types";

// Status cycle map for click handling (simplified: available <-> completed)
const STATUS_CYCLE: Record<QuestStatus, QuestStatus | null> = {
  locked: null, // Can't cycle from locked
  available: "completed",
  in_progress: "completed", // Treat in_progress same as available
  completed: "available", // Reset
};

export function QuestsClient() {
  const { status: sessionStatus } = useSession();
  const {
    quests,
    allQuests,
    traders,
    loading,
    error,
    filters,
    setFilters,
    applyFilters,
    hasPendingChanges,
    refetch,
  } = useQuests();
  const {
    progress,
    updateStatus,
    unlockedQuests,
    clearUnlocked,
    error: progressError,
  } = useProgress();
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("trader-lanes");

  // Merge progress into quests
  const questsWithProgress: QuestWithProgress[] = quests.map((quest) => {
    const userStatus = progress.get(quest.id);
    return {
      ...quest,
      computedStatus: userStatus || quest.computedStatus,
    };
  });

  // Merge progress into all quests (for accurate depth calculation)
  const allQuestsWithProgress: QuestWithProgress[] = allQuests.map((quest) => {
    const userStatus = progress.get(quest.id);
    return {
      ...quest,
      computedStatus: userStatus || quest.computedStatus,
    };
  });

  // Show notification when quests are unlocked
  useEffect(() => {
    if (unlockedQuests.length > 0) {
      const count = unlockedQuests.length;
      toast.success(`${count} quest${count > 1 ? "s" : ""} unlocked!`, {
        description: "New quests are now available.",
      });
      clearUnlocked();
      refetch();
    }
  }, [unlockedQuests, clearUnlocked, refetch]);

  // Show error toast when progress error occurs
  useEffect(() => {
    if (progressError) {
      toast.error("Progress Error", { description: progressError });
    }
  }, [progressError]);

  const handleQuestSelect = useCallback((questId: string) => {
    setSelectedQuestId((prev) => (prev === questId ? null : questId));
  }, []);

  const handleStatusChange = useCallback(
    async (questId: string) => {
      const quest = questsWithProgress.find((q) => q.id === questId);
      if (!quest) return;

      const currentStatus = quest.computedStatus;

      // If locked, show info toast
      if (currentStatus === "locked") {
        toast.info("Quest Locked", {
          description: "Complete prerequisite quests first.",
        });
        return;
      }

      // If not authenticated, prompt to login
      if (sessionStatus !== "authenticated") {
        toast.warning("Sign In Required", {
          description: "Please sign in to track your progress.",
          action: {
            label: "Sign In",
            onClick: () => (window.location.href = "/login"),
          },
        });
        return;
      }

      // Get next status in cycle
      const nextStatus = STATUS_CYCLE[currentStatus];
      if (!nextStatus) return;

      const success = await updateStatus(questId, nextStatus);
      if (success) {
        // Show success toast for completed quests
        if (nextStatus === "completed") {
          toast.success("Quest Completed!", {
            description: quest.title,
          });
        }
        await refetch();
      } else {
        toast.error("Failed to Update", {
          description: "Could not update quest status. Please try again.",
        });
      }
    },
    [questsWithProgress, sessionStatus, updateStatus, refetch]
  );

  if (loading) {
    return <QuestTreeSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Error loading quests
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress stats (in_progress counted as available)
  const stats = {
    total: questsWithProgress.length,
    completed: questsWithProgress.filter(
      (q) => q.computedStatus === "completed"
    ).length,
    available: questsWithProgress.filter(
      (q) =>
        q.computedStatus === "available" || q.computedStatus === "in_progress"
    ).length,
    locked: questsWithProgress.filter((q) => q.computedStatus === "locked")
      .length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <QuestFilters
        traders={traders}
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={applyFilters}
        hasPendingChanges={hasPendingChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={{
          completed: stats.completed,
          available: stats.available,
          locked: stats.locked,
        }}
        totalQuests={stats.total}
      />
      <div className="flex-1 min-h-0">
        {questsWithProgress.length > 0 ? (
          viewMode === "trader-lanes" ? (
            <QuestTree
              quests={questsWithProgress}
              allQuests={allQuestsWithProgress}
              traders={traders}
              selectedQuestId={selectedQuestId}
              playerLevel={filters.playerLevel}
              maxColumns={filters.questsPerTree}
              onQuestSelect={handleQuestSelect}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <LevelTimelineView
              quests={questsWithProgress}
              playerLevel={filters.playerLevel}
              onStatusChange={handleStatusChange}
            />
          )
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

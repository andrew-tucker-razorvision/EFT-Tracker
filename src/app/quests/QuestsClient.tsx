"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useStats } from "@/contexts/StatsContext";
import {
  QuestTree,
  QuestFilters,
  SyncStatusIndicator,
} from "@/components/quest-tree";
import { QuestTreeSkeleton } from "@/components/quest-tree/QuestTreeSkeleton";
import { SkipQuestDialog } from "@/components/quest-tree/SkipQuestDialog";
import { LevelTimelineView } from "@/components/quest-views";
import { WelcomeModal } from "@/components/onboarding";
import { useQuests } from "@/hooks/useQuests";
import { useProgress } from "@/hooks/useProgress";
import { getIncompletePrerequisites } from "@/lib/quest-layout";
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
  const { setStats } = useStats();
  const {
    quests,
    allQuests,
    traders,
    loading,
    initialLoading,
    error,
    filters,
    setFilters,
    applyFilters,
    hasPendingChanges,
    refetch,
    hiddenByLevelCount,
  } = useQuests();
  const {
    progress,
    updateStatus,
    unlockedQuests,
    clearUnlocked,
    error: progressError,
    savingQuestIds,
    lastSynced,
    isOnline,
    pendingOfflineCount,
  } = useProgress();
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("trader-lanes");

  // Skip quest dialog state
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipTargetQuest, setSkipTargetQuest] =
    useState<QuestWithProgress | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);

  // Refs for stable callback references (prevents re-renders from invalidating memoization)
  const questsWithProgressRef = useRef<QuestWithProgress[]>([]);
  const sessionStatusRef = useRef(sessionStatus);
  const updateStatusRef = useRef(updateStatus);
  const refetchRef = useRef(refetch);

  // Merge progress into quests (memoized to prevent infinite re-renders)
  // Note: If API says quest is "locked" (unmet dependencies), use that regardless of
  // stored progress. This handles cases where a quest was completed but prereqs were
  // later unchecked.
  const questsWithProgress = useMemo(
    () =>
      quests.map((quest) => {
        // If API determined this quest should be locked due to unmet dependencies,
        // always use that status - don't override with stale progress from the Map
        if (quest.computedStatus === "locked") {
          return {
            ...quest,
            computedStatus: "locked" as const,
          };
        }
        const userStatus = progress.get(quest.id);
        return {
          ...quest,
          computedStatus: userStatus || quest.computedStatus,
        };
      }),
    [quests, progress]
  );

  // Merge progress into all quests (for accurate depth calculation)
  const allQuestsWithProgress = useMemo(
    () =>
      allQuests.map((quest) => {
        // Same logic as above - prioritize API's "locked" status
        if (quest.computedStatus === "locked") {
          return {
            ...quest,
            computedStatus: "locked" as const,
          };
        }
        const userStatus = progress.get(quest.id);
        return {
          ...quest,
          computedStatus: userStatus || quest.computedStatus,
        };
      }),
    [allQuests, progress]
  );

  // Keep refs in sync with current values (for stable callback references)
  useEffect(() => {
    questsWithProgressRef.current = questsWithProgress;
  }, [questsWithProgress]);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    updateStatusRef.current = updateStatus;
  }, [updateStatus]);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

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

  // Check for first-time user and show welcome modal
  useEffect(() => {
    // Only check after initial loading is complete
    if (loading) return;

    const hasSeenWelcome = localStorage.getItem("eft-tracker-onboarding");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [loading]);

  // Handle completing onboarding
  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("eft-tracker-onboarding", "completed");
    setShowWelcome(false);
  }, []);

  const handleQuestSelect = useCallback((questId: string) => {
    setSelectedQuestId((prev) => (prev === questId ? null : questId));
  }, []);

  // Get prerequisites for the skip dialog
  const skipPrerequisites = useMemo(() => {
    if (!skipTargetQuest) return [];
    return getIncompletePrerequisites(
      skipTargetQuest.id,
      allQuestsWithProgress
    );
  }, [skipTargetQuest, allQuestsWithProgress]);

  // Handle confirming the skip (complete all prerequisites)
  const handleSkipConfirm = useCallback(async () => {
    if (!skipTargetQuest || skipPrerequisites.length === 0) return;

    setSkipLoading(true);
    try {
      // Complete all prerequisites in order
      for (const prereq of skipPrerequisites) {
        const success = await updateStatus(prereq.id, "completed");
        if (!success) {
          toast.error("Failed to Update", {
            description: `Could not complete ${prereq.title}. Please try again.`,
          });
          setSkipLoading(false);
          return;
        }
      }

      toast.success(
        `${skipPrerequisites.length} quest${skipPrerequisites.length > 1 ? "s" : ""} completed!`,
        {
          description: `${skipTargetQuest.title} is now available.`,
        }
      );

      setSkipDialogOpen(false);
      setSkipTargetQuest(null);
      await refetch();
    } catch {
      toast.error("Failed to Update", {
        description:
          "Could not complete prerequisite quests. Please try again.",
      });
    } finally {
      setSkipLoading(false);
    }
  }, [skipTargetQuest, skipPrerequisites, updateStatus, refetch]);

  // Stable callback reference using refs - prevents QuestTree useMemo from recalculating
  const handleStatusChange = useCallback(async (questId: string) => {
    const quest = questsWithProgressRef.current.find((q) => q.id === questId);
    if (!quest) return;

    const currentStatus = quest.computedStatus;

    // If locked, open skip dialog instead of showing toast
    if (currentStatus === "locked") {
      // If not authenticated, prompt to login first
      if (sessionStatusRef.current !== "authenticated") {
        toast.warning("Sign In Required", {
          description: "Please sign in to track your progress.",
          action: {
            label: "Sign In",
            onClick: () => (window.location.href = "/login"),
          },
        });
        return;
      }

      // Open the skip quest dialog
      setSkipTargetQuest(quest);
      setSkipDialogOpen(true);
      return;
    }

    // If not authenticated, prompt to login
    if (sessionStatusRef.current !== "authenticated") {
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

    const success = await updateStatusRef.current(questId, nextStatus);
    if (success) {
      // Show success toast for completed quests
      if (nextStatus === "completed") {
        toast.success("Quest Completed!", {
          description: quest.title,
        });
      }
      await refetchRef.current();
    } else {
      toast.error("Failed to Update", {
        description: "Could not update quest status. Please try again.",
      });
    }
  }, []); // Empty deps - uses refs for all values

  // Calculate progress stats (in_progress counted as available)
  // Must be before early returns to follow React hooks rules
  const stats = useMemo(
    () => ({
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
    }),
    [questsWithProgress]
  );

  // Update stats in context for header display
  useEffect(() => {
    if (!loading && !error) {
      setStats(stats);
    }
    return () => setStats(null); // Clear on unmount
  }, [stats, setStats, loading, error]);

  // Only show skeleton on initial page load, not on filter-triggered refetches
  // This prevents QuestFilters from unmounting and causing infinite API loops
  if (initialLoading) {
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

  return (
    <div className="flex-1 flex flex-col">
      <WelcomeModal
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onGetStarted={handleOnboardingComplete}
      />
      <SkipQuestDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        targetQuest={skipTargetQuest}
        prerequisites={skipPrerequisites}
        onConfirm={handleSkipConfirm}
        isLoading={skipLoading}
      />
      <QuestFilters
        traders={traders}
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={applyFilters}
        hasPendingChanges={hasPendingChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hiddenByLevelCount={hiddenByLevelCount}
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
              savingQuestIds={savingQuestIds}
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
      {/* Sync status footer - only show when user is authenticated */}
      {sessionStatus === "authenticated" && (
        <div className="shrink-0 px-4 py-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SyncStatusIndicator
            lastSynced={lastSynced}
            isOnline={isOnline}
            isSaving={savingQuestIds.size > 0}
            pendingOfflineCount={pendingOfflineCount}
          />
        </div>
      )}
    </div>
  );
}

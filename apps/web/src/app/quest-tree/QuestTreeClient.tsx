"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useStats } from "@/contexts/StatsContext";
import { useUserPrefsContext } from "@/providers/UserPrefsProvider";
import {
  QuestTree,
  QuestFilters,
  SyncStatusIndicator,
} from "@/components/quest-tree";
import { QuestTreeSkeleton } from "@/components/quest-tree/QuestTreeSkeleton";
import { SkipQuestDialog } from "@/components/quest-tree/SkipQuestDialog";
import { WelcomeModal } from "@/components/onboarding";
import { QuestDetailModal } from "@/components/quest-detail";
import { CatchUpDialog } from "@/components/catch-up";
import { useQuests } from "@/hooks/useQuests";
import { useProgress } from "@/hooks/useProgress";
import { getIncompletePrerequisites } from "@/lib/quest-layout";
import type { QuestStatus, QuestWithProgress } from "@/types";

// Status cycle map for click handling (simplified: available <-> completed)
const STATUS_CYCLE: Record<QuestStatus, QuestStatus | null> = {
  locked: null, // Can't cycle from locked
  available: "completed",
  in_progress: "completed", // Treat in_progress same as available
  completed: "available", // Reset
};

export function QuestTreeClient() {
  const { status: sessionStatus } = useSession();
  const { setStats } = useStats();
  const { prefs, isLoading: prefsLoading } = useUserPrefsContext();

  // Show loading skeleton while user preferences load (authenticated users only)
  const isInitializing =
    sessionStatus === "loading" ||
    (sessionStatus === "authenticated" && prefsLoading);

  // Compute initial filters using user preferences
  const initialFilters = useMemo(
    () => ({
      playerLevel: prefs?.playerLevel ?? 1,
    }),
    [prefs]
  );

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
  } = useQuests({
    initialFilters,
  });

  // Sync saved preferences when they load (after initial mount)
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!prefs || prefsLoaded.current) return;
    prefsLoaded.current = true;

    // Apply saved preferences to filters
    setFilters({
      playerLevel: prefs.playerLevel ?? 1,
    });

    // Apply filters immediately so the quest list updates
    applyFilters();
  }, [prefs, setFilters, applyFilters]);
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

  // Skip quest dialog state
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipTargetQuest, setSkipTargetQuest] =
    useState<QuestWithProgress | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);

  // Catch-up dialog state
  const [showCatchUp, setShowCatchUp] = useState(false);

  // Quest detail modal state
  const [detailQuest, setDetailQuest] = useState<QuestWithProgress | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Check if detail quest is currently saving
  const isDetailQuestSaving = useMemo(() => {
    return detailQuest ? savingQuestIds.has(detailQuest.id) : false;
  }, [detailQuest, savingQuestIds]);

  // Refs for stable callback references (prevents re-renders from invalidating memoization)
  const questsWithProgressRef = useRef<QuestWithProgress[]>([]);
  const sessionStatusRef = useRef(sessionStatus);
  const updateStatusRef = useRef(updateStatus);
  const refetchRef = useRef(refetch);

  // Merge progress into quests (memoized to prevent infinite re-renders)
  const questsWithProgress = useMemo(
    () =>
      quests.map((quest) => {
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

  // Keep refs in sync with current values
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

  // Handle catch-up from welcome modal
  const handleCatchUpFromWelcome = useCallback(() => {
    localStorage.setItem("eft-tracker-onboarding", "completed");
    setShowWelcome(false);
    setShowCatchUp(true);
  }, []);

  // Handle catch-up completion
  const handleCatchUpComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleQuestSelect = useCallback((questId: string) => {
    setSelectedQuestId((prev) => (prev === questId ? null : questId));
  }, []);

  // Handle opening quest details modal
  const handleQuestDetails = useCallback((questId: string) => {
    const quest = questsWithProgressRef.current.find((q) => q.id === questId);
    if (quest) {
      setDetailQuest(quest);
      setDetailModalOpen(true);
    }
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

  // Stable callback reference using refs
  const handleStatusChange = useCallback(async (questId: string) => {
    const quest = questsWithProgressRef.current.find((q) => q.id === questId);
    if (!quest) return;

    const currentStatus = quest.computedStatus;

    // If locked, open skip dialog instead of showing toast
    if (currentStatus === "locked") {
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
  }, []);

  // Wrapper for modal - reuses parent's handleStatusChange logic
  const handleModalStatusChange = useCallback(
    async (questId: string) => {
      await handleStatusChange(questId);
    },
    [handleStatusChange]
  );

  // Handle objective checkbox toggle from modal
  const handleObjectiveToggle = useCallback(
    async (
      objectiveId: string,
      completed: boolean
    ): Promise<{ questStatusChanged?: boolean; newQuestStatus?: string }> => {
      if (sessionStatusRef.current !== "authenticated") {
        toast.error("Sign in Required", {
          description: "Please sign in to track quest progress.",
        });
        return { questStatusChanged: false };
      }

      try {
        const response = await fetch(`/api/progress/objective/${objectiveId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update objective");
        }

        const data = await response.json();

        // Refetch quests to get updated objective progress
        await refetchRef.current();

        // Show toast if quest status changed
        if (data.quest?.statusChanged) {
          if (data.quest.status === "COMPLETED") {
            toast.success("Quest Completed!", {
              description: `All objectives for ${data.quest.title} are complete.`,
            });
          } else if (data.quest.status === "IN_PROGRESS") {
            toast.info("Quest Started", {
              description: data.quest.title,
            });
          }
        }

        return {
          questStatusChanged: data.quest?.statusChanged ?? false,
          newQuestStatus: data.quest?.status,
        };
      } catch (err) {
        toast.error("Failed to Update Objective", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
        return { questStatusChanged: false };
      }
    },
    []
  );

  // Calculate progress stats
  const stats = useMemo(
    () => ({
      total: questsWithProgress.length,
      completed: questsWithProgress.filter(
        (q) => q.computedStatus === "completed"
      ).length,
      available: questsWithProgress.filter(
        (q) => q.computedStatus === "available"
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
    return () => setStats(null);
  }, [stats, setStats, loading, error]);

  if (initialLoading || isInitializing) {
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
        onCatchUp={handleCatchUpFromWelcome}
      />
      <CatchUpDialog
        open={showCatchUp}
        onOpenChange={setShowCatchUp}
        quests={allQuestsWithProgress}
        onComplete={handleCatchUpComplete}
      />
      <SkipQuestDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        targetQuest={skipTargetQuest}
        prerequisites={skipPrerequisites}
        onConfirm={handleSkipConfirm}
        isLoading={skipLoading}
      />
      <QuestDetailModal
        quest={detailQuest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onStatusChange={handleModalStatusChange}
        onObjectiveToggle={handleObjectiveToggle}
        isSaving={isDetailQuestSaving}
      />
      <QuestFilters
        traders={traders}
        quests={allQuestsWithProgress}
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={applyFilters}
        hasPendingChanges={hasPendingChanges}
      />
      <div className="flex-1 min-h-0">
        {questsWithProgress.length > 0 ? (
          <QuestTree
            quests={questsWithProgress}
            allQuests={allQuestsWithProgress}
            traders={traders}
            selectedQuestId={selectedQuestId}
            playerLevel={filters.playerLevel}
            maxColumns={null}
            savingQuestIds={savingQuestIds}
            onQuestSelect={handleQuestSelect}
            onStatusChange={handleStatusChange}
            onQuestDetails={handleQuestDetails}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No quests found matching your filters.
            </p>
          </div>
        )}
      </div>
      {/* Sync status footer */}
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

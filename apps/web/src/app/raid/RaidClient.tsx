"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useStats } from "@/contexts/StatsContext";
import { SyncStatusIndicator } from "@/components/quest-tree";
import { QuestTreeSkeleton } from "@/components/quest-tree/QuestTreeSkeleton";
import { RaidPlanner } from "@/components/raid-planner";
import { WelcomeModal } from "@/components/onboarding";
import { QuestDetailModal } from "@/components/quest-detail";
import { CatchUpDialog } from "@/components/catch-up";
import { useQuests } from "@/hooks/useQuests";
import { useProgress } from "@/hooks/useProgress";
import type { QuestWithProgress } from "@/types";

export function RaidClient() {
  const { status: sessionStatus } = useSession();
  const { setStats } = useStats();
  const { allQuests, loading, initialLoading, error, refetch } = useQuests();
  const {
    progress,
    unlockedQuests,
    clearUnlocked,
    error: progressError,
    savingQuestIds,
    lastSynced,
    isOnline,
    pendingOfflineCount,
  } = useProgress();

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);

  // Catch-up dialog state
  const [showCatchUp, setShowCatchUp] = useState(false);

  // Quest detail modal state
  const [detailQuest, setDetailQuest] = useState<QuestWithProgress | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Refs for stable callback references
  const allQuestsWithProgressRef = useRef<QuestWithProgress[]>([]);

  // Merge progress into all quests
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

  // Keep refs in sync
  useEffect(() => {
    allQuestsWithProgressRef.current = allQuestsWithProgress;
  }, [allQuestsWithProgress]);

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

  // Check for first-time user - localStorage check on mount is legitimate
  useEffect(() => {
    if (loading) return;

    const hasSeenWelcome = localStorage.getItem("eft-tracker-onboarding");
    if (!hasSeenWelcome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowWelcome(true);
    }
  }, [loading]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("eft-tracker-onboarding", "completed");
    setShowWelcome(false);
  }, []);

  const handleCatchUpFromWelcome = useCallback(() => {
    localStorage.setItem("eft-tracker-onboarding", "completed");
    setShowWelcome(false);
    setShowCatchUp(true);
  }, []);

  const handleCatchUpComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleQuestDetails = useCallback((questId: string) => {
    const quest = allQuestsWithProgressRef.current.find(
      (q) => q.id === questId
    );
    if (quest) {
      setDetailQuest(quest);
      setDetailModalOpen(true);
    }
  }, []);

  // Calculate progress stats
  const stats = useMemo(
    () => ({
      total: allQuestsWithProgress.length,
      completed: allQuestsWithProgress.filter(
        (q) => q.computedStatus === "completed"
      ).length,
      available: allQuestsWithProgress.filter(
        (q) => q.computedStatus === "available"
      ).length,
      locked: allQuestsWithProgress.filter((q) => q.computedStatus === "locked")
        .length,
    }),
    [allQuestsWithProgress]
  );

  useEffect(() => {
    if (!loading && !error) {
      setStats(stats);
    }
    return () => setStats(null);
  }, [stats, setStats, loading, error]);

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
        onCatchUp={handleCatchUpFromWelcome}
      />
      <CatchUpDialog
        open={showCatchUp}
        onOpenChange={setShowCatchUp}
        quests={allQuestsWithProgress}
        onComplete={handleCatchUpComplete}
      />
      <QuestDetailModal
        quest={detailQuest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
      <div className="flex-1 min-h-0">
        <RaidPlanner
          quests={allQuestsWithProgress}
          onQuestDetails={handleQuestDetails}
        />
      </div>
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

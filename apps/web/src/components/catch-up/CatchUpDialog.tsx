// @ts-nocheck - React 19 Input component type compatibility
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTraderColor } from "@/lib/trader-colors";
import { calculateCatchUp, groupByTrader } from "@/lib/catch-up-algorithm";
import { TraderQuestGroup } from "./TraderQuestGroup";
import {
  Search,
  X,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { QuestWithProgress, CatchUpCalculation } from "@eft-tracker/types";

type Step = "select" | "confirm-reset" | "review";

interface CatchUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quests: QuestWithProgress[];
  onComplete: () => void;
  existingProgressCount?: number;
}

export function CatchUpDialog({
  open,
  onOpenChange,
  quests,
  onComplete,
  existingProgressCount = 0,
}: CatchUpDialogProps) {
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuests, setSelectedQuests] = useState<QuestWithProgress[]>([]);
  const [playerLevel, setPlayerLevel] = useState<number | null>(null);
  const [confirmedBranches, setConfirmedBranches] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSearchQuery("");
      setSelectedQuests([]);
      setPlayerLevel(null);
      setConfirmedBranches(new Set());
    }
  }, [open]);

  // Calculate catch-up data when we have selections and player level
  const catchUpData = useMemo((): CatchUpCalculation | null => {
    if (selectedQuests.length === 0 || playerLevel === null) return null;
    return calculateCatchUp(
      selectedQuests.map((q) => q.id),
      quests
    );
  }, [selectedQuests, quests, playerLevel]);

  // Initialize confirmed branches when catch-up data changes
  useEffect(() => {
    if (catchUpData && playerLevel !== null) {
      const autoChecked = new Set<string>();
      for (const branch of catchUpData.completedBranches) {
        if (branch.levelRequired <= playerLevel) {
          autoChecked.add(branch.questId);
        }
      }
      setConfirmedBranches(autoChecked);
    }
  }, [catchUpData, playerLevel]);

  // Filter quests based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const lowerQuery = searchQuery.toLowerCase();
    const selectedIds = new Set(selectedQuests.map((q) => q.id));

    return quests
      .filter(
        (q) =>
          q.title.toLowerCase().includes(lowerQuery) && !selectedIds.has(q.id)
      )
      .sort((a, b) => {
        const aExact = a.title.toLowerCase() === lowerQuery;
        const bExact = b.title.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.levelRequired - b.levelRequired;
      })
      .slice(0, 20);
  }, [searchQuery, quests, selectedQuests]);

  const handleSelectQuest = useCallback((quest: QuestWithProgress) => {
    setSelectedQuests((prev) => [...prev, quest]);
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleRemoveQuest = useCallback((questId: string) => {
    setSelectedQuests((prev) => prev.filter((q) => q.id !== questId));
  }, []);

  const handlePlayerLevelChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (value === "") {
      setPlayerLevel(null);
    } else if (!isNaN(num) && num >= 1 && num <= 79) {
      setPlayerLevel(num);
    }
  }, []);

  const handleToggleBranch = useCallback((questId: string) => {
    setConfirmedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (step === "select") {
      if (existingProgressCount > 0) {
        setStep("confirm-reset");
      } else {
        setStep("review");
      }
    } else if (step === "confirm-reset") {
      setStep("review");
    }
  }, [step, existingProgressCount]);

  const handleBack = useCallback(() => {
    if (step === "review") {
      if (existingProgressCount > 0) {
        setStep("confirm-reset");
      } else {
        setStep("select");
      }
    } else if (step === "confirm-reset") {
      setStep("select");
    }
  }, [step, existingProgressCount]);

  const handleCatchUp = useCallback(async () => {
    if (selectedQuests.length === 0 || playerLevel === null) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: selectedQuests.map((q) => q.id),
          playerLevel,
          confirmedBranches: Array.from(confirmedBranches),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to catch up progress");
      }

      const data = await response.json();

      toast.success("Progress synced!", {
        description: `Completed ${data.completed.length} prerequisite quests${
          data.completedBranches?.length > 0
            ? ` and ${data.completedBranches.length} branch quests`
            : ""
        }.`,
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to sync", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedQuests,
    playerLevel,
    confirmedBranches,
    onComplete,
    onOpenChange,
  ]);

  const canProceed = selectedQuests.length > 0 && playerLevel !== null;

  // Group prerequisites and branches by trader for display
  const prerequisitesByTrader = useMemo(() => {
    if (!catchUpData) return new Map();
    return groupByTrader(catchUpData.prerequisites);
  }, [catchUpData]);

  const branchesByTrader = useMemo(() => {
    if (!catchUpData) return new Map();
    return groupByTrader(catchUpData.completedBranches);
  }, [catchUpData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Catch Up Progress"}
            {step === "confirm-reset" && "Progress Reset Warning"}
            {step === "review" && "Review Catch-Up"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Select the quests you're currently working on and enter your PMC level."}
            {step === "confirm-reset" &&
              "This will reset your existing progress before applying the catch-up."}
            {step === "review" &&
              "Review the quests that will be marked as completed."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-2 min-h-0 overflow-hidden">
          {/* Step 1: Select quests and enter level */}
          {step === "select" && (
            <>
              {/* Player level input */}
              <div className="shrink-0">
                <label className="text-sm font-medium mb-1.5 block">
                  Your PMC Level
                </label>
                <Input
                  type="number"
                  min={1}
                  max={79}
                  value={playerLevel ?? ""}
                  onChange={(e) => handlePlayerLevelChange(e.target.value)}
                  placeholder="Enter level (1-79)"
                  className="w-32"
                />
              </div>

              {/* Search input */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quests..."
                  className="pl-9"
                />
              </div>

              {/* Search results */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto shrink-0">
                  {searchResults.map((quest) => {
                    const traderColor = getTraderColor(quest.traderId);
                    return (
                      <button
                        type="button"
                        key={quest.id}
                        onClick={() => handleSelectQuest(quest)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: traderColor.primary }}
                        />
                        <span className="flex-1 truncate">{quest.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          Lv {quest.levelRequired}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected quests */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {selectedQuests.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected quests ({selectedQuests.length}):
                    </p>
                    <div className="space-y-1">
                      {selectedQuests.map((quest) => {
                        const traderColor = getTraderColor(quest.traderId);
                        return (
                          <div
                            key={quest.id}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm"
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: traderColor.primary }}
                            />
                            <span className="flex-1 truncate">
                              {quest.title}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              Lv {quest.levelRequired}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuest(quest.id)}
                              className="p-1 hover:bg-muted rounded-sm"
                              aria-label={`Remove ${quest.title}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Search for quests you&apos;re currently working on
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 2: Confirm reset warning */}
          {step === "confirm-reset" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">
                  You have {existingProgressCount} quest
                  {existingProgressCount !== 1 ? "s" : ""} marked complete.
                </p>
                <p className="text-sm text-muted-foreground">
                  Continuing will reset all existing progress and apply the new
                  catch-up state. This cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && catchUpData && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Prerequisites section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Prerequisites</h3>
                  <span className="text-xs text-muted-foreground">
                    ({catchUpData.prerequisites.length} quests)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  These quests must be completed to reach your selected quests.
                </p>
                {catchUpData.prerequisites.length > 0 ? (
                  <div className="space-y-1">
                    {Array.from(prerequisitesByTrader.entries()).map(
                      ([traderId, selections]) => (
                        <TraderQuestGroup
                          key={traderId}
                          traderId={traderId}
                          traderName={selections[0].traderName}
                          traderColor={selections[0].traderColor}
                          quests={selections}
                          locked
                        />
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No prerequisites needed.
                  </p>
                )}
              </div>

              {/* Completed branches section */}
              {catchUpData.completedBranches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <h3 className="text-sm font-medium">Completed Branches</h3>
                    <span className="text-xs text-muted-foreground">
                      ({catchUpData.completedBranches.length} terminal quests)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    These quest chains ended before your current position. Check
                    the ones you&apos;ve completed.
                  </p>
                  <div className="space-y-1">
                    {Array.from(branchesByTrader.entries()).map(
                      ([traderId, selections]) => (
                        <TraderQuestGroup
                          key={traderId}
                          traderId={traderId}
                          traderName={selections[0].traderName}
                          traderColor={selections[0].traderColor}
                          quests={selections}
                          showCheckboxes
                          checkedIds={confirmedBranches}
                          onToggle={handleToggleBranch}
                          playerLevel={playerLevel}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step !== "select" && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {step === "review" ? (
              <Button
                onClick={handleCatchUp}
                disabled={isLoading || !canProceed}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Apply Catch-Up
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

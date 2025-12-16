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
import {
  Search,
  X,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { QuestWithProgress } from "@/types";

interface CatchUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quests: QuestWithProgress[];
  onComplete: () => void;
}

interface TraderPrerequisites {
  traderId: string;
  traderName: string;
  color: string;
  quests: QuestWithProgress[];
}

interface PrerequisiteSummary {
  total: number;
  byTrader: TraderPrerequisites[];
}

/**
 * Recursively collect all incomplete prerequisites for a quest.
 */
function getIncompletePrerequisites(
  questId: string,
  quests: QuestWithProgress[],
  seen: Set<string>
): QuestWithProgress[] {
  if (seen.has(questId)) return [];
  seen.add(questId);

  const questMap = new Map(quests.map((q) => [q.id, q]));
  const quest = questMap.get(questId);
  if (!quest) return [];

  const prerequisites: QuestWithProgress[] = [];

  for (const dep of quest.dependsOn || []) {
    const prereqId = dep.requiredQuest.id;
    const prereqQuest = questMap.get(prereqId);

    // First recurse to get deeper prerequisites
    const deeperPrereqs = getIncompletePrerequisites(prereqId, quests, seen);
    prerequisites.push(...deeperPrereqs);

    // Then add this prerequisite if not completed
    if (prereqQuest && prereqQuest.computedStatus !== "completed") {
      prerequisites.push(prereqQuest);
    }
  }

  return prerequisites;
}

export function CatchUpDialog({
  open,
  onOpenChange,
  quests,
  onComplete,
}: CatchUpDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuests, setSelectedQuests] = useState<QuestWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraders, setExpandedTraders] = useState<Set<string>>(
    new Set()
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedQuests([]);
      setExpandedTraders(new Set());
    }
  }, [open]);

  // Collect all prerequisite IDs for current selection (to exclude from search)
  const prerequisiteIds = useMemo(() => {
    const ids = new Set<string>();
    const selectedIds = new Set(selectedQuests.map((q) => q.id));

    for (const quest of selectedQuests) {
      const seen = new Set<string>();
      const prereqs = getIncompletePrerequisites(quest.id, quests, seen);
      for (const prereq of prereqs) {
        if (!selectedIds.has(prereq.id)) {
          ids.add(prereq.id);
        }
      }
    }
    return ids;
  }, [selectedQuests, quests]);

  // Filter quests based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const lowerQuery = searchQuery.toLowerCase();
    const selectedIds = new Set(selectedQuests.map((q) => q.id));

    return quests
      .filter(
        (q) =>
          q.title.toLowerCase().includes(lowerQuery) &&
          !selectedIds.has(q.id) &&
          !prerequisiteIds.has(q.id) // Exclude quests that are already prerequisites
      )
      .sort((a, b) => {
        // Exact match first, then by level
        const aExact = a.title.toLowerCase() === lowerQuery;
        const bExact = b.title.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.levelRequired - b.levelRequired;
      })
      .slice(0, 26);
  }, [searchQuery, quests, selectedQuests, prerequisiteIds]);

  // Calculate prerequisites summary with full quest details
  const prerequisiteSummary = useMemo((): PrerequisiteSummary => {
    const allPrereqs = new Map<string, QuestWithProgress>();
    const selectedIds = new Set(selectedQuests.map((q) => q.id));

    for (const quest of selectedQuests) {
      const seen = new Set<string>();
      const prereqs = getIncompletePrerequisites(quest.id, quests, seen);
      for (const prereq of prereqs) {
        // Don't count selected quests as prerequisites
        if (!selectedIds.has(prereq.id)) {
          allPrereqs.set(prereq.id, prereq);
        }
      }
    }

    // Group by trader with full quest details
    const traderMap = new Map<string, TraderPrerequisites>();
    for (const prereq of allPrereqs.values()) {
      const traderId = prereq.traderId.toLowerCase();
      const existing = traderMap.get(traderId);
      if (existing) {
        existing.quests.push(prereq);
      } else {
        traderMap.set(traderId, {
          traderId,
          traderName: prereq.trader.name,
          color: getTraderColor(traderId).primary,
          quests: [prereq],
        });
      }
    }

    // Sort quests within each trader by level
    const byTrader = Array.from(traderMap.values()).map((trader) => ({
      ...trader,
      quests: trader.quests.sort((a, b) => a.levelRequired - b.levelRequired),
    }));

    // Sort traders by total quest count (descending)
    byTrader.sort((a, b) => b.quests.length - a.quests.length);

    return {
      total: allPrereqs.size,
      byTrader,
    };
  }, [selectedQuests, quests]);

  const toggleTrader = useCallback((traderId: string) => {
    setExpandedTraders((prev) => {
      const next = new Set(prev);
      if (next.has(traderId)) {
        next.delete(traderId);
      } else {
        next.add(traderId);
      }
      return next;
    });
  }, []);

  const handleSelectQuest = useCallback((quest: QuestWithProgress) => {
    setSelectedQuests((prev) => [...prev, quest]);
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleRemoveQuest = useCallback((questId: string) => {
    setSelectedQuests((prev) => prev.filter((q) => q.id !== questId));
  }, []);

  const handleCatchUp = useCallback(async () => {
    if (selectedQuests.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/progress/catch-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuests: selectedQuests.map((q) => q.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to catch up progress");
      }

      const data = await response.json();

      toast.success("Progress synced!", {
        description: `Completed ${data.completed.length} prerequisite quests.`,
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
  }, [selectedQuests, onComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Catch Up Progress</DialogTitle>
          <DialogDescription>
            Search and select the quests you&apos;re currently working on
            in-game. All prerequisite quests will be auto-completed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-2 min-h-0 overflow-hidden">
          {/* Search input */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search quests..."
              className="pl-9"
            />
          </div>

          {/* Search results - inline list */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="border rounded-md max-h-64 overflow-y-auto shrink-0">
              {searchResults.map((quest) => {
                const traderColor = getTraderColor(quest.traderId);
                return (
                  <button
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
                      {quest.trader.name}
                    </span>
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
                        <span className="flex-1 truncate">{quest.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {quest.trader.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          Lv {quest.levelRequired}
                        </span>
                        <button
                          onClick={() => handleRemoveQuest(quest.id)}
                          className="p-1 hover:bg-muted rounded-sm"
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

          {/* Prerequisites summary with collapsible trader sections */}
          {selectedQuests.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">
                This will complete {prerequisiteSummary.total} prerequisite
                quest{prerequisiteSummary.total !== 1 ? "s" : ""}:
              </p>
              {prerequisiteSummary.total > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {prerequisiteSummary.byTrader.map((trader) => {
                    const isExpanded = expandedTraders.has(trader.traderId);
                    return (
                      <div key={trader.traderId} className="border rounded-md">
                        <button
                          onClick={() => toggleTrader(trader.traderId)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: trader.color }}
                          />
                          <span className="font-medium">
                            {trader.traderName}
                          </span>
                          <span className="text-muted-foreground">
                            ({trader.quests.length})
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-3 py-2 space-y-1">
                            {trader.quests.map((quest) => (
                              <div
                                key={quest.id}
                                className="flex items-center justify-between text-xs text-muted-foreground"
                              >
                                <span className="truncate">{quest.title}</span>
                                <span className="shrink-0 ml-2">
                                  Lv {quest.levelRequired}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional prerequisites needed.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCatchUp}
            disabled={isLoading || selectedQuests.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Catch Up
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

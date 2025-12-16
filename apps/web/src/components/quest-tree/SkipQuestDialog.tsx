"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTraderColor } from "@/lib/trader-colors";
import type { QuestWithProgress } from "@/types";

interface SkipQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetQuest: QuestWithProgress | null;
  prerequisites: QuestWithProgress[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SkipQuestDialog({
  open,
  onOpenChange,
  targetQuest,
  prerequisites,
  onConfirm,
  isLoading = false,
}: SkipQuestDialogProps) {
  if (!targetQuest) return null;

  // Group prerequisites by trader
  const byTrader = new Map<string, QuestWithProgress[]>();
  for (const prereq of prerequisites) {
    const traderId = prereq.trader.id;
    if (!byTrader.has(traderId)) {
      byTrader.set(traderId, []);
    }
    byTrader.get(traderId)!.push(prereq);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Skip to Quest</DialogTitle>
          <DialogDescription>
            Mark all prerequisite quests as completed to unlock{" "}
            <span className="font-semibold">{targetQuest.title}</span>?
          </DialogDescription>
        </DialogHeader>

        {prerequisites.length > 0 ? (
          <div className="flex-1 overflow-y-auto py-4">
            <p className="text-sm text-muted-foreground mb-3">
              The following {prerequisites.length} quest
              {prerequisites.length > 1 ? "s" : ""} will be marked as completed:
            </p>

            <div className="space-y-3">
              {Array.from(byTrader.entries()).map(([traderId, quests]) => {
                const traderColor = getTraderColor(traderId);
                const traderName = quests[0].trader.name;

                return (
                  <div key={traderId}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: traderColor.primary }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {traderName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {quests.length}
                      </Badge>
                    </div>
                    <ul className="space-y-1 ml-4">
                      {quests.map((quest) => (
                        <li
                          key={quest.id}
                          className="text-sm flex items-center gap-2"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: traderColor.primary }}
                          />
                          {quest.title}
                          <span className="text-xs text-muted-foreground">
                            Lv.{quest.levelRequired}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 text-sm text-muted-foreground">
            This quest has no incomplete prerequisites. It should already be
            available!
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || prerequisites.length === 0}
          >
            {isLoading
              ? "Completing..."
              : `Complete ${prerequisites.length} Quest${prerequisites.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

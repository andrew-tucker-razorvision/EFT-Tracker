"use client";

import {
  ExternalLink,
  MapPin,
  Target,
  Award,
  ChevronRight,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTraderColor, STATUS_COLORS } from "@/lib/trader-colors";
import type { QuestWithProgress } from "@/types";

interface QuestDetailModalProps {
  quest: QuestWithProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function QuestDetailContent({ quest }: { quest: QuestWithProgress }) {
  const statusColor = STATUS_COLORS[quest.computedStatus];

  // Group objectives by map
  const objectivesByMap = quest.objectives.reduce(
    (acc, obj) => {
      const map = obj.map || "Any Location";
      if (!acc[map]) acc[map] = [];
      acc[map].push(obj);
      return acc;
    },
    {} as Record<string, typeof quest.objectives>
  );

  // Get unique maps for display
  const maps = Object.keys(objectivesByMap);

  // Get prerequisite quests
  const prerequisites = quest.dependsOn || [];

  return (
    <div className="space-y-6">
      {/* Status & Level Info */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          style={{
            borderColor: statusColor.primary,
            color: statusColor.primary,
          }}
        >
          {quest.computedStatus.replace("_", " ")}
        </Badge>
        <Badge variant="secondary">Level {quest.levelRequired}</Badge>
        {quest.kappaRequired && (
          <Badge
            style={{ backgroundColor: "#FFD700", color: "#000" }}
            className="font-bold"
          >
            Kappa Required
          </Badge>
        )}
      </div>

      {/* Objectives Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Objectives ({quest.objectives.length})
        </h3>
        {quest.objectives.length > 0 ? (
          <div className="space-y-4">
            {maps.map((map) => (
              <div key={map}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {map}
                  </span>
                </div>
                <ul className="space-y-2 pl-5">
                  {objectivesByMap[map].map((obj) => (
                    <li
                      key={obj.id}
                      className="text-sm text-foreground/90 leading-relaxed"
                    >
                      {obj.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No objectives listed
          </p>
        )}
      </div>

      {/* Prerequisites Section */}
      {prerequisites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Prerequisites ({prerequisites.length})
          </h3>
          <ul className="space-y-2">
            {prerequisites.map((dep) => {
              const prereqTraderColor = getTraderColor(
                dep.requiredQuest.traderId
              );
              const requirementText = dep.requirementStatus.includes("complete")
                ? "Complete"
                : dep.requirementStatus.includes("active")
                  ? "Have Active"
                  : dep.requirementStatus.join(", ");

              return (
                <li
                  key={dep.requiredQuest.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: prereqTraderColor.primary }}
                  />
                  <span className="text-foreground/90">
                    {dep.requiredQuest.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({requirementText})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Unlocks Section */}
      {quest.dependedOnBy && quest.dependedOnBy.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Unlocks ({quest.dependedOnBy.length})
          </h3>
          <ul className="space-y-2">
            {quest.dependedOnBy.map((dep) => {
              const depTraderColor = getTraderColor(
                dep.dependentQuest.traderId
              );
              return (
                <li
                  key={dep.dependentQuest.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: depTraderColor.primary }}
                  />
                  <span className="text-foreground/90">
                    {dep.dependentQuest.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Wiki Link */}
      {quest.wikiLink && (
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              window.open(quest.wikiLink!, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Tarkov Wiki
          </Button>
        </div>
      )}
    </div>
  );
}

export function QuestDetailModal({
  quest,
  open,
  onOpenChange,
}: QuestDetailModalProps) {
  const isMobile = useIsMobile();

  if (!quest) return null;

  const traderColor = getTraderColor(quest.traderId);

  // Use Sheet (drawer) on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: traderColor.primary }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {quest.trader.name}
              </span>
            </div>
            <SheetTitle className="text-lg">{quest.title}</SheetTitle>
            <SheetDescription className="sr-only">
              Quest details for {quest.title}
            </SheetDescription>
          </SheetHeader>
          <div className="pt-4">
            <QuestDetailContent quest={quest} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: traderColor.primary }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {quest.trader.name}
            </span>
          </div>
          <DialogTitle className="text-lg">{quest.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Quest details for {quest.title}
          </DialogDescription>
        </DialogHeader>
        <QuestDetailContent quest={quest} />
      </DialogContent>
    </Dialog>
  );
}

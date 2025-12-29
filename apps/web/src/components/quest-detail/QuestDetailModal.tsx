"use client";

import { useState, useCallback } from "react";
import {
  ExternalLink,
  MapPin,
  Target,
  Award,
  ChevronRight,
  Gift,
  Package,
  Loader2,
  AlertCircle,
  Key,
  CheckCircle,
  Square,
  CheckSquare,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useQuestDetails } from "@/hooks/useQuestDetails";
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
import type { QuestWithProgress, Objective } from "@/types";
import type { TarkovQuestDetails, TarkovObjectiveItem } from "@/lib/tarkov-api";

interface QuestDetailModalProps {
  quest: QuestWithProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (questId: string) => Promise<void>;
  onObjectiveToggle?: (
    objectiveId: string,
    completed: boolean
  ) => Promise<{ questStatusChanged?: boolean; newQuestStatus?: string }>;
  isSaving?: boolean;
}

// Helper to extract item objectives that require turning in items
function getItemObjectives(
  objectives: TarkovObjectiveItem[]
): TarkovObjectiveItem[] {
  return objectives.filter(
    (obj) =>
      (obj.type === "giveItem" || obj.type === "findQuestItem") &&
      (obj.item || (obj.items && obj.items.length > 0))
  );
}

interface QuestDetailContentProps {
  quest: QuestWithProgress;
  details: TarkovQuestDetails | null;
  detailsLoading: boolean;
  detailsError: string | null;
  onStatusChange?: (questId: string) => Promise<void>;
  onObjectiveToggle?: (
    objectiveId: string,
    completed: boolean
  ) => Promise<{ questStatusChanged?: boolean; newQuestStatus?: string }>;
  isSaving?: boolean;
  onOpenChange?: (open: boolean) => void;
  objectiveStates: Record<string, boolean>;
  onLocalObjectiveToggle: (objectiveId: string, completed: boolean) => void;
  savingObjectives: Set<string>;
}

// Helper to check if an objective is completed
function isObjectiveCompleted(
  objective: Objective,
  objectiveStates: Record<string, boolean>
): boolean {
  // First check local state (optimistic updates)
  if (objectiveStates[objective.id] !== undefined) {
    return objectiveStates[objective.id];
  }
  // Fall back to server state
  return objective.progress?.[0]?.completed ?? false;
}

function QuestDetailContent({
  quest,
  details,
  detailsLoading,
  detailsError,
  onStatusChange,
  onObjectiveToggle,
  isSaving,
  onOpenChange,
  objectiveStates,
  onLocalObjectiveToggle,
  savingObjectives,
}: QuestDetailContentProps) {
  const statusColor = STATUS_COLORS[quest.computedStatus];
  const isLocked = quest.computedStatus === "locked";
  const canToggleObjectives = !isLocked && !!onObjectiveToggle;

  // Calculate objective progress
  const completedCount = quest.objectives.filter((obj) =>
    isObjectiveCompleted(obj, objectiveStates)
  ).length;
  const totalCount = quest.objectives.length;

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

  // Extract required items from objectives
  const itemObjectives = details ? getItemObjectives(details.objectives) : [];

  // Check if there are rewards
  const hasRewards =
    details &&
    (details.experience > 0 ||
      details.finishRewards.items.length > 0 ||
      details.finishRewards.traderStanding.length > 0);

  // Check for needed keys
  const hasKeys =
    details && details.neededKeys && details.neededKeys.length > 0;

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
        {details && details.experience > 0 && (
          <Badge variant="secondary">
            {details.experience.toLocaleString()} XP
          </Badge>
        )}
      </div>

      {/* Required Items Section */}
      {itemObjectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Required Items ({itemObjectives.length})
          </h3>
          <ul className="space-y-2">
            {itemObjectives.map((obj) => {
              const item = obj.item || obj.items?.[0];
              if (!item) return null;
              return (
                <li key={obj.id} className="flex items-center gap-3 text-sm">
                  {item.iconLink && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.iconLink}
                      alt={item.shortName}
                      className="w-8 h-8 object-contain bg-muted rounded"
                    />
                  )}
                  <div className="flex-1">
                    <span className="text-foreground/90">{item.name}</span>
                    {obj.count && obj.count > 1 && (
                      <span className="text-muted-foreground ml-1">
                        x{obj.count}
                      </span>
                    )}
                    {obj.foundInRaid && (
                      <Badge variant="outline" className="ml-2 text-xs py-0">
                        FIR
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Needed Keys Section */}
      {hasKeys && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Required Keys ({details!.neededKeys.length})
          </h3>
          <ul className="space-y-2">
            {details!.neededKeys.map((keyReq, idx) =>
              keyReq.keys.map((key) => (
                <li
                  key={`${idx}-${key.shortName}`}
                  className="flex items-center gap-3 text-sm"
                >
                  {key.iconLink && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={key.iconLink}
                      alt={key.shortName}
                      className="w-8 h-8 object-contain bg-muted rounded"
                    />
                  )}
                  <div className="flex-1">
                    <span className="text-foreground/90">{key.name}</span>
                    {keyReq.map && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({keyReq.map.name})
                      </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Objectives Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Objectives ({completedCount}/{totalCount})
        </h3>
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mb-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
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
                <ul className="space-y-2">
                  {objectivesByMap[map].map((obj) => {
                    const isCompleted = isObjectiveCompleted(
                      obj,
                      objectiveStates
                    );
                    const isSavingThis = savingObjectives.has(obj.id);

                    return (
                      <li
                        key={obj.id}
                        className={`flex items-start gap-2 text-sm leading-relaxed ${
                          canToggleObjectives
                            ? "cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                            : ""
                        } ${isCompleted ? "text-muted-foreground" : "text-foreground/90"}`}
                        onClick={
                          canToggleObjectives && !isSavingThis
                            ? () => {
                                const newCompleted = !isCompleted;
                                onLocalObjectiveToggle(obj.id, newCompleted);
                                onObjectiveToggle?.(obj.id, newCompleted);
                              }
                            : undefined
                        }
                      >
                        {/* Checkbox */}
                        <span className="shrink-0 mt-0.5">
                          {isSavingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : isCompleted ? (
                            <CheckSquare
                              className={`w-4 h-4 ${canToggleObjectives ? "text-primary" : "text-muted-foreground"}`}
                            />
                          ) : (
                            <Square
                              className={`w-4 h-4 ${canToggleObjectives ? "text-muted-foreground hover:text-primary" : "text-muted-foreground/50"}`}
                            />
                          )}
                        </span>
                        {/* Description */}
                        <span className={isCompleted ? "line-through" : ""}>
                          {obj.description}
                          {obj.optional && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs py-0"
                            >
                              Optional
                            </Badge>
                          )}
                        </span>
                      </li>
                    );
                  })}
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

      {/* Rewards Section */}
      {detailsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading rewards...
        </div>
      )}
      {detailsError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {detailsError}
        </div>
      )}
      {hasRewards && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </h3>
          <div className="space-y-3">
            {/* Trader Standing Changes */}
            {details!.finishRewards.traderStanding.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {details!.finishRewards.traderStanding.map((standing, idx) => (
                  <Badge
                    key={idx}
                    variant={
                      standing.standing >= 0 ? "secondary" : "destructive"
                    }
                    className="text-xs"
                  >
                    {standing.trader.name} {standing.standing >= 0 ? "+" : ""}
                    {standing.standing.toFixed(2)}
                  </Badge>
                ))}
              </div>
            )}
            {/* Item Rewards */}
            {details!.finishRewards.items.length > 0 && (
              <ul className="space-y-2">
                {details!.finishRewards.items.map((reward, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    {reward.item.iconLink && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reward.item.iconLink}
                        alt={reward.item.shortName}
                        className="w-8 h-8 object-contain bg-muted rounded"
                      />
                    )}
                    <span className="text-foreground/90">
                      {reward.item.name}
                      {reward.count > 1 && (
                        <span className="text-muted-foreground ml-1">
                          x{reward.count.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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

      {/* Action Buttons */}
      {quest.computedStatus !== "locked" && onStatusChange && (
        <div className="pt-2 border-t">
          <div className="flex gap-2">
            {/* Complete Quest Button - Left (Primary Action) */}
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              disabled={isSaving}
              onClick={async () => {
                await onStatusChange(quest.id);
                onOpenChange?.(false);
              }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {quest.computedStatus === "completed"
                ? "Mark Available"
                : "Complete Quest"}
            </Button>

            {/* Wiki Link Button - Right */}
            {quest.wikiLink && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  window.open(quest.wikiLink!, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Wiki
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Fallback: Wiki-only button when no status change handler */}
      {quest.computedStatus !== "locked" &&
        !onStatusChange &&
        quest.wikiLink && (
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
  onStatusChange,
  onObjectiveToggle,
  isSaving,
}: QuestDetailModalProps) {
  const isMobile = useIsMobile();
  // Fetch extended details from tarkov.dev when modal opens
  const {
    details,
    loading: detailsLoading,
    error: detailsError,
  } = useQuestDetails(open && quest ? quest.id : null);

  // Local state for optimistic updates on objectives
  const [objectiveStates, setObjectiveStates] = useState<
    Record<string, boolean>
  >({});
  const [savingObjectives, setSavingObjectives] = useState<Set<string>>(
    new Set()
  );

  // Reset local state when quest changes or modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setObjectiveStates({});
        setSavingObjectives(new Set());
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Handle local objective toggle with optimistic update
  const handleLocalObjectiveToggle = useCallback(
    (objectiveId: string, completed: boolean) => {
      setObjectiveStates((prev) => ({ ...prev, [objectiveId]: completed }));
      setSavingObjectives((prev) => new Set(prev).add(objectiveId));
    },
    []
  );

  // Wrap the onObjectiveToggle to handle saving state
  const handleObjectiveToggle = useCallback(
    async (objectiveId: string, completed: boolean) => {
      if (!onObjectiveToggle) return { questStatusChanged: false };

      try {
        const result = await onObjectiveToggle(objectiveId, completed);
        return result;
      } finally {
        setSavingObjectives((prev) => {
          const next = new Set(prev);
          next.delete(objectiveId);
          return next;
        });
      }
    },
    [onObjectiveToggle]
  );

  if (!quest) return null;

  const traderColor = getTraderColor(quest.traderId);

  // Use Sheet (drawer) on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
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
            <QuestDetailContent
              quest={quest}
              details={details}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              onStatusChange={onStatusChange}
              onObjectiveToggle={handleObjectiveToggle}
              isSaving={isSaving}
              onOpenChange={handleOpenChange}
              objectiveStates={objectiveStates}
              onLocalObjectiveToggle={handleLocalObjectiveToggle}
              savingObjectives={savingObjectives}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        <QuestDetailContent
          quest={quest}
          details={details}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          onStatusChange={onStatusChange}
          onObjectiveToggle={handleObjectiveToggle}
          isSaving={isSaving}
          onOpenChange={handleOpenChange}
          objectiveStates={objectiveStates}
          onLocalObjectiveToggle={handleLocalObjectiveToggle}
          savingObjectives={savingObjectives}
        />
      </DialogContent>
    </Dialog>
  );
}

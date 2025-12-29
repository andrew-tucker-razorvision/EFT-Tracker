"use client";

import { useMemo, useState } from "react";
import { Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTraderColor, STATUS_COLORS } from "@/lib/trader-colors";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { QuestWithProgress, QuestStatus } from "@/types";

// Static style for icon buttons
const ICON_BUTTON_STYLE = { color: "#636363" };

interface LevelQuestCardProps {
  quest: QuestWithProgress;
  playerLevel?: number | null;
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onQuestDetails?: (questId: string) => void;
}

export function LevelQuestCard({
  quest,
  playerLevel,
  onStatusChange,
  onQuestDetails,
}: LevelQuestCardProps) {
  const traderColor = getTraderColor(quest.traderId);
  const statusColor = STATUS_COLORS[quest.computedStatus];
  const [isClicked, setIsClicked] = useState(false);

  // Level-based highlighting
  const isLevelAppropriate =
    playerLevel !== null &&
    playerLevel !== undefined &&
    quest.levelRequired <= playerLevel;
  const isUpcoming =
    playerLevel !== null &&
    playerLevel !== undefined &&
    quest.levelRequired > playerLevel &&
    quest.levelRequired <= playerLevel + 5;

  // Find cross-trader dependencies
  const crossTraderBadges = useMemo(() => {
    if (!quest.dependsOn) return [];

    const byTrader = new Map<string, { name: string; count: number }>();
    for (const dep of quest.dependsOn) {
      if (
        dep.requiredQuest.traderId.toLowerCase() !==
        quest.traderId.toLowerCase()
      ) {
        const traderId = dep.requiredQuest.traderId.toLowerCase();
        const existing = byTrader.get(traderId);
        if (existing) {
          existing.count++;
        } else {
          byTrader.set(traderId, {
            name: dep.requiredQuest.trader.name,
            count: 1,
          });
        }
      }
    }
    return Array.from(byTrader.entries()).map(([traderId, info]) => ({
      traderId,
      ...info,
    }));
  }, [quest.dependsOn, quest.traderId]);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);

    // Pass to parent handler (handles locked state for skip-to-quest feature)
    onStatusChange(quest.id, quest.computedStatus);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Right-click to open quest details
    if (onQuestDetails) {
      onQuestDetails(quest.id);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents card click/status change
    if (onQuestDetails) {
      onQuestDetails(quest.id);
    }
  };

  const handleInfoMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent from intercepting
  };

  const handleWikiLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents card click/status change
    if (quest.wikiLink) {
      window.open(quest.wikiLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleWikiLinkMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent from intercepting
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "relative p-2 rounded-lg border transition-all duration-150 cursor-pointer min-h-[44px]",
        "hover:shadow-md",
        isClicked && "scale-95",
        quest.computedStatus === "locked" && "opacity-70",
        quest.computedStatus === "completed" && "opacity-70",
        quest.computedStatus === "available" && "shadow-sm hover:shadow-lg",
        // Level-based highlighting
        isUpcoming &&
          quest.computedStatus !== "completed" &&
          "ring-1 ring-amber-300"
      )}
      style={{
        backgroundColor: statusColor.bg,
        borderColor:
          quest.computedStatus === "available"
            ? traderColor.primary
            : statusColor.border,
        borderLeftWidth: 4,
        borderLeftColor: traderColor.primary,
      }}
    >
      {/* Kappa badge */}
      {quest.kappaRequired && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
          style={{ backgroundColor: "#FFD700" }}
          title="Required for Kappa"
        >
          K
        </div>
      )}

      {/* Cross-trader dependency badges */}
      {crossTraderBadges.length > 0 && (
        <div className="flex gap-0.5 mb-1">
          {crossTraderBadges.slice(0, 2).map((badge) => {
            const badgeColor = getTraderColor(badge.traderId);
            return (
              <div
                key={badge.traderId}
                className="px-1 rounded text-[8px] font-medium text-white"
                style={{ backgroundColor: badgeColor.primary }}
                title={`Requires quest(s) from ${badge.name}`}
              >
                {badge.name.slice(0, 2)}
              </div>
            );
          })}
          {crossTraderBadges.length > 2 && (
            <div
              className="px-1 rounded text-[8px] font-medium text-white"
              style={{ backgroundColor: "#636363" }}
            >
              +{crossTraderBadges.length - 2}
            </div>
          )}
        </div>
      )}

      {/* Quest title */}
      <div
        className="font-semibold text-[14px] leading-tight line-clamp-2"
        style={{ color: "#c7c5b3" }}
        title={quest.title}
      >
        {quest.title}
      </div>

      {/* Objective progress bar - only show when there are objectives and quest is not locked */}
      {quest.objectivesSummary &&
        quest.objectivesSummary.total > 0 &&
        quest.computedStatus !== "locked" && (
          <div className="mt-1">
            <div className="h-1 w-full bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${(quest.objectivesSummary.completed / quest.objectivesSummary.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

      {/* Bottom row: trader + level + action buttons */}
      {/* Refactoring UI: Labels tertiary, data primary */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {/* Trader name - primary emphasis (colored by trader) */}
          <span
            className="text-[12px] font-semibold"
            style={{ color: traderColor.primary }}
          >
            {quest.trader.name}
          </span>
          {/* Level - label de-emphasized, value emphasized */}
          <span className="flex items-center gap-0.5">
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Lv
            </span>
            <span
              className="text-[12px] font-semibold"
              style={{
                color: isLevelAppropriate
                  ? "var(--success)"
                  : isUpcoming
                    ? "#ca8a00"
                    : "var(--text-secondary)",
              }}
            >
              {quest.levelRequired}
            </span>
          </span>
          {/* Objective count badge */}
          {quest.objectivesSummary &&
            quest.objectivesSummary.total > 0 &&
            quest.computedStatus !== "locked" && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                ({quest.objectivesSummary.completed}/
                {quest.objectivesSummary.total})
              </span>
            )}
        </div>
        {/* Action buttons - info and wiki link */}
        <div className="flex items-center gap-1">
          {/* Info button - opens quest details */}
          {onQuestDetails && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleInfoClick}
                  onMouseDown={handleInfoMouseDown}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onQuestDetails) onQuestDetails(quest.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center opacity-60 hover:opacity-100 transition-colors duration-150 rounded-full hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-offset-1 pointer-events-auto"
                  style={ICON_BUTTON_STYLE}
                  aria-label={`View ${quest.title} details`}
                >
                  <Info className="w-[14px] h-[14px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                <p className="text-xs">View Details</p>
              </TooltipContent>
            </Tooltip>
          )}
          {/* Wiki link */}
          {quest.wikiLink && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleWikiLinkClick}
                  onMouseDown={handleWikiLinkMouseDown}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (quest.wikiLink) {
                      window.open(
                        quest.wikiLink,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center opacity-60 hover:opacity-100 transition-colors duration-150 rounded-full hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-offset-1 pointer-events-auto"
                  style={ICON_BUTTON_STYLE}
                  aria-label={`Open ${quest.title} wiki page`}
                >
                  <ExternalLink className="w-[14px] h-[14px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                <p className="text-xs">View on Tarkov Wiki</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Completed checkmark overlay */}
      {quest.computedStatus === "completed" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-6 h-6 opacity-30"
            style={{ color: "#00a700" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

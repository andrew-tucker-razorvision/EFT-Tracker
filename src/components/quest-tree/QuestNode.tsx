"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTraderColor, STATUS_COLORS, EFT_COLORS } from "@/lib/trader-colors";
import type { QuestNode as QuestNodeType } from "@/types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Responsive node sizes - built around 14px title / 12px level fonts
export const QUEST_NODE_WIDTH = 155;
export const QUEST_NODE_HEIGHT = 58;
export const QUEST_NODE_WIDTH_MOBILE = 130;
export const QUEST_NODE_HEIGHT_MOBILE = 58;

function QuestNodeComponent({ data, selected }: NodeProps<QuestNodeType>) {
  const {
    quest,
    nodeHeight = QUEST_NODE_HEIGHT, // Use dynamic height if provided, otherwise default
    onClick,
    isRoot,
    isLeaf,
    isFocused,
    isInFocusChain,
    hasFocusMode,
    playerLevel,
    isSaving,
  } = data;
  const traderColor = getTraderColor(quest.traderId);
  const statusColor = STATUS_COLORS[quest.computedStatus];

  // Level-based highlighting
  const isLevelAppropriate =
    playerLevel !== null && quest.levelRequired <= playerLevel;
  const isUpcoming =
    playerLevel !== null &&
    quest.levelRequired > playerLevel &&
    quest.levelRequired <= playerLevel + 5;

  // Find cross-trader dependencies (prereqs from different traders)
  const crossTraderDeps = useMemo(() => {
    if (!quest.dependsOn) return [];
    return quest.dependsOn
      .filter(
        (dep) =>
          dep.requiredQuest.traderId.toLowerCase() !==
          quest.traderId.toLowerCase()
      )
      .map((dep) => ({
        traderId: dep.requiredQuest.traderId.toLowerCase(),
        traderName: dep.requiredQuest.trader.name,
        questTitle: dep.requiredQuest.title,
      }));
  }, [quest.dependsOn, quest.traderId]);

  // Group by trader for display
  const crossTraderBadges = useMemo(() => {
    const byTrader = new Map<string, { name: string; count: number }>();
    for (const dep of crossTraderDeps) {
      const existing = byTrader.get(dep.traderId);
      if (existing) {
        existing.count++;
      } else {
        byTrader.set(dep.traderId, { name: dep.traderName, count: 1 });
      }
    }
    return Array.from(byTrader.entries()).map(([traderId, info]) => ({
      traderId,
      ...info,
    }));
  }, [crossTraderDeps]);

  // Should this node be dimmed? (focus mode active but not in chain)
  const isDimmed = hasFocusMode && !isInFocusChain && !isFocused;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Right-click to select/view details
    onClick(quest.id);
  };

  const handleWikiLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents node click/status change

    if (quest.wikiLink) {
      window.open(quest.wikiLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleWikiLinkMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent React Flow from intercepting
  };

  return (
    <>
      {/* Only show left handle if quest has dependencies (not a root node) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-1.5 !h-1.5"
          style={{ backgroundColor: STATUS_COLORS.locked.primary }}
        />
      )}
      <div
        onContextMenu={handleContextMenu}
        className={cn(
          "relative rounded border-2 p-2 transition-all duration-150",
          // Cursor: not-allowed for locked, pointer for others
          quest.computedStatus === "locked"
            ? "cursor-not-allowed"
            : "cursor-pointer",
          // Hover/active effects only for non-locked quests
          quest.computedStatus !== "locked" &&
            "hover:shadow-md active:scale-95",
          selected && "ring-2 ring-offset-2 ring-blue-500",
          quest.computedStatus === "locked" && !isDimmed && "opacity-70",
          quest.computedStatus === "completed" && !isDimmed && "opacity-80",
          // in_progress treated same as available (no special styling)
          (quest.computedStatus === "available" ||
            quest.computedStatus === "in_progress") &&
            !isDimmed &&
            "shadow-sm hover:shadow-lg",
          // Visual hierarchy indicators (only when not dimmed)
          isRoot && !isDimmed && "border-l-4 border-l-emerald-500",
          isLeaf && !isDimmed && "border-r-4 border-r-violet-500",
          quest.kappaRequired && !isDimmed && "ring-2 ring-amber-400/70",
          // Focus mode styling
          isFocused && "ring-4 ring-blue-500 shadow-lg scale-105",
          isInFocusChain && !isFocused && "ring-2 ring-blue-300",
          isDimmed && "opacity-40 pointer-events-auto",
          // Level-based highlighting (only for available quests)
          isLevelAppropriate &&
            quest.computedStatus === "available" &&
            !isDimmed &&
            !isFocused &&
            "ring-2 ring-emerald-400 shadow-emerald-100",
          isUpcoming &&
            quest.computedStatus !== "completed" &&
            !isDimmed &&
            !isFocused &&
            "ring-1 ring-amber-300"
        )}
        style={{
          width: QUEST_NODE_WIDTH,
          minHeight: QUEST_NODE_HEIGHT, // Minimum height, but grow with content
          backgroundColor: isDimmed ? "#424242" : statusColor.bg,
          borderColor: isDimmed
            ? "#636363"
            : quest.computedStatus === "available"
              ? traderColor.primary
              : statusColor.border,
        }}
      >
        {/* Kappa badge */}
        {quest.kappaRequired && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
            style={{ backgroundColor: "#FFD700" }}
            title="Required for Kappa"
          >
            K
          </div>
        )}

        {/* Wiki link */}
        {quest.wikiLink && !isDimmed && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <a
                role="button"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWikiLinkClick}
                onMouseDown={handleWikiLinkMouseDown}
                className="absolute -bottom-1 -right-1 p-2 opacity-60 hover:opacity-100 transition-colors duration-150 z-10 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 pointer-events-auto"
                style={{ color: STATUS_COLORS.locked.primary }}
                aria-label={`Open ${quest.title} wiki page`}
              >
                <ExternalLink className="w-[18px] h-[18px]" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <p className="text-xs">View on Tarkov Wiki</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Cross-trader dependency badges */}
        {crossTraderBadges.length > 0 && !isDimmed && (
          <div className="absolute -top-1 left-1 flex gap-px">
            {crossTraderBadges.slice(0, 2).map((badge) => {
              const badgeColor = getTraderColor(badge.traderId);
              return (
                <div
                  key={badge.traderId}
                  className="px-0.5 rounded text-[7px] font-medium text-white"
                  style={{ backgroundColor: badgeColor.primary }}
                  title={`Requires quest(s) from ${badge.name}`}
                >
                  {badge.name.slice(0, 2)}
                </div>
              );
            })}
            {crossTraderBadges.length > 2 && (
              <div
                className="px-0.5 rounded text-[7px] font-medium text-white"
                style={{ backgroundColor: STATUS_COLORS.locked.primary }}
              >
                +{crossTraderBadges.length - 2}
              </div>
            )}
          </div>
        )}

        {/* Saving spinner overlay */}
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 rounded">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {/* Completed checkmark overlay */}
        {quest.computedStatus === "completed" && !isSaving && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-5 h-5 opacity-40"
              style={{ color: STATUS_COLORS.completed.primary }}
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

        {/* Quest title */}
        <div
          className="font-semibold text-[14px] leading-tight line-clamp-2"
          style={{ color: EFT_COLORS.goldOne }}
          title={quest.title}
        >
          {quest.title}
        </div>

        {/* Level badge */}
        <div
          className="text-[12px] mt-1"
          style={{
            color: isLevelAppropriate
              ? STATUS_COLORS.completed.primary
              : isUpcoming
                ? STATUS_COLORS.in_progress.primary
                : STATUS_COLORS.locked.primary,
            fontWeight: isLevelAppropriate ? 600 : 400,
          }}
        >
          Lv.{quest.levelRequired}
        </div>
      </div>
      {/* Only show right handle if quest has dependents (not a leaf node) */}
      {!isLeaf && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-1.5 !h-1.5"
          style={{ backgroundColor: STATUS_COLORS.locked.primary }}
        />
      )}
    </>
  );
}

export const QuestNode = memo(QuestNodeComponent);

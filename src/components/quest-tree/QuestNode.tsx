"use client";

import { memo, useState, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getTraderColor, STATUS_COLORS } from "@/lib/trader-colors";
import type { QuestNode as QuestNodeType } from "@/types";

// Responsive node sizes
export const QUEST_NODE_WIDTH = 180;
export const QUEST_NODE_HEIGHT = 68;
export const QUEST_NODE_WIDTH_MOBILE = 160;
export const QUEST_NODE_HEIGHT_MOBILE = 60;

function QuestNodeComponent({ data, selected }: NodeProps<QuestNodeType>) {
  const {
    quest,
    onStatusChange,
    onClick,
    onFocus,
    isRoot,
    isLeaf,
    isFocused,
    isInFocusChain,
    hasFocusMode,
  } = data;
  const traderColor = getTraderColor(quest.traderId);
  const statusColor = STATUS_COLORS[quest.computedStatus];
  const [isClicked, setIsClicked] = useState(false);

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger click animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);

    // Call the status change handler (parent handles the cycle logic)
    onStatusChange(quest.id, quest.computedStatus);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Double-click to focus on this quest's chain
    onFocus(quest.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Right-click to select/view details
    onClick(quest.id);
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-2 !h-2"
      />
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200",
          "hover:shadow-md active:scale-95",
          isClicked && "scale-105",
          selected && "ring-2 ring-offset-2 ring-blue-500",
          quest.computedStatus === "locked" &&
            !isDimmed &&
            "opacity-50 cursor-not-allowed",
          quest.computedStatus === "completed" && !isDimmed && "opacity-60",
          quest.computedStatus === "in_progress" &&
            !isDimmed &&
            "ring-2 ring-amber-400",
          quest.computedStatus === "available" &&
            !isDimmed &&
            "shadow-sm hover:shadow-lg",
          // Visual hierarchy indicators (only when not dimmed)
          isRoot && !isDimmed && "border-l-4 border-l-emerald-500",
          isLeaf && !isDimmed && "border-r-4 border-r-violet-500",
          quest.kappaRequired && !isDimmed && "ring-2 ring-amber-400/70",
          // Focus mode styling
          isFocused && "ring-4 ring-blue-500 shadow-lg scale-105",
          isInFocusChain && !isFocused && "ring-2 ring-blue-300",
          isDimmed && "opacity-20 grayscale pointer-events-auto"
        )}
        style={{
          width: QUEST_NODE_WIDTH,
          height: QUEST_NODE_HEIGHT,
          backgroundColor: isDimmed ? "#F3F4F6" : statusColor.bg,
          borderColor: isDimmed
            ? "#E5E7EB"
            : quest.computedStatus === "available"
              ? traderColor.primary
              : statusColor.border,
        }}
      >
        {/* Kappa badge */}
        {quest.kappaRequired && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: "#FFD700" }}
            title="Required for Kappa"
          >
            K
          </div>
        )}

        {/* Cross-trader dependency badges */}
        {crossTraderBadges.length > 0 && !isDimmed && (
          <div className="absolute -top-2 left-2 flex gap-0.5">
            {crossTraderBadges.slice(0, 3).map((badge) => {
              const badgeColor = getTraderColor(badge.traderId);
              return (
                <div
                  key={badge.traderId}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white shadow-sm"
                  style={{ backgroundColor: badgeColor.primary }}
                  title={`Requires quest(s) from ${badge.name}`}
                >
                  {badge.name.slice(0, 3)}
                </div>
              );
            })}
            {crossTraderBadges.length > 3 && (
              <div className="px-1 py-0.5 rounded text-[9px] font-medium bg-gray-500 text-white">
                +{crossTraderBadges.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Completed checkmark overlay */}
        {quest.computedStatus === "completed" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-8 h-8 text-green-600 opacity-30"
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
          className="font-medium text-sm leading-tight line-clamp-2 text-gray-900"
          title={quest.title}
        >
          {quest.title}
        </div>

        {/* Bottom row: Level + Trader */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: traderColor.primary,
              color: "white",
            }}
          >
            Lv. {quest.levelRequired}
          </span>
          <span
            className="text-xs font-medium truncate max-w-[80px]"
            style={{ color: traderColor.primary }}
          >
            {quest.trader.name}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-2 !h-2"
      />
    </>
  );
}

export const QuestNode = memo(QuestNodeComponent);

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getTraderColor, STATUS_COLORS } from "@/lib/trader-colors";
import type { QuestWithProgress, QuestStatus } from "@/types";

interface LevelQuestCardProps {
  quest: QuestWithProgress;
  playerLevel?: number | null;
  onStatusChange: (questId: string, status: QuestStatus) => void;
}

export function LevelQuestCard({
  quest,
  playerLevel,
  onStatusChange,
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
    if (quest.computedStatus === "locked") return;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);

    onStatusChange(quest.id, quest.computedStatus);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative p-2 rounded-lg border transition-all duration-150 cursor-pointer",
        "hover:shadow-md",
        isClicked && "scale-95",
        quest.computedStatus === "locked" && "opacity-50 cursor-not-allowed",
        quest.computedStatus === "completed" && "opacity-70",
        quest.computedStatus === "available" && "shadow-sm hover:shadow-lg",
        // Level-based highlighting
        isLevelAppropriate &&
          quest.computedStatus === "available" &&
          "ring-2 ring-emerald-400",
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
        className="font-medium text-sm leading-tight line-clamp-2"
        style={{ color: "#c7c5b3" }}
        title={quest.title}
      >
        {quest.title}
      </div>

      {/* Bottom row: trader + level */}
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-[10px] font-medium"
          style={{ color: traderColor.primary }}
        >
          {quest.trader.name}
        </span>
        <span
          className="text-[10px]"
          style={{
            color: isLevelAppropriate
              ? "#00a700"
              : isUpcoming
                ? "#ca8a00"
                : "#636363",
            fontWeight: isLevelAppropriate ? 500 : 400,
          }}
        >
          Lv.{quest.levelRequired}
        </span>
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

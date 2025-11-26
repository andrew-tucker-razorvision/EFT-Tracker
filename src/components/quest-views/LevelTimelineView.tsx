"use client";

import { useMemo } from "react";
import { LevelQuestCard } from "./LevelQuestCard";
import type { QuestWithProgress, QuestStatus } from "@/types";

// Level brackets for timeline columns
const LEVEL_BRACKETS = [
  { min: 1, max: 5, label: "Lv 1-5" },
  { min: 6, max: 10, label: "Lv 6-10" },
  { min: 11, max: 15, label: "Lv 11-15" },
  { min: 16, max: 20, label: "Lv 16-20" },
  { min: 21, max: 30, label: "Lv 21-30" },
  { min: 31, max: 40, label: "Lv 31-40" },
  { min: 41, max: 79, label: "Lv 41+" },
];

interface LevelTimelineViewProps {
  quests: QuestWithProgress[];
  playerLevel?: number | null;
  onStatusChange: (questId: string, status: QuestStatus) => void;
}

export function LevelTimelineView({
  quests,
  playerLevel,
  onStatusChange,
}: LevelTimelineViewProps) {
  // Group quests by level bracket
  const questsByBracket = useMemo(() => {
    const groups = new Map<string, QuestWithProgress[]>();

    for (const bracket of LEVEL_BRACKETS) {
      groups.set(bracket.label, []);
    }

    for (const quest of quests) {
      const bracket = LEVEL_BRACKETS.find(
        (b) => quest.levelRequired >= b.min && quest.levelRequired <= b.max
      );
      if (bracket) {
        groups.get(bracket.label)!.push(quest);
      }
    }

    // Sort quests within each bracket by level, then by trader
    for (const [, questList] of groups) {
      questList.sort((a, b) => {
        if (a.levelRequired !== b.levelRequired) {
          return a.levelRequired - b.levelRequired;
        }
        return a.trader.name.localeCompare(b.trader.name);
      });
    }

    return groups;
  }, [quests]);

  // Calculate stats for each bracket
  const bracketStats = useMemo(() => {
    const stats = new Map<
      string,
      { total: number; completed: number; available: number }
    >();

    for (const bracket of LEVEL_BRACKETS) {
      const questList = questsByBracket.get(bracket.label) || [];
      stats.set(bracket.label, {
        total: questList.length,
        completed: questList.filter((q) => q.computedStatus === "completed")
          .length,
        available: questList.filter((q) => q.computedStatus === "available")
          .length,
      });
    }

    return stats;
  }, [questsByBracket]);

  // Determine which bracket the player is currently in
  const currentBracketLabel = useMemo(() => {
    if (!playerLevel) return null;
    const bracket = LEVEL_BRACKETS.find(
      (b) => playerLevel >= b.min && playerLevel <= b.max
    );
    return bracket?.label || null;
  }, [playerLevel]);

  return (
    <div className="h-full overflow-auto">
      <div className="flex gap-2 p-4 min-w-max">
        {LEVEL_BRACKETS.map((bracket) => {
          const questList = questsByBracket.get(bracket.label) || [];
          const stats = bracketStats.get(bracket.label)!;
          const isCurrentBracket = bracket.label === currentBracketLabel;

          return (
            <div key={bracket.label} className="flex-shrink-0 w-48">
              {/* Column header */}
              <div
                className={`sticky top-0 z-10 p-2 rounded-t-lg border-b-2 ${
                  isCurrentBracket
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <div className="font-semibold text-sm">{bracket.label}</div>
                <div className="text-xs text-gray-500">
                  {stats.completed}/{stats.total} completed
                  {stats.available > 0 && (
                    <span className="text-blue-600 ml-1">
                      ({stats.available} available)
                    </span>
                  )}
                </div>
              </div>

              {/* Quest cards */}
              <div className="space-y-2 p-2 bg-gray-50/50 min-h-[200px] rounded-b-lg">
                {questList.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No quests
                  </div>
                ) : (
                  questList.map((quest) => (
                    <LevelQuestCard
                      key={quest.id}
                      quest={quest}
                      playerLevel={playerLevel}
                      onStatusChange={onStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

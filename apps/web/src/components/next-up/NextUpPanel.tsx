"use client";

import { useMemo } from "react";
import {
  Lightbulb,
  ChevronRight,
  Star,
  Map as MapIcon,
  Zap,
} from "lucide-react";
import { getTraderColor } from "@/lib/trader-colors";
import type { QuestWithProgress } from "@/types";

interface NextUpPanelProps {
  quests: QuestWithProgress[];
  playerLevel?: number | null;
  onQuestClick?: (questId: string) => void;
}

interface QuestSuggestion {
  quest: QuestWithProgress;
  reason: string;
  priority: number;
  icon: "level" | "chain" | "map" | "kappa";
}

export function NextUpPanel({
  quests,
  playerLevel,
  onQuestClick,
}: NextUpPanelProps) {
  // Calculate quest suggestions
  const suggestions = useMemo(() => {
    const results: QuestSuggestion[] = [];

    // Get available quests only
    const availableQuests = quests.filter(
      (q) =>
        q.computedStatus === "available" || q.computedStatus === "in_progress"
    );

    // 1. At-level quests (highest priority)
    if (playerLevel) {
      const atLevelQuests = availableQuests.filter(
        (q) =>
          q.levelRequired <= playerLevel && q.levelRequired >= playerLevel - 5
      );
      for (const quest of atLevelQuests.slice(0, 3)) {
        results.push({
          quest,
          reason: `Perfect for level ${playerLevel}`,
          priority: 100 - Math.abs(playerLevel - quest.levelRequired),
          icon: "level",
        });
      }
    }

    // 2. Kappa-required quests (high priority)
    const kappaQuests = availableQuests.filter((q) => q.kappaRequired);
    for (const quest of kappaQuests.slice(0, 2)) {
      if (!results.find((r) => r.quest.id === quest.id)) {
        results.push({
          quest,
          reason: "Required for Kappa",
          priority: 90,
          icon: "kappa",
        });
      }
    }

    // 3. Quests that unlock many others (chain starters)
    const unlockCounts = new Map<string, number>();
    for (const quest of quests) {
      for (const dep of quest.dependsOn || []) {
        const count = unlockCounts.get(dep.requiredQuest.id) || 0;
        unlockCounts.set(dep.requiredQuest.id, count + 1);
      }
    }

    const chainStarters = availableQuests
      .filter((q) => (unlockCounts.get(q.id) || 0) >= 2)
      .sort(
        (a, b) => (unlockCounts.get(b.id) || 0) - (unlockCounts.get(a.id) || 0)
      );

    for (const quest of chainStarters.slice(0, 2)) {
      if (!results.find((r) => r.quest.id === quest.id)) {
        const unlocks = unlockCounts.get(quest.id) || 0;
        results.push({
          quest,
          reason: `Unlocks ${unlocks} quest${unlocks > 1 ? "s" : ""}`,
          priority: 80 + unlocks,
          icon: "chain",
        });
      }
    }

    // 4. Map efficiency - find map with most available objectives
    const mapCounts = new Map<string, number>();
    for (const quest of availableQuests) {
      for (const obj of quest.objectives || []) {
        if (obj.map) {
          mapCounts.set(obj.map, (mapCounts.get(obj.map) || 0) + 1);
        }
      }
    }

    const topMap = Array.from(mapCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (topMap) {
      const mapQuests = availableQuests.filter((q) =>
        (q.objectives || []).some((obj) => obj.map === topMap[0])
      );
      for (const quest of mapQuests.slice(0, 2)) {
        if (!results.find((r) => r.quest.id === quest.id)) {
          results.push({
            quest,
            reason: `${topMap[0]} efficiency`,
            priority: 70,
            icon: "map",
          });
        }
      }
    }

    // Sort by priority and limit
    return results.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [quests, playerLevel]);

  const getIcon = (icon: QuestSuggestion["icon"]) => {
    switch (icon) {
      case "level":
        return <Zap className="w-3 h-3 text-emerald-400" />;
      case "kappa":
        return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
      case "chain":
        return <ChevronRight className="w-3 h-3 text-blue-400" />;
      case "map":
        return <MapIcon className="w-3 h-3 text-purple-400" />;
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-[#d4a574]" />
        <span className="text-sm font-medium">Next Up</span>
      </div>

      <div className="space-y-2">
        {suggestions.map(({ quest, reason, icon }) => {
          const colors = getTraderColor(quest.traderId);
          // Get the primary map for this quest (most common map in objectives)
          const mapCounts = new Map<string, number>();
          for (const obj of quest.objectives || []) {
            if (obj.map) {
              mapCounts.set(obj.map, (mapCounts.get(obj.map) || 0) + 1);
            }
          }
          const primaryMap = Array.from(mapCounts.entries()).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0];

          return (
            <button
              key={quest.id}
              type="button"
              onClick={() => onQuestClick?.(quest.id)}
              className="w-full text-left p-2 rounded hover:bg-muted transition-colors group"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                    {quest.title}
                  </div>
                  {/* Trader and Map info */}
                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                    <span
                      className="font-medium"
                      style={{ color: colors.primary }}
                    >
                      {quest.trader.name}
                    </span>
                    {primaryMap && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {primaryMap}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Reason row */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    {getIcon(icon)}
                    <span>{reason}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NextUpPanel;

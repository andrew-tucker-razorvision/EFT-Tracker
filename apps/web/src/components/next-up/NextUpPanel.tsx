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
  icon: "level" | "chain" | "map" | "kappa" | "momentum" | "trader";
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
      (q) => q.computedStatus === "available"
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

    // 5. Chain completion momentum - quests in nearly-done chains
    const chainProgress = calculateChainCompletionProgress(
      quests,
      availableQuests
    );
    const momentumQuests = availableQuests.filter((q) => {
      const progress = chainProgress.get(q.id);
      return progress && progress.completionRate >= 0.6;
    });

    for (const quest of momentumQuests.slice(0, 2)) {
      if (!results.find((r) => r.quest.id === quest.id)) {
        const progress = chainProgress.get(quest.id)!;
        results.push({
          quest,
          reason: `${progress.completed}/${progress.total} in chain - finish it!`,
          priority: 85 + progress.completionRate * 10,
          icon: "momentum",
        });
      }
    }

    // 6. Map synergy - boost quests on the same map as other available quests
    const mapSynergyCounts = calculateMapSynergy(availableQuests);
    const synergyQuests = availableQuests
      .filter((q) => {
        const maps = (q.objectives || [])
          .map((o) => o.map)
          .filter((m): m is string => Boolean(m));
        return maps.some((m) => (mapSynergyCounts.get(m) || 0) >= 3);
      })
      .sort((a, b) => {
        const aMaps = (a.objectives || [])
          .map((o) => o.map)
          .filter((m): m is string => Boolean(m));
        const bMaps = (b.objectives || [])
          .map((o) => o.map)
          .filter((m): m is string => Boolean(m));
        const aMax =
          aMaps.length > 0
            ? Math.max(...aMaps.map((m) => mapSynergyCounts.get(m) || 0))
            : 0;
        const bMax =
          bMaps.length > 0
            ? Math.max(...bMaps.map((m) => mapSynergyCounts.get(m) || 0))
            : 0;
        return bMax - aMax;
      });

    for (const quest of synergyQuests.slice(0, 2)) {
      if (!results.find((r) => r.quest.id === quest.id)) {
        const maps = (quest.objectives || [])
          .map((o) => o.map)
          .filter((m): m is string => Boolean(m));
        const maxSynergy =
          maps.length > 0
            ? Math.max(...maps.map((m) => mapSynergyCounts.get(m) || 0))
            : 0;
        const primaryMap = maps.find(
          (m) => mapSynergyCounts.get(m) === maxSynergy
        );
        results.push({
          quest,
          reason: `${maxSynergy} quests on ${primaryMap} - efficient!`,
          priority: 75 + Math.min(maxSynergy, 10),
          icon: "map",
        });
      }
    }

    // 7. Trader completion progress
    const traderProgress = calculateTraderProgress(quests);
    const traderQuests = availableQuests
      .filter((q) => (traderProgress.get(q.traderId) || 0) >= 0.7)
      .sort(
        (a, b) =>
          (traderProgress.get(b.traderId) || 0) -
          (traderProgress.get(a.traderId) || 0)
      );

    for (const quest of traderQuests.slice(0, 1)) {
      if (!results.find((r) => r.quest.id === quest.id)) {
        const progress = traderProgress.get(quest.traderId)!;
        results.push({
          quest,
          reason: `${Math.round(progress * 100)}% ${quest.trader.name} done`,
          priority: 70 + progress * 5,
          icon: "trader",
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

    // Apply type diversity filter before sorting
    const diverse = applyTypeDiversityFilter(results);
    return diverse.sort((a, b) => b.priority - a.priority).slice(0, 5);
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
      case "momentum":
        return <Zap className="w-3 h-3 text-orange-400" />;
      case "trader":
        return <Star className="w-3 h-3 text-cyan-400" />;
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
        <InfoTooltip />
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

function InfoTooltip() {
  return (
    <div className="group relative">
      <button
        type="button"
        title="How Next Up Works"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute left-0 top-full mt-2 w-64 bg-popover border rounded-lg p-3 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
        <p className="font-medium mb-2">How Next Up Works</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Your level and available quests</li>
          <li>• Kappa requirements</li>
          <li>• Quest chains and dependencies</li>
          <li>• Map efficiency and synergy</li>
          <li>• Your trader progress</li>
        </ul>
      </div>
    </div>
  );
}

function calculateChainCompletionProgress(
  allQuests: QuestWithProgress[],
  availableQuests: QuestWithProgress[]
): Map<string, { completed: number; total: number; completionRate: number }> {
  const chainProgress = new Map();

  for (const quest of availableQuests) {
    const chain = findQuestChain(quest, allQuests);
    const completed = chain.filter(
      (q) => q.computedStatus === "completed"
    ).length;
    const total = chain.length;
    const completionRate = total > 0 ? completed / total : 0;

    chainProgress.set(quest.id, { completed, total, completionRate });
  }

  return chainProgress;
}

function findQuestChain(
  quest: QuestWithProgress,
  allQuests: QuestWithProgress[]
): QuestWithProgress[] {
  const chain = new Set<string>([quest.id]);

  const addPrerequisites = (q: QuestWithProgress) => {
    for (const dep of q.dependsOn || []) {
      if (!chain.has(dep.requiredQuest.id)) {
        chain.add(dep.requiredQuest.id);
        const prereq = allQuests.find((aq) => aq.id === dep.requiredQuest.id);
        if (prereq) addPrerequisites(prereq);
      }
    }
  };

  addPrerequisites(quest);

  return allQuests.filter((q) => chain.has(q.id));
}

function calculateMapSynergy(
  availableQuests: QuestWithProgress[]
): Map<string, number> {
  const mapCounts = new Map<string, number>();

  for (const quest of availableQuests) {
    for (const obj of quest.objectives || []) {
      if (obj.map) {
        mapCounts.set(obj.map, (mapCounts.get(obj.map) || 0) + 1);
      }
    }
  }

  return mapCounts;
}

function calculateTraderProgress(
  allQuests: QuestWithProgress[]
): Map<string, number> {
  const traderStats = new Map<string, { completed: number; total: number }>();

  for (const quest of allQuests) {
    const stats = traderStats.get(quest.traderId) || { completed: 0, total: 0 };
    stats.total++;
    if (quest.computedStatus === "completed") {
      stats.completed++;
    }
    traderStats.set(quest.traderId, stats);
  }

  const traderProgress = new Map<string, number>();
  for (const [traderId, stats] of traderStats.entries()) {
    traderProgress.set(traderId, stats.completed / stats.total);
  }

  return traderProgress;
}

function applyTypeDiversityFilter(
  suggestions: QuestSuggestion[]
): QuestSuggestion[] {
  const maxPerType = 2;
  const typeCounts = new Map<string, number>();
  const diverse: QuestSuggestion[] = [];

  for (const suggestion of suggestions) {
    const type = suggestion.quest.questType;
    const count = typeCounts.get(type) || 0;

    if (count < maxPerType) {
      diverse.push(suggestion);
      typeCounts.set(type, count + 1);
    }
  }

  return diverse;
}

export default NextUpPanel;

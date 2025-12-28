"use client";

import { useMemo } from "react";
import { LevelQuestCard } from "./LevelQuestCard";
import { NextUpPanel } from "@/components/next-up";
import type { QuestWithProgress, QuestStatus } from "@/types";

// Maps in standard order (matching QuestFilters.tsx)
const MAPS = [
  "Factory",
  "Customs",
  "Woods",
  "Shoreline",
  "Interchange",
  "Reserve",
  "Labs",
  "Lighthouse",
  "Streets of Tarkov",
  "Ground Zero",
];

// Special category for quests with no map-specific objectives
const ANY_LOCATION = "Any Location";

interface MapGroupsViewProps {
  quests: QuestWithProgress[];
  allQuests?: QuestWithProgress[];
  playerLevel?: number | null;
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onQuestDetails?: (questId: string) => void;
}

export function MapGroupsView({
  quests,
  allQuests,
  playerLevel,
  onStatusChange,
  onQuestDetails,
}: MapGroupsViewProps) {
  // Group quests by map (a quest can appear in multiple maps)
  const questsByMap = useMemo(() => {
    const groups = new Map<string, QuestWithProgress[]>();

    // Initialize all map groups
    for (const map of MAPS) {
      groups.set(map, []);
    }
    groups.set(ANY_LOCATION, []);

    for (const quest of quests) {
      // Get unique maps from quest objectives
      const questMaps = new Set<string>();
      for (const obj of quest.objectives || []) {
        if (obj.map) {
          questMaps.add(obj.map);
        }
      }

      if (questMaps.size === 0) {
        // No map-specific objectives - goes in "Any Location"
        groups.get(ANY_LOCATION)!.push(quest);
      } else {
        // Add quest to each map where it has objectives
        for (const map of questMaps) {
          if (groups.has(map)) {
            groups.get(map)!.push(quest);
          }
        }
      }
    }

    // Sort quests within each group by level, then by trader
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

  // Calculate stats for each map
  const mapStats = useMemo(() => {
    const stats = new Map<
      string,
      { total: number; completed: number; available: number }
    >();

    const allMaps = [...MAPS, ANY_LOCATION];
    for (const map of allMaps) {
      const questList = questsByMap.get(map) || [];
      stats.set(map, {
        total: questList.length,
        completed: questList.filter((q) => q.computedStatus === "completed")
          .length,
        available: questList.filter((q) => q.computedStatus === "available")
          .length,
      });
    }

    return stats;
  }, [questsByMap]);

  // Get ordered list of maps (standard maps + Any Location at end)
  const orderedMaps = [...MAPS, ANY_LOCATION];

  // Quests for NextUpPanel
  const nextUpQuests = allQuests ?? [];

  // Handler for clicking a quest in the NextUpPanel
  const handleNextUpQuestClick = (questId: string) => {
    onQuestDetails?.(questId);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex gap-2 p-4 min-w-max">
        {/* Next Up Panel - sticky first column */}
        {nextUpQuests && nextUpQuests.length > 0 && (
          <div className="flex-shrink-0 w-48 sticky left-4 z-20">
            <NextUpPanel
              quests={nextUpQuests}
              playerLevel={playerLevel}
              onQuestClick={handleNextUpQuestClick}
            />
          </div>
        )}
        {orderedMaps.map((map) => {
          const questList = questsByMap.get(map) || [];
          const stats = mapStats.get(map)!;

          // Skip empty maps (except Any Location which might be useful to show)
          if (questList.length === 0 && map !== ANY_LOCATION) {
            return null;
          }

          return (
            <div key={map} className="flex-shrink-0 w-36 sm:w-48">
              {/* Column header */}
              <div
                className="sticky top-0 z-10 p-2 rounded-t-lg border-b-2"
                style={{
                  backgroundColor: "#383945",
                  borderColor: stats.available > 0 ? "#0292c0" : "#636363",
                }}
              >
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#c7c5b3" }}
                >
                  {map}
                </div>
                <div className="text-xs" style={{ color: "#636363" }}>
                  {stats.completed}/{stats.total} completed
                  {stats.available > 0 && (
                    <span style={{ color: "#0292c0" }} className="ml-1">
                      ({stats.available} available)
                    </span>
                  )}
                </div>
              </div>

              {/* Quest cards */}
              <div
                className="space-y-2 p-2 min-h-[200px] rounded-b-lg"
                style={{ backgroundColor: "rgba(56, 57, 69, 0.5)" }}
              >
                {questList.length === 0 ? (
                  <div
                    className="text-xs text-center py-4"
                    style={{ color: "#636363" }}
                  >
                    No quests
                  </div>
                ) : (
                  questList.map((quest) => (
                    <LevelQuestCard
                      key={quest.id}
                      quest={quest}
                      playerLevel={playerLevel}
                      onStatusChange={onStatusChange}
                      onQuestDetails={onQuestDetails}
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

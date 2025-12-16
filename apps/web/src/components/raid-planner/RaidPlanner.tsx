"use client";

import { useState, useMemo } from "react";
import { MapPin, Circle, Info, Lightbulb } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTraderColor } from "@/lib/trader-colors";
import type { QuestWithProgress } from "@/types";

// Maps in standard order
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

interface MapSuggestion {
  map: string;
  questCount: number;
  objectiveCount: number;
}

interface RaidPlannerProps {
  quests: QuestWithProgress[];
  onQuestDetails?: (questId: string) => void;
}

interface QuestObjective {
  questId: string;
  questTitle: string;
  traderId: string;
  traderName: string;
  objective: string;
  isCompleted: boolean;
}

export function RaidPlanner({ quests, onQuestDetails }: RaidPlannerProps) {
  const [selectedMap, setSelectedMap] = useState<string>(MAPS[1]); // Default to Customs

  // Get available quests for the selected map with their objectives
  const raidObjectives = useMemo(() => {
    const objectives: QuestObjective[] = [];

    // Filter to only available/in_progress quests
    const availableQuests = quests.filter(
      (q) =>
        q.computedStatus === "available" || q.computedStatus === "in_progress"
    );

    for (const quest of availableQuests) {
      // Find objectives for this map
      const mapObjectives = (quest.objectives || []).filter(
        (obj) => obj.map === selectedMap || obj.map === null
      );

      for (const obj of mapObjectives) {
        // Only include map-specific objectives, or "any location" objectives if map is selected
        if (obj.map === selectedMap) {
          objectives.push({
            questId: quest.id,
            questTitle: quest.title,
            traderId: quest.traderId,
            traderName: quest.trader.name,
            objective: obj.description,
            isCompleted: quest.computedStatus === "completed",
          });
        }
      }
    }

    // Sort by trader, then quest title
    objectives.sort((a, b) => {
      if (a.traderName !== b.traderName) {
        return a.traderName.localeCompare(b.traderName);
      }
      return a.questTitle.localeCompare(b.questTitle);
    });

    return objectives;
  }, [quests, selectedMap]);

  // Group objectives by quest
  const objectivesByQuest = useMemo(() => {
    const grouped = new Map<
      string,
      { quest: QuestObjective; objectives: string[] }
    >();

    for (const obj of raidObjectives) {
      const existing = grouped.get(obj.questId);
      if (existing) {
        existing.objectives.push(obj.objective);
      } else {
        grouped.set(obj.questId, {
          quest: obj,
          objectives: [obj.objective],
        });
      }
    }

    return Array.from(grouped.values());
  }, [raidObjectives]);

  // Count quests and objectives
  const stats = useMemo(() => {
    return {
      questCount: objectivesByQuest.length,
      objectiveCount: raidObjectives.length,
    };
  }, [objectivesByQuest, raidObjectives]);

  // Calculate map suggestions (maps with most available objectives)
  const mapSuggestions = useMemo(() => {
    const suggestions: MapSuggestion[] = [];
    const availableQuests = quests.filter(
      (q) =>
        q.computedStatus === "available" || q.computedStatus === "in_progress"
    );

    for (const map of MAPS) {
      let objectiveCount = 0;
      const questsOnMap = new Set<string>();

      for (const quest of availableQuests) {
        for (const obj of quest.objectives || []) {
          if (obj.map === map) {
            objectiveCount++;
            questsOnMap.add(quest.id);
          }
        }
      }

      if (objectiveCount > 0) {
        suggestions.push({
          map,
          questCount: questsOnMap.size,
          objectiveCount,
        });
      }
    }

    // Sort by objective count descending
    return suggestions
      .sort((a, b) => b.objectiveCount - a.objectiveCount)
      .slice(0, 5);
  }, [quests]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#d4a574]" />
            <h2 className="font-semibold">Raid Planner</h2>
          </div>

          <Select value={selectedMap} onValueChange={setSelectedMap}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select map" />
            </SelectTrigger>
            <SelectContent>
              {MAPS.map((map) => (
                <SelectItem key={map} value={map}>
                  {map}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {stats.questCount} quest{stats.questCount !== 1 ? "s" : ""},{" "}
            {stats.objectiveCount} objective
            {stats.objectiveCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto flex">
        {/* Objectives list */}
        <div className="flex-1 p-4 overflow-auto">
          {objectivesByQuest.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                No available objectives for {selectedMap}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Complete other quests or select a different map
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {objectivesByQuest.map(({ quest, objectives }) => {
                const colors = getTraderColor(quest.traderId);
                return (
                  <div
                    key={quest.questId}
                    className="bg-card rounded-lg border p-4"
                  >
                    {/* Quest header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {quest.questTitle}
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: colors.primary }}
                          >
                            {quest.traderName}
                          </p>
                        </div>
                      </div>
                      {onQuestDetails && (
                        <button
                          onClick={() => onQuestDetails(quest.questId)}
                          className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                          title="View quest details"
                        >
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    {/* Objectives */}
                    <div className="space-y-2">
                      {objectives.map((objective, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            {objective}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggestions sidebar (desktop only) */}
        {mapSuggestions.length > 0 && (
          <div className="hidden lg:block w-64 border-l p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-[#d4a574]" />
              <span className="text-sm font-medium">Suggested Maps</span>
            </div>

            <div className="space-y-2">
              {mapSuggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.map}
                  onClick={() => setSelectedMap(suggestion.map)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedMap === suggestion.map
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {suggestion.map}
                    </span>
                    {idx === 0 && selectedMap !== suggestion.map && (
                      <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {suggestion.questCount} quest
                    {suggestion.questCount !== 1 ? "s" : ""},{" "}
                    {suggestion.objectiveCount} objective
                    {suggestion.objectiveCount !== 1 ? "s" : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RaidPlanner;

"use client";

import { Button } from "@/components/ui/button";
import { GitBranch, Calendar, Map, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("trader-lanes")}
        title="View quests organized by trader"
        className={cn(
          "h-10 px-3",
          viewMode === "trader-lanes" && "bg-background shadow-sm"
        )}
      >
        <GitBranch className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Traders</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("level-timeline")}
        title="View quests organized by level"
        className={cn(
          "h-10 px-3",
          viewMode === "level-timeline" && "bg-background shadow-sm"
        )}
      >
        <Calendar className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Levels</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("map-groups")}
        title="View quests organized by map"
        className={cn(
          "h-10 px-3",
          viewMode === "map-groups" && "bg-background shadow-sm"
        )}
      >
        <Map className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Maps</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("raid-planner")}
        title="Plan your next raid - objectives by map"
        className={cn(
          "h-10 px-3",
          viewMode === "raid-planner" && "bg-background shadow-sm"
        )}
      >
        <ClipboardList className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Raid</span>
      </Button>
    </div>
  );
}

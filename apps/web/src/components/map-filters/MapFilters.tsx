"use client";

import { useEffect, useRef, useCallback } from "react";
import { ProgressStats } from "@/components/progress-stats";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserPrefs } from "@/hooks/useUserPrefs";
import { getTraderColor } from "@/lib/trader-colors";
import type {
  Trader,
  QuestFilters as Filters,
  QuestWithProgress,
} from "@/types";

interface MapFiltersProps {
  traders: Trader[];
  quests: QuestWithProgress[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
}

export function MapFilters({
  traders,
  quests,
  filters,
  onFilterChange,
  onApplyFilters,
}: MapFiltersProps) {
  const updatePrefsMutation = useUpdateUserPrefs();

  // Stable ref for onApplyFilters to avoid infinite loops
  const onApplyFiltersRef = useRef(onApplyFilters);
  useEffect(() => {
    onApplyFiltersRef.current = onApplyFilters;
  });

  // Auto-save player level when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.playerLevel !== undefined && filters.playerLevel !== null) {
        updatePrefsMutation.mutate({ playerLevel: filters.playerLevel });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.playerLevel]); // mutation.mutate() is stable and doesn't need to be in deps

  // Auto-apply filter change
  const handleFilterChange = useCallback(
    (update: Partial<Filters>) => {
      onFilterChange(update);
      setTimeout(() => onApplyFiltersRef.current(), 0);
    },
    [onFilterChange]
  );

  // Debounced level change (don't auto-apply immediately while typing)
  const levelChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleLevelChange = useCallback(
    (level: number | null) => {
      onFilterChange({ playerLevel: level });

      if (levelChangeTimerRef.current) {
        clearTimeout(levelChangeTimerRef.current);
      }
      levelChangeTimerRef.current = setTimeout(() => {
        onApplyFiltersRef.current();
      }, 500);
    },
    [onFilterChange]
  );

  return (
    <div className="bg-background border-b">
      {/* Desktop & Mobile Layout - single row */}
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Trader */}
          <Select
            value={filters.traderId || "all"}
            onValueChange={(value) =>
              handleFilterChange({
                traderId: value === "all" ? null : value,
              })
            }
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All Traders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Traders</SelectItem>
              {traders.map((trader) => (
                <SelectItem key={trader.id} value={trader.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getTraderColor(trader.id).primary,
                      }}
                    />
                    {trader.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level */}
          <div className="flex items-center gap-2">
            <Label htmlFor="player-level" className="text-sm whitespace-nowrap">
              Level:
            </Label>
            <input
              id="player-level"
              type="number"
              min={1}
              max={79}
              placeholder="1-79"
              value={filters.playerLevel ?? ""}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const level = isNaN(val)
                  ? null
                  : Math.min(79, Math.max(1, val));
                handleLevelChange(level);
              }}
              className="h-9 w-16 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Kappa */}
          <div className="flex items-center gap-1.5">
            <Switch
              id="kappa-only"
              checked={filters.kappaOnly}
              onCheckedChange={(checked) =>
                handleFilterChange({ kappaOnly: checked })
              }
            />
            <Label
              htmlFor="kappa-only"
              className="text-sm cursor-pointer whitespace-nowrap"
            >
              Kappa Only
            </Label>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="hidden sm:block">
          <ProgressStats quests={quests} traders={traders} />
        </div>
      </div>
    </div>
  );
}

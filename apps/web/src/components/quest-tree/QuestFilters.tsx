// @ts-nocheck - React 19 Input component type compatibility
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Filter } from "lucide-react";
import { ProgressStats } from "@/components/progress-stats";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserPrefs } from "@/hooks/useUserPrefs";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { ActiveFilterChips } from "./ActiveFilterChips";
import type {
  Trader,
  QuestFilters as Filters,
  QuestWithProgress,
} from "@/types";

interface QuestFiltersProps {
  traders: Trader[];
  quests: QuestWithProgress[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
  hasPendingChanges: boolean;
  prefsLoaded?: boolean; // Indicates user prefs have loaded (prevents saving on initial load)
}

export function QuestFilters({
  traders,
  quests,
  filters,
  onFilterChange,
  onApplyFilters,
  prefsLoaded = false,
}: QuestFiltersProps) {
  const updatePrefsMutation = useUpdateUserPrefs();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stable ref for onApplyFilters to avoid infinite loops
  const onApplyFiltersRef = useRef(onApplyFilters);
  useEffect(() => {
    onApplyFiltersRef.current = onApplyFilters;
  });

  // Track if initial prefs have been applied (to prevent overwriting saved prefs on load)
  const prefsApplied = useRef(false);

  // Auto-save player level when it changes (debounced)
  // Skip on initial load to avoid overwriting saved prefs before they load
  useEffect(() => {
    // Don't save until prefs have loaded
    if (!prefsLoaded) return;

    // Skip the first change after prefs load (that's the load itself, not user action)
    if (!prefsApplied.current) {
      prefsApplied.current = true;
      return;
    }

    const timer = setTimeout(() => {
      if (filters.playerLevel !== undefined && filters.playerLevel !== null) {
        updatePrefsMutation.mutate({ playerLevel: filters.playerLevel });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.playerLevel, prefsLoaded]); // mutation.mutate() is stable and doesn't need to be in deps

  // Debounce search input and auto-apply
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue });
        // Use ref to avoid dependency on onApplyFilters
        setTimeout(() => onApplyFiltersRef.current(), 100);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange]);

  // Keyboard shortcut: "/" to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = () => {
    setSearchValue("");
    onFilterChange({
      statuses: ["available", "locked"], // Default to showing available and locked quests
      search: "",
      kappaOnly: false,
      playerLevel: 1,
      map: null,
    });
    setTimeout(() => onApplyFiltersRef.current(), 0);
  };

  // Auto-apply filter change (immediate apply after state update)
  const handleFilterChange = useCallback(
    (update: Partial<Filters>) => {
      onFilterChange(update);
      setTimeout(() => onApplyFiltersRef.current(), 0);
    },
    [onFilterChange]
  );

  // Debounced level change (auto-apply after 500ms)
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

  // Handle removal of individual filter from chips (auto-apply)
  const handleRemoveFilter = (key: keyof Filters, value?: string) => {
    if (key === "statuses" && value) {
      const newStatuses = filters.statuses.filter((s) => s !== value);
      handleFilterChange({ statuses: newStatuses });
    } else if (key === "kappaOnly") {
      handleFilterChange({ kappaOnly: false });
    } else if (key === "playerLevel") {
      handleFilterChange({ playerLevel: 1 });
    } else if (key === "map") {
      handleFilterChange({ map: null });
    }
  };

  // Get unique maps from all quest objectives
  const availableMaps = useMemo(() => {
    const mapSet = new Set<string>();
    for (const quest of quests) {
      if (quest.objectives) {
        for (const obj of quest.objectives) {
          if (obj.map) {
            mapSet.add(obj.map);
          }
        }
      }
    }
    return Array.from(mapSet).sort();
  }, [quests]);

  // Count all active filters (for chips and mobile badge)
  const activeFilterCount = [
    filters.statuses.length > 0 ? filters.statuses : null,
    filters.kappaOnly,
    filters.playerLevel !== 1 ? filters.playerLevel : null,
    filters.map,
  ].filter(Boolean).length;

  return (
    <div className="bg-background border-b">
      {/* MOBILE LAYOUT */}
      <div className="md:hidden">
        {/* Row 1: Search + Filter Button */}
        <div className="flex gap-2 px-4 py-2">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Search quests..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9"
            />
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative h-9 px-3">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[85vh]">
              <SheetHeader>
                <SheetTitle>Filter Quests</SheetTitle>
                <SheetDescription className="sr-only">
                  Filter quests by status, level, and more
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4 overflow-y-auto">
                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">
                    <StatusMultiSelect
                      selectedStatuses={filters.statuses}
                      onChange={(statuses) => handleFilterChange({ statuses })}
                    />
                  </div>
                </div>

                {/* Kappa Only */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="kappa-mobile"
                    className="text-sm cursor-pointer"
                  >
                    Kappa Required Only
                  </Label>
                  <Switch
                    id="kappa-mobile"
                    checked={filters.kappaOnly}
                    onCheckedChange={(checked) =>
                      handleFilterChange({ kappaOnly: checked })
                    }
                  />
                </div>

                {/* Player Level */}
                <div className="space-y-2">
                  <Label className="text-sm">Player Level</Label>
                  <Input
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
                    className="h-9 w-20"
                  />
                </div>

                {/* Map Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Map</Label>
                  <Select
                    value={filters.map ?? "all"}
                    onValueChange={(value) =>
                      handleFilterChange({
                        map: value === "all" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="All maps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All maps</SelectItem>
                      {availableMaps.map((map) => (
                        <SelectItem key={map} value={map}>
                          {map}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset button */}
                <div className="pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Reset All
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filter chips (mobile) */}
        {activeFilterCount > 0 && (
          <div className="px-4 pb-2 overflow-x-auto">
            <ActiveFilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleReset}
            />
          </div>
        )}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block">
        {/* Primary filters row */}
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="w-[200px]">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search quests... (press /)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Status */}
            <StatusMultiSelect
              selectedStatuses={filters.statuses}
              onChange={(statuses) => handleFilterChange({ statuses })}
            />

            {/* Kappa Only */}
            <div className="flex items-center gap-1.5">
              <Switch
                id="kappa-desktop"
                checked={filters.kappaOnly}
                onCheckedChange={(checked) =>
                  handleFilterChange({ kappaOnly: checked })
                }
              />
              <Label
                htmlFor="kappa-desktop"
                className="text-sm cursor-pointer whitespace-nowrap"
              >
                Kappa
              </Label>
            </div>

            {/* Level */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="player-level-desktop"
                className="text-sm whitespace-nowrap"
              >
                Level:
              </Label>
              <Input
                id="player-level-desktop"
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
                className="h-9 w-16"
              />
            </div>

            {/* Map Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Map:</Label>
              <Select
                value={filters.map ?? "all"}
                onValueChange={(value) =>
                  handleFilterChange({ map: value === "all" ? null : value })
                }
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="All maps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All maps</SelectItem>
                  {availableMaps.map((map) => (
                    <SelectItem key={map} value={map}>
                      {map}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress Stats */}
          <ProgressStats quests={quests} traders={traders} />
        </div>

        {/* Active filter chips (desktop) */}
        {activeFilterCount > 0 && (
          <div className="px-4 pb-2">
            <ActiveFilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

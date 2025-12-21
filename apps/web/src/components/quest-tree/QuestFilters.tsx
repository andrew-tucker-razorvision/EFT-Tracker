// @ts-nocheck - React 19 Input component type compatibility
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { SlidersHorizontal, Filter } from "lucide-react";
import { ProgressStats } from "@/components/progress-stats";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { QuestTypeMultiSelect } from "./QuestTypeMultiSelect";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { getTraderColor } from "@/lib/trader-colors";
import type {
  Trader,
  QuestFilters as Filters,
  QuestWithProgress,
} from "@/types";

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

const COLUMNS_OPTIONS: { value: number | null; label: string }[] = [
  { value: 3, label: "3 columns" },
  { value: 5, label: "5 columns" },
  { value: 10, label: "10 columns" },
  { value: null, label: "All columns" },
];

interface QuestFiltersProps {
  traders: Trader[];
  quests: QuestWithProgress[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
  hasPendingChanges: boolean;
  hiddenByLevelCount: number;
}

// Advanced filters in popover
interface AdvancedFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
  hasPendingChanges: boolean;
  onReset: () => void;
  isMobile?: boolean;
}

function AdvancedFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  hasPendingChanges,
  onReset,
  isMobile = false,
}: AdvancedFiltersProps) {
  return (
    <div className={`space-y-4 ${isMobile ? "" : "w-[280px]"}`}>
      <div className="text-sm font-medium">Advanced Filters</div>

      {/* Kappa Only */}
      <div className="flex items-center justify-between">
        <Label htmlFor="kappa-advanced" className="text-sm cursor-pointer">
          Kappa Required Only
        </Label>
        <Switch
          id="kappa-advanced"
          checked={filters.kappaOnly}
          onCheckedChange={(checked) => onFilterChange({ kappaOnly: checked })}
        />
      </div>

      {/* Player Level */}
      <div className="space-y-2">
        <Label className="text-sm">Player Level</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={1}
            max={79}
            placeholder="1-79"
            value={filters.playerLevel ?? ""}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              const level = isNaN(val) ? null : Math.min(79, Math.max(1, val));
              onFilterChange({ playerLevel: level });
            }}
            className="h-9 w-20"
            disabled={filters.bypassLevelRequirement}
          />
          <div className="flex items-center gap-1.5">
            <Switch
              id="bypass-advanced"
              checked={filters.bypassLevelRequirement}
              onCheckedChange={(checked) =>
                onFilterChange({ bypassLevelRequirement: checked })
              }
            />
            <Label
              htmlFor="bypass-advanced"
              className="text-xs cursor-pointer whitespace-nowrap"
            >
              Bypass
            </Label>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="space-y-2">
        <Label className="text-sm">Display Columns</Label>
        <Select
          value={filters.questsPerTree?.toString() ?? "all"}
          onValueChange={(value) => {
            const numValue = value === "all" ? null : parseInt(value);
            onFilterChange({ questsPerTree: numValue });
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="5 columns" />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value?.toString() ?? "all"}
                value={option.value?.toString() ?? "all"}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          size="sm"
          onClick={onApplyFilters}
          disabled={!hasPendingChanges}
          className="flex-1"
        >
          Apply
          {hasPendingChanges && (
            <Badge className="ml-1 bg-white text-primary text-[10px] px-1">
              !
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset All
        </Button>
      </div>
    </div>
  );
}

export function QuestFilters({
  traders,
  quests,
  filters,
  onFilterChange,
  onApplyFilters,
  hasPendingChanges,
  hiddenByLevelCount,
}: QuestFiltersProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialPrefsLoaded = useRef(false);
  const prefsFullyLoaded = useRef(false); // True only after prefs fetch completes
  const lastSavedLevel = useRef<number | null>(null);
  const lastSavedQuestsPerTree = useRef<number | null>(5);
  const lastSavedBypassLevel = useRef<boolean>(false);

  // Stable ref for onApplyFilters to avoid infinite loops
  const onApplyFiltersRef = useRef(onApplyFilters);
  useEffect(() => {
    onApplyFiltersRef.current = onApplyFilters;
  });

  // Load user's saved preferences on mount (only for logged-in users)
  useEffect(() => {
    // For non-authenticated users, mark prefs as loaded immediately
    if (sessionStatus === "unauthenticated" && !prefsFullyLoaded.current) {
      prefsFullyLoaded.current = true;
    }

    if (sessionStatus === "authenticated" && !initialPrefsLoaded.current) {
      initialPrefsLoaded.current = true;
      fetch("/api/user")
        .then((res) => res.json())
        .then((data) => {
          const updates: Partial<Filters> = {};
          if (data.user?.playerLevel != null) {
            lastSavedLevel.current = data.user.playerLevel;
            updates.playerLevel = data.user.playerLevel;
          }
          if (data.user?.questsPerTree != null) {
            lastSavedQuestsPerTree.current = data.user.questsPerTree;
            updates.questsPerTree = data.user.questsPerTree;
          }
          if (data.user?.bypassLevelRequirement != null) {
            lastSavedBypassLevel.current = data.user.bypassLevelRequirement;
            updates.bypassLevelRequirement = data.user.bypassLevelRequirement;
          }
          if (Object.keys(updates).length > 0) {
            onFilterChange(updates);
            // Apply the loaded preferences immediately
            setTimeout(() => onApplyFiltersRef.current(), 0);
          }
          // Mark prefs as fully loaded after applying
          prefsFullyLoaded.current = true;
        })
        .catch((err) => {
          console.error("Failed to fetch user preferences:", err);
          prefsFullyLoaded.current = true; // Still mark as loaded on error
        });
    }
  }, [sessionStatus, onFilterChange]);

  // Auto-save player level when it changes (debounced, only for logged-in users)
  const savePlayerLevel = useCallback(
    async (level: number | null) => {
      if (!session?.user) return;
      if (level === lastSavedLevel.current) return;

      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerLevel: level }),
        });
        if (res.ok) {
          lastSavedLevel.current = level;
        }
      } catch (err) {
        console.error("Failed to save player level:", err);
      }
    },
    [session?.user]
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!prefsFullyLoaded.current) return; // Wait until prefs are fully loaded

    const timer = setTimeout(() => {
      savePlayerLevel(filters.playerLevel);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.playerLevel, sessionStatus, savePlayerLevel]);

  // Auto-save questsPerTree when it changes
  const saveQuestsPerTree = useCallback(
    async (count: number | null) => {
      if (!session?.user) return;
      if (count === lastSavedQuestsPerTree.current) return;

      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questsPerTree: count }),
        });
        if (res.ok) {
          lastSavedQuestsPerTree.current = count;
        }
      } catch (err) {
        console.error("Failed to save quests per tree:", err);
      }
    },
    [session?.user]
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!prefsFullyLoaded.current) return; // Wait until prefs are fully loaded

    const timer = setTimeout(() => {
      saveQuestsPerTree(filters.questsPerTree);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.questsPerTree, sessionStatus, saveQuestsPerTree]);

  // Auto-save bypassLevelRequirement when it changes
  const saveBypassLevelRequirement = useCallback(
    async (bypass: boolean) => {
      if (!session?.user) return;
      if (bypass === lastSavedBypassLevel.current) return;

      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bypassLevelRequirement: bypass }),
        });
        if (res.ok) {
          lastSavedBypassLevel.current = bypass;
        }
      } catch (err) {
        console.error("Failed to save bypass level requirement:", err);
      }
    },
    [session?.user]
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!prefsFullyLoaded.current) return; // Wait until prefs are fully loaded

    const timer = setTimeout(() => {
      saveBypassLevelRequirement(filters.bypassLevelRequirement);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    filters.bypassLevelRequirement,
    sessionStatus,
    saveBypassLevelRequirement,
  ]);

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
      traderId: null,
      statuses: ["available"], // Default to showing only available quests
      search: "",
      kappaOnly: false,
      map: null,
      playerLevel: 1,
      questsPerTree: 5,
      bypassLevelRequirement: false,
      questTypes: [],
      hideReputationQuests: true, // Default to hiding reputation quests
    });
    onApplyFilters();
  };

  // Auto-apply is intentionally disabled for primary filters (trader, status, map).
  // Users must click Apply button. This prevents:
  // 1. Excessive API calls while user is still selecting filters
  // 2. Render loops from filter state changes triggering refetches
  // Search input auto-applies with debounce (handled above)

  // Handle removal of individual filter from chips
  const handleRemoveFilter = (key: keyof Filters, value?: string) => {
    if (key === "statuses" && value) {
      const newStatuses = filters.statuses.filter((s) => s !== value);
      onFilterChange({ statuses: newStatuses });
    } else if (key === "traderId") {
      onFilterChange({ traderId: null });
    } else if (key === "map") {
      onFilterChange({ map: null });
    } else if (key === "kappaOnly") {
      onFilterChange({ kappaOnly: false });
    } else if (key === "playerLevel") {
      onFilterChange({ playerLevel: 1 });
    } else if (key === "bypassLevelRequirement") {
      onFilterChange({ bypassLevelRequirement: false });
    } else if (key === "questsPerTree") {
      onFilterChange({ questsPerTree: 5 });
    } else if (key === "questTypes" && value) {
      const newTypes = filters.questTypes.filter((t) => t !== value);
      onFilterChange({ questTypes: newTypes });
    } else if (key === "questTypes") {
      onFilterChange({ questTypes: [] });
    } else if (key === "hideReputationQuests") {
      onFilterChange({ hideReputationQuests: false });
    }
    // Filter chip removal requires clicking Apply to take effect
  };

  // Simple filter change handler - requires Apply button click
  const handlePrimaryFilterChange = (update: Partial<Filters>) => {
    onFilterChange(update);
  };

  // Count advanced filters that are active
  const advancedFilterCount = [
    filters.kappaOnly,
    filters.playerLevel !== 1 ? filters.playerLevel : null,
    filters.bypassLevelRequirement,
    filters.questsPerTree !== 5 ? filters.questsPerTree : null,
  ].filter(Boolean).length;

  // Count all active filters (for chips)
  const activeFilterCount = [
    filters.traderId,
    filters.statuses.length > 0 ? filters.statuses : null,
    filters.kappaOnly,
    filters.map,
    filters.questTypes.length > 0 ? filters.questTypes : null,
    filters.playerLevel !== 1 ? filters.playerLevel : null,
    filters.questsPerTree !== 5 ? filters.questsPerTree : null,
    filters.bypassLevelRequirement ? true : null,
  ].filter(Boolean).length;

  return (
    <div className="bg-background border-b">
      {/* Hidden quests banner */}
      {hiddenByLevelCount > 0 && !filters.bypassLevelRequirement && (
        <div className="mx-4 mt-2 flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
          <span className="text-muted-foreground">
            {hiddenByLevelCount} quest{hiddenByLevelCount > 1 ? "s" : ""} hidden
            (above level {(filters.playerLevel || 1) + 5})
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onFilterChange({ bypassLevelRequirement: true });
              setTimeout(() => onApplyFiltersRef.current(), 0);
            }}
          >
            Show All
          </Button>
        </div>
      )}

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
                  Filter quests by trader, status, map, and more
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4 overflow-y-auto">
                {/* Trader */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Trader
                  </Label>
                  <Select
                    value={filters.traderId || "all"}
                    onValueChange={(value) =>
                      handlePrimaryFilterChange({
                        traderId: value === "all" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 mt-1">
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
                                backgroundColor: getTraderColor(trader.id)
                                  .primary,
                              }}
                            />
                            {trader.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">
                    <StatusMultiSelect
                      selectedStatuses={filters.statuses}
                      onChange={(statuses) =>
                        handlePrimaryFilterChange({ statuses })
                      }
                    />
                  </div>
                </div>

                {/* Map */}
                <div>
                  <Label className="text-xs text-muted-foreground">Map</Label>
                  <Select
                    value={filters.map || "all"}
                    onValueChange={(value) =>
                      handlePrimaryFilterChange({
                        map: value === "all" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="All Maps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Maps</SelectItem>
                      {MAPS.map((map) => (
                        <SelectItem key={map} value={map}>
                          {map}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quest Type */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Quest Type
                  </Label>
                  <div className="mt-1">
                    <QuestTypeMultiSelect
                      selectedTypes={filters.questTypes}
                      onChange={(types) =>
                        handlePrimaryFilterChange({ questTypes: types })
                      }
                    />
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="pt-4 border-t">
                  <AdvancedFilters
                    filters={filters}
                    onFilterChange={onFilterChange}
                    onApplyFilters={onApplyFilters}
                    hasPendingChanges={hasPendingChanges}
                    onReset={handleReset}
                    isMobile
                  />
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
              traders={traders}
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

            {/* Trader */}
            <Select
              value={filters.traderId || "all"}
              onValueChange={(value) =>
                handlePrimaryFilterChange({
                  traderId: value === "all" ? null : value,
                })
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
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

            {/* Status */}
            <StatusMultiSelect
              selectedStatuses={filters.statuses}
              onChange={(statuses) => handlePrimaryFilterChange({ statuses })}
            />

            {/* Map */}
            <Select
              value={filters.map || "all"}
              onValueChange={(value) =>
                handlePrimaryFilterChange({
                  map: value === "all" ? null : value,
                })
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="All Maps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Maps</SelectItem>
                {MAPS.map((map) => (
                  <SelectItem key={map} value={map}>
                    {map}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quest Type */}
            <QuestTypeMultiSelect
              selectedTypes={filters.questTypes}
              onChange={(types) =>
                handlePrimaryFilterChange({ questTypes: types })
              }
            />

            {/* Apply button for primary filters */}
            <Button
              size="sm"
              onClick={onApplyFilters}
              disabled={!hasPendingChanges}
              className="h-9"
            >
              Apply
              {hasPendingChanges && (
                <Badge className="ml-1 bg-white text-primary text-[10px] px-1">
                  !
                </Badge>
              )}
            </Button>

            {/* More Filters (Advanced) */}
            <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 relative"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More
                  {advancedFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    >
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-4">
                <AdvancedFilters
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onApplyFilters={() => {
                    onApplyFilters();
                    setAdvancedOpen(false);
                  }}
                  hasPendingChanges={hasPendingChanges}
                  onReset={() => {
                    handleReset();
                    setAdvancedOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Progress Stats */}
          <ProgressStats quests={quests} traders={traders} />
        </div>

        {/* Active filter chips (desktop) */}
        {activeFilterCount > 0 && (
          <div className="px-4 pb-2">
            <ActiveFilterChips
              filters={filters}
              traders={traders}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

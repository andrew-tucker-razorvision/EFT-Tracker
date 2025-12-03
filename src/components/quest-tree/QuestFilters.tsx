"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ViewToggle } from "@/components/quest-views";
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
import { getTraderColor } from "@/lib/trader-colors";
import type {
  Trader,
  QuestFilters as Filters,
  QuestStatus,
  LevelRange,
  ViewMode,
} from "@/types";

const LEVEL_RANGES: LevelRange[] = [
  { min: 1, max: 10, label: "Level 1-10" },
  { min: 11, max: 20, label: "Level 11-20" },
  { min: 21, max: 30, label: "Level 21-30" },
  { min: 31, max: 40, label: "Level 31-40" },
  { min: 41, max: 79, label: "Level 41+" },
];

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

const STATUSES: { value: QuestStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "locked", label: "Locked" },
  { value: "available", label: "Available" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const COLUMNS_OPTIONS: { value: number | null; label: string }[] = [
  { value: 3, label: "3 columns" },
  { value: 5, label: "5 columns" },
  { value: 10, label: "10 columns" },
  { value: null, label: "All columns" },
];

interface QuestFiltersProps {
  traders: Trader[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
  hasPendingChanges: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stats: {
    completed: number;
    available: number;
    locked: number;
  };
  totalQuests: number;
  hiddenByLevelCount: number;
}

interface FilterControlsProps {
  isMobile?: boolean;
  traders: Trader[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onApplyFilters: () => void;
  hasPendingChanges: boolean;
  activeFilterCount: number;
  handleReset: () => void;
}

const FilterControls = ({
  isMobile = false,
  traders,
  filters,
  onFilterChange,
  onApplyFilters,
  hasPendingChanges,
  activeFilterCount,
  handleReset,
}: FilterControlsProps) => (
  <div
    className={
      isMobile
        ? "flex flex-col gap-4"
        : "hidden md:flex flex-wrap items-end gap-4"
    }
  >
    {/* Trader Filter */}
    <div className={isMobile ? "w-full" : "w-[160px]"}>
      <Label className="text-xs text-muted-foreground">Trader</Label>
      <Select
        value={filters.traderId || "all"}
        onValueChange={(value) =>
          onFilterChange({ traderId: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="h-9">
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
    </div>

    {/* Status Filter */}
    <div className={isMobile ? "w-full" : "w-[140px]"}>
      <Label className="text-xs text-muted-foreground">Status</Label>
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFilterChange({
            status: value === "all" ? null : (value as QuestStatus),
          })
        }
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Map Filter */}
    <div className={isMobile ? "w-full" : "w-[160px]"}>
      <Label className="text-xs text-muted-foreground">Map</Label>
      <Select
        value={filters.map || "all"}
        onValueChange={(value) =>
          onFilterChange({ map: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="h-9">
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

    {/* Kappa Toggle */}
    <div className="flex items-center gap-2 py-2">
      <Switch
        id={isMobile ? "kappa-mobile" : "kappa"}
        checked={filters.kappaOnly}
        onCheckedChange={(checked) => onFilterChange({ kappaOnly: checked })}
      />
      <Label
        htmlFor={isMobile ? "kappa-mobile" : "kappa"}
        className="text-sm cursor-pointer"
      >
        Kappa Only
      </Label>
    </div>

    {/* Player Level Input with Bypass Checkbox */}
    <div
      className={
        isMobile ? "w-full flex gap-2 items-end" : "flex gap-2 items-end"
      }
    >
      <div className={isMobile ? "flex-1" : "w-[90px]"}>
        <Label className="text-xs text-muted-foreground">My Level</Label>
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
          className="h-9"
          disabled={filters.bypassLevelRequirement}
        />
      </div>
      <div className="flex items-center gap-1.5 pb-0.5">
        <Switch
          id={isMobile ? "bypass-level-mobile" : "bypass-level"}
          checked={filters.bypassLevelRequirement}
          onCheckedChange={(checked) =>
            onFilterChange({ bypassLevelRequirement: checked })
          }
        />
        <Label
          htmlFor={isMobile ? "bypass-level-mobile" : "bypass-level"}
          className="text-xs cursor-pointer whitespace-nowrap"
        >
          Bypass
        </Label>
      </div>
    </div>

    {/* Level Range Filter */}
    <div className={isMobile ? "w-full" : "w-[140px]"}>
      <Label className="text-xs text-muted-foreground">Level Range</Label>
      <Select
        value={
          filters.levelRange
            ? `${filters.levelRange.min}-${filters.levelRange.max}`
            : "all"
        }
        onValueChange={(value) => {
          if (value === "all") {
            onFilterChange({ levelRange: null });
          } else {
            const range = LEVEL_RANGES.find(
              (r) => `${r.min}-${r.max}` === value
            );
            onFilterChange({ levelRange: range || null });
          }
        }}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {LEVEL_RANGES.map((range) => (
            <SelectItem
              key={`${range.min}-${range.max}`}
              value={`${range.min}-${range.max}`}
            >
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Columns Limit Filter */}
    <div className={isMobile ? "w-full" : "w-[130px]"}>
      <Label className="text-xs text-muted-foreground">Columns</Label>
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

    {/* Apply Filters Button */}
    <Button
      variant="default"
      size="sm"
      onClick={onApplyFilters}
      disabled={!hasPendingChanges}
      className={isMobile ? "w-full" : ""}
    >
      Apply Filters
      {hasPendingChanges && (
        <Badge className="ml-1 bg-white text-primary">!</Badge>
      )}
    </Button>

    {/* Reset Button */}
    {activeFilterCount > 0 && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className={isMobile ? "w-full" : ""}
      >
        Reset Filters
      </Button>
    )}
  </div>
);

export function QuestFilters({
  traders,
  filters,
  onFilterChange,
  onApplyFilters,
  hasPendingChanges,
  viewMode,
  onViewModeChange,
  stats,
  totalQuests,
  hiddenByLevelCount,
}: QuestFiltersProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initialPrefsLoaded = useRef(false);
  const lastSavedLevel = useRef<number | null>(null);
  const lastSavedQuestsPerTree = useRef<number | null>(5);
  const lastSavedBypassLevel = useRef<boolean>(false);

  // Load user's saved preferences on mount (only for logged-in users)
  useEffect(() => {
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
          }
        })
        .catch((err) =>
          console.error("Failed to fetch user preferences:", err)
        );
    }
  }, [sessionStatus, onFilterChange]);

  // Auto-save player level when it changes (debounced, only for logged-in users)
  const savePlayerLevel = useCallback(
    async (level: number | null) => {
      if (!session?.user) return;
      if (level === lastSavedLevel.current) return; // No change

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

  // Debounce level saving (1 second delay)
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!initialPrefsLoaded.current) return; // Don't save during initial load

    const timer = setTimeout(() => {
      savePlayerLevel(filters.playerLevel);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.playerLevel, sessionStatus, savePlayerLevel]);

  // Auto-save questsPerTree when it changes (debounced, only for logged-in users)
  const saveQuestsPerTree = useCallback(
    async (count: number | null) => {
      if (!session?.user) return;
      if (count === lastSavedQuestsPerTree.current) return; // No change

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

  // Debounce questsPerTree saving (1 second delay)
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!initialPrefsLoaded.current) return; // Don't save during initial load

    const timer = setTimeout(() => {
      saveQuestsPerTree(filters.questsPerTree);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.questsPerTree, sessionStatus, saveQuestsPerTree]);

  // Auto-save bypassLevelRequirement when it changes (debounced, only for logged-in users)
  const saveBypassLevelRequirement = useCallback(
    async (bypass: boolean) => {
      if (!session?.user) return;
      if (bypass === lastSavedBypassLevel.current) return; // No change

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

  // Debounce bypassLevelRequirement saving (1 second delay)
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (!initialPrefsLoaded.current) return; // Don't save during initial load

    const timer = setTimeout(() => {
      saveBypassLevelRequirement(filters.bypassLevelRequirement);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    filters.bypassLevelRequirement,
    sessionStatus,
    saveBypassLevelRequirement,
  ]);

  // Debounce search input (increased to 500ms) and auto-apply
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue });
        // Auto-apply search changes after a brief delay for state to update
        setTimeout(() => onApplyFilters(), 100);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange, onApplyFilters]);

  const handleReset = () => {
    setSearchValue("");
    onFilterChange({
      traderId: null,
      status: null,
      search: "",
      kappaOnly: false,
      map: null,
      playerLevel: 1, // Reset to default level 1
      levelRange: null,
      questsPerTree: 5, // Reset to default
      bypassLevelRequirement: false, // Reset to default
    });
    // Immediately apply reset
    onApplyFilters();
  };

  const activeFilterCount = [
    filters.traderId,
    filters.status,
    filters.search,
    filters.kappaOnly,
    filters.map,
    filters.playerLevel !== 1 ? filters.playerLevel : null, // Count if not default
    filters.levelRange,
    filters.questsPerTree !== 5 ? filters.questsPerTree : null, // Count if not default
    filters.bypassLevelRequirement ? true : null, // Count if enabled
  ].filter(Boolean).length;

  return (
    <div className="p-3 md:p-4 bg-background border-b">
      {/* Hidden quests banner */}
      {hiddenByLevelCount > 0 && !filters.bypassLevelRequirement && (
        <div className="mb-3 flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
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
              // Delay apply to ensure state update is processed
              setTimeout(() => onApplyFilters(), 0);
            }}
          >
            Show All
          </Button>
        </div>
      )}
      {/* MOBILE LAYOUT (vertical stacking) */}
      <div className="md:hidden flex flex-col gap-2 w-full">
        {/* Row 1: Search + Filter Button */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Input
              id="search-mobile"
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
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filter Quests</SheetTitle>
                <SheetDescription className="sr-only">
                  Filter quests by trader, status, map, and level
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <FilterControls
                  isMobile
                  traders={traders}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onApplyFilters={onApplyFilters}
                  hasPendingChanges={hasPendingChanges}
                  activeFilterCount={activeFilterCount}
                  handleReset={handleReset}
                />
                {/* Stats + ViewToggle in mobile sheet */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3 text-xs mb-3">
                    <span className="font-medium">Progress:</span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "#00a700" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#00a700" }}
                      />
                      {stats.completed}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "#0292c0" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#0292c0" }}
                      />
                      {stats.available}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "#636363" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#636363" }}
                      />
                      {stats.locked}
                    </span>
                    <span className="text-muted-foreground">
                      / {totalQuests}
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      View Mode
                    </Label>
                    <ViewToggle
                      viewMode={viewMode}
                      onViewModeChange={onViewModeChange}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Row 2: Stats + ViewToggle + Total (visible outside sheet) */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-0.5"
              style={{ color: "#00a700" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#00a700" }}
              />
              {stats.completed}
            </span>
            <span
              className="flex items-center gap-0.5"
              style={{ color: "#0292c0" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#0292c0" }}
              />
              {stats.available}
            </span>
            <span
              className="flex items-center gap-0.5"
              style={{ color: "#636363" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#636363" }}
              />
              {stats.locked}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
            <span className="text-muted-foreground">{totalQuests} total</span>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT (single row, flex-wrap) */}
      <div className="hidden md:flex flex-wrap items-center gap-3 w-full">
        {/* Search Input */}
        <div className="flex-1 min-w-[180px] max-w-[280px]">
          <Label
            htmlFor="search"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Search
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Search quests..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs border-l pl-3">
          <span
            className="flex items-center gap-1"
            style={{ color: "#00a700" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#00a700" }}
            />
            {stats.completed}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ color: "#0292c0" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#0292c0" }}
            />
            {stats.available}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ color: "#636363" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#636363" }}
            />
            {stats.locked}
          </span>
          <span className="text-muted-foreground">/ {totalQuests}</span>
        </div>

        {/* Existing FilterControls (desktop) - rendered inline */}
        <FilterControls
          traders={traders}
          filters={filters}
          onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters}
          hasPendingChanges={hasPendingChanges}
          activeFilterCount={activeFilterCount}
          handleReset={handleReset}
        />

        {/* ViewToggle */}
        <div className="border-l pl-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>
    </div>
  );
}

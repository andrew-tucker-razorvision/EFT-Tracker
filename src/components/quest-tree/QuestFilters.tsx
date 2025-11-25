"use client";

import { useEffect, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getTraderColor } from "@/lib/trader-colors";
import type { Trader, QuestFilters as Filters, QuestStatus } from "@/types";

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

interface QuestFiltersProps {
  traders: Trader[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

interface FilterControlsProps {
  isMobile?: boolean;
  traders: Trader[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  activeFilterCount: number;
  handleReset: () => void;
}

const FilterControls = ({
  isMobile = false,
  traders,
  filters,
  onFilterChange,
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
}: QuestFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange]);

  const handleReset = () => {
    setSearchValue("");
    onFilterChange({
      traderId: null,
      status: null,
      search: "",
      kappaOnly: false,
      map: null,
    });
  };

  const activeFilterCount = [
    filters.traderId,
    filters.status,
    filters.search,
    filters.kappaOnly,
    filters.map,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-end gap-2 md:gap-4 p-3 md:p-4 bg-background border-b">
      {/* Search - always visible */}
      <div className="flex-1 min-w-[150px]">
        <Label
          htmlFor="search"
          className="text-xs text-muted-foreground hidden md:block"
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

      {/* Desktop Filters */}
      <FilterControls
        traders={traders}
        filters={filters}
        onFilterChange={onFilterChange}
        activeFilterCount={activeFilterCount}
        handleReset={handleReset}
      />

      {/* Mobile Filter Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden relative">
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
          </SheetHeader>
          <div className="py-4">
            <FilterControls
              isMobile
              traders={traders}
              filters={filters}
              onFilterChange={onFilterChange}
              activeFilterCount={activeFilterCount}
              handleReset={handleReset}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

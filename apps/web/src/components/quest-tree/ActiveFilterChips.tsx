"use client";

import { X } from "lucide-react";
import type { QuestFilters, QuestStatus } from "@/types";

const STATUS_LABELS: Record<QuestStatus, string> = {
  available: "Available",
  in_progress: "In Progress",
  completed: "Completed",
  locked: "Locked",
};

interface ActiveFilterChipsProps {
  filters: QuestFilters;
  onRemoveFilter: (key: keyof QuestFilters, value?: string) => void;
  onClearAll: () => void;
}

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-primary/80 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // Status filters (one chip per status)
  filters.statuses.forEach((status) => {
    chips.push({
      key: `status-${status}`,
      label: STATUS_LABELS[status],
      onRemove: () => onRemoveFilter("statuses", status),
    });
  });

  // Kappa filter
  if (filters.kappaOnly) {
    chips.push({
      key: "kappa",
      label: "Kappa Only",
      onRemove: () => onRemoveFilter("kappaOnly"),
    });
  }

  // Player level (only if not default)
  if (filters.playerLevel && filters.playerLevel !== 1) {
    chips.push({
      key: "level",
      label: `Level ${filters.playerLevel}`,
      onRemove: () => onRemoveFilter("playerLevel"),
    });
  }

  // Search is not shown as a chip (it's visible in the input)

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Active:</span>
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

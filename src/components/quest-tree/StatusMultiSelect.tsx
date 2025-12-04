"use client";

import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { QuestStatus } from "@/types";

const STATUSES: { value: QuestStatus; label: string; color: string }[] = [
  { value: "available", label: "Available", color: "#0292c0" },
  { value: "in_progress", label: "In Progress", color: "#c4aa6a" },
  { value: "completed", label: "Completed", color: "#00a700" },
  { value: "locked", label: "Locked", color: "#636363" },
];

interface StatusMultiSelectProps {
  selectedStatuses: QuestStatus[];
  onChange: (statuses: QuestStatus[]) => void;
}

export function StatusMultiSelect({
  selectedStatuses,
  onChange,
}: StatusMultiSelectProps) {
  const handleToggle = (status: QuestStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onChange(newStatuses);
  };

  const getLabel = () => {
    if (selectedStatuses.length === 0) return "All Status";
    if (selectedStatuses.length === 1) {
      return STATUSES.find((s) => s.value === selectedStatuses[0])?.label;
    }
    return `Status (${selectedStatuses.length})`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[120px] justify-between gap-1"
        >
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2" align="start">
        <div className="flex flex-col gap-1">
          {STATUSES.map((status) => {
            const isSelected = selectedStatuses.includes(status.value);
            return (
              <button
                key={status.value}
                type="button"
                onClick={() => handleToggle(status.value)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors text-left ${
                  isSelected
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: status.color }}
                />
                <span className="flex-1">{status.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t">
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection (show all)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

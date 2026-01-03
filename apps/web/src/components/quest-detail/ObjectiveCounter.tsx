"use client";

import { Minus, Plus, Check } from "lucide-react";

interface ObjectiveCounterProps {
  current: number;
  target: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onComplete: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Counter component for numeric objectives (e.g., "Kill 2/5 PMCs")
 * Features:
 * - Touch-friendly 44x44px +/- buttons
 * - "Complete" shortcut button for high-count objectives
 * - Accessible with role="spinbutton" and ARIA labels
 * - Visual feedback when complete (green styling)
 */
export function ObjectiveCounter({
  current,
  target,
  onIncrement,
  onDecrement,
  onComplete,
  disabled = false,
  isLoading = false,
}: ObjectiveCounterProps) {
  const isComplete = current >= target;
  // Note: We don't check isLoading here because optimistic updates already
  // show the correct state. Checking isLoading causes UI flickering.
  const canDecrement = current > 0 && !disabled;
  const canIncrement = current < target && !disabled;
  const showCompleteButton = current < target && !disabled;

  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Decrement button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (canDecrement) onDecrement();
        }}
        disabled={!canDecrement}
        className={`
          w-8 h-8 flex items-center justify-center rounded border-2 transition-all
          ${
            canDecrement
              ? "border-muted-foreground/30 hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary"
              : "border-muted/30 text-muted/30 cursor-not-allowed"
          }
        `}
        aria-label="Decrement progress"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Progress display */}
      <div
        className={`
          text-sm font-medium min-w-[48px] text-center px-2 py-1 rounded
          ${
            isComplete
              ? "bg-primary/20 text-primary"
              : "bg-muted/50 text-foreground/80"
          }
        `}
        role="spinbutton"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`Progress: ${current} of ${target}`}
      >
        {`${current}/${target}`}
      </div>

      {/* Increment button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (canIncrement) onIncrement();
        }}
        disabled={!canIncrement}
        className={`
          w-8 h-8 flex items-center justify-center rounded border-2 transition-all
          ${
            canIncrement
              ? "border-muted-foreground/30 hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary"
              : "border-muted/30 text-muted/30 cursor-not-allowed"
          }
        `}
        aria-label="Increment progress"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Complete shortcut button - shows when not yet complete */}
      {showCompleteButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="
            ml-1 px-2 py-1 text-xs rounded border border-primary/30
            hover:bg-primary/10 hover:border-primary text-primary/80 hover:text-primary
            transition-all flex items-center gap-1
          "
          aria-label="Mark as complete"
        >
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">Done</span>
        </button>
      )}

      {/* Completed indicator */}
      {isComplete && (
        <Check className="w-4 h-4 text-primary ml-1" aria-label="Completed" />
      )}
    </div>
  );
}

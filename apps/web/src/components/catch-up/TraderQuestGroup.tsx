"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CatchUpSelection } from "@eft-tracker/types";

interface TraderQuestGroupProps {
  traderName: string;
  traderColor: string;
  quests: CatchUpSelection[];
  showCheckboxes?: boolean;
  checkedQuests?: Set<string>;
  onToggleQuest?: (questId: string) => void;
  defaultExpanded?: boolean;
}

export function TraderQuestGroup({
  traderName,
  traderColor,
  quests,
  showCheckboxes = false,
  checkedQuests,
  onToggleQuest,
  defaultExpanded = true,
}: TraderQuestGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const checkedCount =
    showCheckboxes && checkedQuests
      ? quests.filter((q) => checkedQuests.has(q.questId)).length
      : quests.length;

  return (
    <div className="border border-[var(--tactical-border)] rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)] transition-colors"
        aria-expanded={expanded}
        aria-label={`${traderName} quests, ${expanded ? "collapse" : "expand"}`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
          <span className="font-medium" style={{ color: traderColor }}>
            {traderName}
          </span>
          <span className="text-xs text-[var(--text-dim)]">
            ({checkedCount}/{quests.length})
          </span>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-[var(--tactical-border)]">
          {quests.map((quest) => (
            <div
              key={quest.questId}
              className="flex items-center gap-3 p-3 bg-[var(--bg-card)]"
            >
              {showCheckboxes && checkedQuests && onToggleQuest ? (
                // @ts-expect-error React 19 forwardRef type compatibility
                <Checkbox
                  id={`quest-${quest.questId}`}
                  checked={checkedQuests.has(quest.questId)}
                  onCheckedChange={() => onToggleQuest(quest.questId)}
                />
              ) : (
                <div className="w-4 h-4 rounded border border-[var(--tactical-border)] bg-[var(--success)]/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-[var(--success)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              <label
                htmlFor={showCheckboxes ? `quest-${quest.questId}` : undefined}
                className="flex-1 text-sm text-[var(--text-bright)] cursor-pointer"
              >
                {quest.questTitle}
              </label>
              <span className="text-xs text-[var(--text-dim)]">
                Lv. {quest.levelRequired}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

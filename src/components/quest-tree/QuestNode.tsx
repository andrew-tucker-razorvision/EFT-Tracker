"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getTraderColor, STATUS_COLORS } from "@/lib/trader-colors";
import type { QuestNode as QuestNodeType } from "@/types";

export const QUEST_NODE_WIDTH = 200;
export const QUEST_NODE_HEIGHT = 72;

function QuestNodeComponent({ data, selected }: NodeProps<QuestNodeType>) {
  const { quest, onStatusChange, onClick } = data;
  const traderColor = getTraderColor(quest.traderId);
  const statusColor = STATUS_COLORS[quest.computedStatus];
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger click animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);

    // Call the status change handler (parent handles the cycle logic)
    onStatusChange(quest.id, quest.computedStatus);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Right-click to select/view details
    onClick(quest.id);
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2 !h-2"
      />
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-150",
          "hover:shadow-md active:scale-95",
          isClicked && "scale-105",
          selected && "ring-2 ring-offset-2 ring-blue-500",
          quest.computedStatus === "locked" && "opacity-50 cursor-not-allowed",
          quest.computedStatus === "completed" && "opacity-80",
          quest.computedStatus === "in_progress" && "ring-2 ring-amber-400",
          quest.computedStatus === "available" && "shadow-sm hover:shadow-lg"
        )}
        style={{
          width: QUEST_NODE_WIDTH,
          height: QUEST_NODE_HEIGHT,
          backgroundColor: statusColor.bg,
          borderColor:
            quest.computedStatus === "available"
              ? traderColor.primary
              : statusColor.border,
        }}
      >
        {/* Kappa badge */}
        {quest.kappaRequired && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: "#FFD700" }}
            title="Required for Kappa"
          >
            K
          </div>
        )}

        {/* Completed checkmark overlay */}
        {quest.computedStatus === "completed" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-8 h-8 text-green-600 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {/* Quest title */}
        <div
          className="font-medium text-sm leading-tight line-clamp-2 text-gray-900"
          title={quest.title}
        >
          {quest.title}
        </div>

        {/* Bottom row: Level + Trader */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: traderColor.primary,
              color: "white",
            }}
          >
            Lv. {quest.levelRequired}
          </span>
          <span
            className="text-xs font-medium truncate max-w-[80px]"
            style={{ color: traderColor.primary }}
          >
            {quest.trader.name}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2 !h-2"
      />
    </>
  );
}

export const QuestNode = memo(QuestNodeComponent);

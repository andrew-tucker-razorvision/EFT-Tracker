"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { TraderNode as TraderNodeType } from "@/types";
import { LANE_CONFIG } from "@/lib/quest-layout";

function TraderNodeComponent({ data }: NodeProps<TraderNodeType>) {
  const { traderName, color, questCount, completedCount } = data;
  const progress = questCount > 0 ? (completedCount / questCount) * 100 : 0;

  return (
    <>
      <div
        className={cn(
          "rounded-lg border-2 p-2 flex flex-col items-center justify-center",
          "shadow-md font-medium bg-white"
        )}
        style={{
          width: LANE_CONFIG.TRADER_NODE_WIDTH,
          height: LANE_CONFIG.TRADER_NODE_HEIGHT,
          borderColor: color,
        }}
      >
        {/* Trader Name */}
        <span
          className="font-bold text-sm truncate max-w-full"
          style={{ color }}
        >
          {traderName}
        </span>

        {/* Quest Progress Count */}
        <span className="text-xs text-gray-600 mt-0.5">
          {completedCount}/{questCount}
        </span>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-2 !h-2"
      />
    </>
  );
}

export const TraderNode = memo(TraderNodeComponent);

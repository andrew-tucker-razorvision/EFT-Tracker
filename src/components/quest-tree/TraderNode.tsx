"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { TraderNode as TraderNodeType } from "@/types";
import { LANE_CONFIG } from "@/lib/quest-layout";

function TraderNodeComponent({ data }: NodeProps<TraderNodeType>) {
  const { traderName, color, questCount, completedCount } = data;

  return (
    <>
      <div
        className={cn(
          "rounded border p-1 flex flex-col items-center justify-center",
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
          className="font-bold text-[10px] truncate max-w-full"
          style={{ color }}
        >
          {traderName}
        </span>

        {/* Quest Progress Count */}
        <span className="text-[9px] text-gray-600">
          {completedCount}/{questCount}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-1.5 !h-1.5"
      />
    </>
  );
}

export const TraderNode = memo(TraderNodeComponent);

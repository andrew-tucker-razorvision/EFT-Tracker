"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { TraderNode as TraderNodeType } from "@/types";
import { LANE_CONFIG } from "@/lib/quest-layout";

function TraderNodeComponent({ data }: NodeProps<TraderNodeType>) {
  const { traderName, color, questCount, completedCount, laneHeight } = data;

  // Use lane height if provided, otherwise fall back to default
  const nodeHeight = laneHeight || LANE_CONFIG.TRADER_NODE_HEIGHT;

  return (
    <>
      <div
        className={cn(
          "rounded border flex items-center justify-center",
          "shadow-md font-medium bg-background"
        )}
        style={{
          width: LANE_CONFIG.TRADER_NODE_WIDTH,
          height: nodeHeight,
          borderColor: color,
        }}
      >
        {/* Vertical text container */}
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
          }}
        >
          {/* Trader Name */}
          <span className="font-bold text-xs" style={{ color }}>
            {traderName}
          </span>

          {/* Quest Progress Count */}
          <span className="text-[10px] text-muted-foreground">
            {completedCount}/{questCount}
          </span>
        </div>
      </div>
      {/* No Handle needed - trader nodes don't connect via edges to quest nodes */}
    </>
  );
}

export const TraderNode = memo(TraderNodeComponent);

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { QUEST_NODE_WIDTH, QUEST_NODE_HEIGHT } from "./QuestNode";
import { TRADER_COLORS } from "@/lib/trader-colors";

// Layout constants matching the real quest tree
const TRADER_NODE_WIDTH = 60;
const LANE_SPACING = 25;
const TRADER_TO_QUEST_GAP = 20;
const QUEST_HORIZONTAL_GAP = 80;
const QUEST_VERTICAL_GAP = 25;

// Skeleton edge styling
const EDGE_COLOR = "#4a4a4a";

// Skeleton lane data - mimics real trader lanes with varying quest counts
const SKELETON_LANES = [
  { name: "Prapor", color: TRADER_COLORS.prapor.primary, quests: [4, 3, 2, 1] },
  {
    name: "Therapist",
    color: TRADER_COLORS.therapist.primary,
    quests: [3, 4, 3, 2],
  },
  { name: "Skier", color: TRADER_COLORS.skier.primary, quests: [3, 2, 3, 1] },
  {
    name: "Peacekeeper",
    color: TRADER_COLORS.peacekeeper.primary,
    quests: [2, 3, 2],
  },
];

export function QuestTreeSkeleton() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Filter bar skeleton */}
      <FilterBarSkeleton />

      {/* Quest tree skeleton with trader lanes */}
      <div className="flex-1 overflow-hidden relative bg-[#1a1a1a]">
        <div className="absolute inset-0 p-6">
          {/* SVG layer for edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <SkeletonEdges />
          </svg>

          {/* Nodes layer */}
          <div className="relative">
            {SKELETON_LANES.map((lane, laneIndex) => (
              <SkeletonLane key={lane.name} lane={lane} laneIndex={laneIndex} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-background border-b">
      {/* Search input */}
      <div className="flex-1 min-w-[200px] max-w-[400px]">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>

      {/* Trader select */}
      <Skeleton className="h-9 w-[140px] rounded-md" />

      {/* Map select */}
      <Skeleton className="h-9 w-[120px] rounded-md" />

      {/* More filters button */}
      <Skeleton className="h-9 w-[80px] rounded-md" />

      {/* Apply button */}
      <Skeleton className="h-9 w-[70px] rounded-md" />

      {/* View toggle */}
      <div className="flex gap-1 ml-auto">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

interface SkeletonLaneProps {
  lane: (typeof SKELETON_LANES)[number];
  laneIndex: number;
}

// Calculate cumulative Y position for each lane
function getLaneY(laneIndex: number): number {
  let y = 0;
  for (let i = 0; i < laneIndex; i++) {
    const maxNodes = Math.max(...SKELETON_LANES[i].quests);
    const height = maxNodes * (QUEST_NODE_HEIGHT + QUEST_VERTICAL_GAP);
    y += height + LANE_SPACING;
  }
  return y;
}

function SkeletonLane({ lane, laneIndex }: SkeletonLaneProps) {
  const maxNodesInColumn = Math.max(...lane.quests);
  const laneHeight =
    maxNodesInColumn * (QUEST_NODE_HEIGHT + QUEST_VERTICAL_GAP);
  const laneY = getLaneY(laneIndex);

  return (
    <div className="absolute flex" style={{ top: laneY, left: 0 }}>
      {/* Trader header */}
      <TraderNodeSkeleton color={lane.color} height={laneHeight} />

      {/* Quest columns */}
      <div className="flex" style={{ marginLeft: TRADER_TO_QUEST_GAP }}>
        {lane.quests.map((nodeCount, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col"
            style={{
              marginLeft: colIndex > 0 ? QUEST_HORIZONTAL_GAP : 0,
              gap: QUEST_VERTICAL_GAP,
            }}
          >
            {Array.from({ length: nodeCount }).map((_, nodeIndex) => (
              <QuestNodeSkeleton key={nodeIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TraderNodeSkeletonProps {
  color: string;
  height: number;
}

function TraderNodeSkeleton({ color, height }: TraderNodeSkeletonProps) {
  return (
    <div
      className="rounded border-2 flex items-center justify-center bg-background"
      style={{
        width: TRADER_NODE_WIDTH,
        height: Math.max(height, 80),
        borderColor: color,
      }}
    >
      {/* Vertical skeleton for trader name */}
      <div
        className="flex flex-col items-center gap-2"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
        }}
      >
        <Skeleton
          className="w-3 rounded"
          style={{ height: 60, backgroundColor: `${color}40` }}
        />
        <Skeleton className="w-2 h-6 rounded" />
      </div>
    </div>
  );
}

function QuestNodeSkeleton() {
  return (
    <div
      className="rounded border-2 p-2 animate-pulse"
      style={{
        width: QUEST_NODE_WIDTH,
        height: QUEST_NODE_HEIGHT,
        borderColor: "#636363",
        backgroundColor: "#383945",
      }}
    >
      {/* Quest title skeleton */}
      <Skeleton className="h-3.5 w-[90%] mb-1.5 bg-[#4a4a4a]" />
      <Skeleton className="h-3 w-[60%] mb-2 bg-[#4a4a4a]" />

      {/* Level badge skeleton */}
      <Skeleton className="h-3 w-8 rounded bg-[#4a4a4a]" />
    </div>
  );
}

function SkeletonEdges() {
  // Generate edge paths based on skeleton lane structure
  const edges: React.ReactNode[] = [];
  let edgeId = 0;

  SKELETON_LANES.forEach((lane, laneIndex) => {
    const laneY = getLaneY(laneIndex) + 24; // +24 for padding

    lane.quests.forEach((nodeCount, colIndex) => {
      if (colIndex === lane.quests.length - 1) return; // No edges from last column

      const nextColNodeCount = lane.quests[colIndex + 1];
      const startX =
        24 + // padding
        TRADER_NODE_WIDTH +
        TRADER_TO_QUEST_GAP +
        colIndex * (QUEST_NODE_WIDTH + QUEST_HORIZONTAL_GAP) +
        QUEST_NODE_WIDTH;

      const endX = startX + QUEST_HORIZONTAL_GAP;

      // Connect each node in current column to one or more in next column
      for (let i = 0; i < nodeCount; i++) {
        const startY =
          laneY +
          i * (QUEST_NODE_HEIGHT + QUEST_VERTICAL_GAP) +
          QUEST_NODE_HEIGHT / 2;

        // Connect to corresponding node(s) in next column
        const targetIndices = getTargetIndices(i, nodeCount, nextColNodeCount);

        for (const targetIndex of targetIndices) {
          const endY =
            laneY +
            targetIndex * (QUEST_NODE_HEIGHT + QUEST_VERTICAL_GAP) +
            QUEST_NODE_HEIGHT / 2;

          // Bezier curve control points
          const controlX = (startX + endX) / 2;

          edges.push(
            <path
              key={edgeId++}
              d={`M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`}
              stroke={EDGE_COLOR}
              strokeWidth={2}
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: `${edgeId * 50}ms` }}
            />
          );
        }
      }
    });
  });

  return <>{edges}</>;
}

// Helper to determine which nodes in next column to connect to
function getTargetIndices(
  sourceIndex: number,
  sourceCount: number,
  targetCount: number
): number[] {
  if (targetCount === 0) return [];

  // Simple mapping strategy
  if (targetCount >= sourceCount) {
    // More targets - connect to corresponding index
    return [Math.min(sourceIndex, targetCount - 1)];
  } else {
    // Fewer targets - multiple sources may connect to same target
    const targetIndex = Math.floor((sourceIndex / sourceCount) * targetCount);
    return [Math.min(targetIndex, targetCount - 1)];
  }
}

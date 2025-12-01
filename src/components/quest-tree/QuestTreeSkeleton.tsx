"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function QuestTreeSkeleton() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-background border-b">
        <div className="flex-1 min-w-[200px]">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="w-[180px]">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="w-[160px]">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="w-[180px]">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Quest tree skeleton - simulated nodes */}
      <div className="flex-1 p-8 overflow-hidden">
        <div className="flex gap-32">
          {/* Column 1 - Root quests */}
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <QuestNodeSkeleton key={`col1-${i}`} />
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <QuestNodeSkeleton key={`col2-${i}`} />
            ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4 mt-16">
            {[1, 2, 3].map((i) => (
              <QuestNodeSkeleton key={`col3-${i}`} />
            ))}
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-4 mt-4">
            {[1, 2].map((i) => (
              <QuestNodeSkeleton key={`col4-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestNodeSkeleton() {
  return (
    <div
      className="w-[200px] h-[72px] rounded-lg border-2 p-3"
      style={{ borderColor: "#636363", backgroundColor: "#383945" }}
    >
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

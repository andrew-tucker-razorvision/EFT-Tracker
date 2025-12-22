// @ts-nocheck - React 19 Progress component type compatibility
"use client";

import { useMemo } from "react";
import { ChevronDown, Star, Trophy, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getTraderColor } from "@/lib/trader-colors";
import type { QuestWithProgress, Trader } from "@/types";

interface ProgressStatsProps {
  quests: QuestWithProgress[];
  traders: Trader[];
}

interface TraderStats {
  traderId: string;
  traderName: string;
  total: number;
  completed: number;
  available: number;
  locked: number;
  percentage: number;
}

export function ProgressStats({ quests, traders }: ProgressStatsProps) {
  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = quests.length;
    const completed = quests.filter(
      (q) => q.computedStatus === "completed"
    ).length;
    const available = quests.filter(
      (q) => q.computedStatus === "available"
    ).length;
    const locked = quests.filter((q) => q.computedStatus === "locked").length;

    return {
      total,
      completed,
      available,
      locked,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [quests]);

  // Calculate Kappa stats
  const kappaStats = useMemo(() => {
    const kappaQuests = quests.filter((q) => q.kappaRequired);
    const total = kappaQuests.length;
    const completed = kappaQuests.filter(
      (q) => q.computedStatus === "completed"
    ).length;
    const available = kappaQuests.filter(
      (q) => q.computedStatus === "available"
    ).length;

    return {
      total,
      completed,
      available,
      remaining: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [quests]);

  // Calculate per-trader stats
  const traderStats = useMemo(() => {
    const stats: TraderStats[] = [];

    for (const trader of traders) {
      const traderQuests = quests.filter((q) => q.traderId === trader.id);
      const total = traderQuests.length;
      const completed = traderQuests.filter(
        (q) => q.computedStatus === "completed"
      ).length;
      const available = traderQuests.filter(
        (q) => q.computedStatus === "available"
      ).length;
      const locked = traderQuests.filter(
        (q) => q.computedStatus === "locked"
      ).length;

      if (total > 0) {
        stats.push({
          traderId: trader.id,
          traderName: trader.name,
          total,
          completed,
          available,
          locked,
          percentage: Math.round((completed / total) * 100),
        });
      }
    }

    // Sort by completion percentage (descending)
    return stats.sort((a, b) => b.percentage - a.percentage);
  }, [quests, traders]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/80 border border-border hover:bg-muted transition-colors text-sm">
          <Trophy className="w-4 h-4 text-[#d4a574]" />
          <span className="font-medium">{overallStats.percentage}%</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0292c0]" />
                <span className="font-medium text-sm">Overall Progress</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {overallStats.completed}/{overallStats.total}
              </span>
            </div>
            <Progress
              value={overallStats.percentage}
              className="h-2"
              indicatorClassName="bg-[#00a700]"
            />
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#00a700" }}
                />
                {overallStats.completed} done
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#0292c0" }}
                />
                {overallStats.available} available
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#636363" }}
                />
                {overallStats.locked} locked
              </span>
            </div>
          </div>

          {/* Kappa Progress */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-sm">Kappa Container</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {kappaStats.completed}/{kappaStats.total}
              </span>
            </div>
            <Progress
              value={kappaStats.percentage}
              className="h-2"
              indicatorClassName="bg-yellow-500"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {kappaStats.remaining > 0
                ? `${kappaStats.remaining} Kappa quests remaining`
                : "All Kappa quests completed!"}
            </p>
          </div>

          {/* Per-Trader Progress */}
          <div className="pt-2 border-t">
            <p className="font-medium text-sm mb-3">By Trader</p>
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
              {traderStats.map((trader) => {
                const colors = getTraderColor(trader.traderId);
                return (
                  <div key={trader.traderId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="font-medium"
                        style={{ color: colors.primary }}
                      >
                        {trader.traderName}
                      </span>
                      <span className="text-muted-foreground">
                        {trader.completed}/{trader.total} ({trader.percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={trader.percentage}
                      className="h-1.5"
                      indicatorClassName="transition-all"
                      style={
                        {
                          "--progress-color": colors.primary,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ProgressStats;

// @ts-nocheck - React 19 Context Provider component type compatibility
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface QuestStats {
  completed: number;
  available: number;
  locked: number;
  total: number;
}

interface StatsContextType {
  stats: QuestStats | null;
  setStats: (stats: QuestStats | null) => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<QuestStats | null>(null);

  return (
    <StatsContext.Provider value={{ stats, setStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
}

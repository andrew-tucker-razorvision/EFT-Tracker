import type { Trader } from "@/types";

export const mockTraders: Trader[] = [
  { id: "trader_prapor", name: "Prapor", color: "#F97316" },
  { id: "trader_therapist", name: "Therapist", color: "#22C55E" },
  { id: "trader_skier", name: "Skier", color: "#3B82F6" },
  { id: "trader_peacekeeper", name: "Peacekeeper", color: "#6366F1" },
  { id: "trader_mechanic", name: "Mechanic", color: "#EAB308" },
  { id: "trader_ragman", name: "Ragman", color: "#EC4899" },
  { id: "trader_jaeger", name: "Jaeger", color: "#84CC16" },
  { id: "trader_fence", name: "Fence", color: "#6B7280" },
];

export const getTraderById = (id: string): Trader | undefined => {
  return mockTraders.find((t) => t.id === id);
};

export const getTraderByName = (name: string): Trader | undefined => {
  return mockTraders.find((t) => t.name.toLowerCase() === name.toLowerCase());
};

export interface TraderColor {
  primary: string;
  bg: string;
}

// EFT Brand Colors
export const EFT_COLORS = {
  goldOne: "#d9d7c5", // Brightened for better contrast (was #c7c5b3)
  goldTwo: "#b39d70", // Slightly brightened (was #9a8866)
  gunmetal: "#383945",
  gunmetalDark: "#2d2d2f",
  blackLight: "#1b1919",
  border: "rgba(199, 197, 179, 0.3)", // Slightly more visible borders
} as const;

// All traders use unified gold theme (differentiate by icons instead)
export const TRADER_COLORS: Record<string, TraderColor> = {
  prapor: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  therapist: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  skier: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  peacekeeper: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  mechanic: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  ragman: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  jaeger: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  fence: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  lightkeeper: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
  ref: { primary: EFT_COLORS.goldTwo, bg: EFT_COLORS.gunmetal },
};

export function getTraderColor(traderId: string): TraderColor {
  return (
    TRADER_COLORS[traderId.toLowerCase()] || {
      primary: EFT_COLORS.goldTwo,
      bg: EFT_COLORS.gunmetal,
    }
  );
}

// Status colors updated for dark EFT theme - high contrast solid backgrounds
export const STATUS_COLORS = {
  locked: {
    primary: "#888888" /* lighter gray for better visibility */,
    bg: "#1a1a1a" /* near-black for maximum contrast */,
    border: "#444444",
  },
  available: {
    primary: "#00c8ff" /* brighter cyan-blue */,
    bg: "#0a1a22" /* very dark blue-tinted black */,
    border: "#00c8ff",
  },
  in_progress: {
    primary: "#ffaa00" /* brighter amber-orange */,
    bg: "#1a1408" /* very dark amber-tinted black */,
    border: "#ffaa00",
  },
  completed: {
    primary: "#00cc00" /* brighter green */,
    bg: "#0a1a0a" /* very dark green-tinted black */,
    border: "#00cc00",
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

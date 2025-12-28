export interface TraderColor {
  primary: string;
  bg: string;
}

// EFT Brand Colors - Tarkov Wiki inspired for maximum readability
export const EFT_COLORS = {
  goldOne: "#e8e6d4", // Bright cream/gold for maximum text readability
  goldTwo: "#c4aa6a", // Brighter gold for accents
  gunmetal: "#272727", // Darker, more neutral background
  gunmetalDark: "#1a1a1a", // Near-black
  blackLight: "#0f0f0f", // True dark
  border: "rgba(196, 170, 106, 0.4)", // Gold-tinted borders for visibility
} as const;

// Distinct colors per trader for easy visual identification
export const TRADER_COLORS: Record<string, TraderColor> = {
  prapor: { primary: "#c41e3a", bg: EFT_COLORS.gunmetal }, // Red
  therapist: { primary: "#ff69b4", bg: EFT_COLORS.gunmetal }, // Pink
  skier: { primary: "#1e90ff", bg: EFT_COLORS.gunmetal }, // Blue
  peacekeeper: { primary: "#228b22", bg: EFT_COLORS.gunmetal }, // Green
  mechanic: { primary: "#ff8c00", bg: EFT_COLORS.gunmetal }, // Orange
  ragman: { primary: "#9370db", bg: EFT_COLORS.gunmetal }, // Purple
  jaeger: { primary: "#8b4513", bg: EFT_COLORS.gunmetal }, // Brown
  fence: { primary: "#708090", bg: EFT_COLORS.gunmetal }, // Slate gray
  lightkeeper: { primary: "#ffd700", bg: EFT_COLORS.gunmetal }, // Gold
  ref: { primary: "#20b2aa", bg: EFT_COLORS.gunmetal }, // Teal
};

export function getTraderColor(traderId: string): TraderColor {
  return (
    TRADER_COLORS[traderId.toLowerCase()] || {
      primary: EFT_COLORS.goldTwo,
      bg: EFT_COLORS.gunmetal,
    }
  );
}

// Status colors - dark backgrounds with bright accent borders for readability
export const STATUS_COLORS = {
  locked: {
    primary: "#5a5a5a", // Dimmer gray
    bg: "#1a1a1a", // Near-black
    border: "#3a3a3a", // Subtle border
  },
  available: {
    primary: "#4db8ff", // Bright sky blue
    bg: "#1a1a1a", // Same dark background for consistency
    border: "#4db8ff", // Bright blue border
  },
  in_progress: {
    primary: "#fbbf24", // Amber for in-progress
    bg: "#1a1a1a", // Same dark background
    border: "#fbbf24", // Amber border
  },
  completed: {
    primary: "#4ade80", // Bright green
    bg: "#1e2e1e", // Tinted green background for clear distinction
    border: "#4ade80", // Bright green border to stand out
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

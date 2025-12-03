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

// Status colors - dark backgrounds with bright accent borders for readability
export const STATUS_COLORS = {
  locked: {
    primary: "#6b6b6b", // Medium gray
    bg: "#1a1a1a", // Near-black
    border: "#3a3a3a", // Subtle border
  },
  available: {
    primary: "#4db8ff", // Bright sky blue
    bg: "#1a1a1a", // Same dark background for consistency
    border: "#4db8ff", // Bright blue border
  },
  in_progress: {
    primary: "#ffcc00", // Bright yellow/gold
    bg: "#1a1a1a", // Same dark background
    border: "#ffcc00", // Bright yellow border
  },
  completed: {
    primary: "#4ade80", // Bright green
    bg: "#1a1a1a", // Same dark background
    border: "#2d5a3d", // Muted green border
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

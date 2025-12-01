export interface TraderColor {
  primary: string;
  bg: string;
}

// EFT Brand Colors
export const EFT_COLORS = {
  goldOne: "#c7c5b3",
  goldTwo: "#9a8866",
  gunmetal: "#383945",
  gunmetalDark: "#2d2d2f",
  blackLight: "#1b1919",
  border: "rgba(199, 197, 179, 0.2)",
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

// Status colors updated for dark EFT theme
export const STATUS_COLORS = {
  locked: {
    primary: "#636363" /* gray-light */,
    bg: "#424242" /* gray */,
    border: "#636363",
  },
  available: {
    primary: "#0292c0" /* blue-light */,
    bg: "rgba(2, 146, 192, 0.2)",
    border: "#0292c0",
  },
  in_progress: {
    primary: "#ca8a00" /* orange */,
    bg: "rgba(202, 138, 0, 0.2)",
    border: "#ca8a00",
  },
  completed: {
    primary: "#00a700" /* green */,
    bg: "rgba(0, 167, 0, 0.2)",
    border: "#00a700",
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

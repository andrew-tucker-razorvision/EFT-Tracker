import { describe, it, expect } from "vitest";
import { getTraderColor, TRADER_COLORS } from "@/lib/trader-colors";

describe("trader-colors", () => {
  describe("TRADER_COLORS", () => {
    it("should have colors for all traders", () => {
      const expectedTraders = [
        "prapor",
        "therapist",
        "skier",
        "peacekeeper",
        "mechanic",
        "ragman",
        "jaeger",
        "fence",
      ];

      expectedTraders.forEach((trader) => {
        expect(TRADER_COLORS).toHaveProperty(trader);
        expect(TRADER_COLORS[trader as keyof typeof TRADER_COLORS]).toHaveProperty("primary");
        expect(TRADER_COLORS[trader as keyof typeof TRADER_COLORS]).toHaveProperty("bg");
      });
    });

    it("should have valid hex colors", () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      Object.values(TRADER_COLORS).forEach((colors) => {
        expect(colors.primary).toMatch(hexColorRegex);
        expect(colors.bg).toMatch(hexColorRegex);
      });
    });
  });

  describe("getTraderColor", () => {
    it("should return colors for prapor by name", () => {
      const colors = getTraderColor("prapor");
      expect(colors.primary).toBe(TRADER_COLORS.prapor.primary);
      expect(colors.bg).toBe(TRADER_COLORS.prapor.bg);
    });

    it("should return colors for therapist by name", () => {
      const colors = getTraderColor("therapist");
      expect(colors.primary).toBe(TRADER_COLORS.therapist.primary);
      expect(colors.bg).toBe(TRADER_COLORS.therapist.bg);
    });

    it("should handle case insensitivity", () => {
      const colors = getTraderColor("PRAPOR");
      expect(colors.primary).toBe(TRADER_COLORS.prapor.primary);
    });

    it("should return default colors for unknown trader", () => {
      const colors = getTraderColor("unknown_trader");
      // Returns default fallback
      expect(colors.primary).toBe("#6B7280");
      expect(colors.bg).toBe("#E5E7EB");
    });

    it("should return default colors for empty string", () => {
      const colors = getTraderColor("");
      expect(colors.primary).toBe("#6B7280");
    });
  });
});

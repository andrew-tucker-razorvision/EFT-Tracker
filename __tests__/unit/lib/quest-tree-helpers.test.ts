import { describe, it, expect } from "vitest";
import { calculateNodeHeight } from "@/lib/quest-layout";

describe("quest-tree helpers", () => {
  describe("parseZoomFromTransform", () => {
    /**
     * Parse zoom level (scale) from ReactFlow transform attribute
     * This is a pure function extracted from the E2E helper for unit testing
     */
    function parseZoomFromTransform(transform: string | null): number {
      if (!transform) return 1;
      const match = transform.match(/scale\(([^)]+)\)/);
      return match ? parseFloat(match[1]) : 1;
    }

    it("should return 1 for null transform", () => {
      expect(parseZoomFromTransform(null)).toBe(1);
    });

    it("should return 1 for empty transform", () => {
      expect(parseZoomFromTransform("")).toBe(1);
    });

    it("should parse simple scale transform", () => {
      expect(parseZoomFromTransform("scale(1.5)")).toBe(1.5);
    });

    it("should parse scale from complex transform", () => {
      expect(parseZoomFromTransform("translate(100, 200) scale(0.75)")).toBe(
        0.75
      );
    });

    it("should handle decimal zoom levels", () => {
      expect(parseZoomFromTransform("scale(0.333)")).toBe(0.333);
    });

    it("should handle zoom levels > 1", () => {
      expect(parseZoomFromTransform("scale(2.5)")).toBe(2.5);
    });

    it("should return 1 when scale is not found", () => {
      expect(parseZoomFromTransform("translate(100, 200)")).toBe(1);
    });

    it("should handle scale with whitespace", () => {
      expect(parseZoomFromTransform("scale( 1.25 )")).toBe(1.25);
    });
  });

  describe("calculateNodeHeight", () => {
    it("should return base height for short titles", () => {
      const height = calculateNodeHeight("Debut");
      expect(height).toBe(58); // QUEST_NODE_HEIGHT = 58
    });

    it("should add height for longer titles", () => {
      const shortHeight = calculateNodeHeight("Debut");
      const longHeight = calculateNodeHeight(
        "This is a very long quest title that spans multiple lines"
      );
      expect(longHeight).toBeGreaterThan(shortHeight);
    });

    it("should cap at 2 lines maximum", () => {
      // Test with extremely long title (should still cap at 2 lines)
      const veryLongTitle = "A".repeat(100);
      const height = calculateNodeHeight(veryLongTitle);

      // Base (58) + 1 additional line (18) = 76px max
      expect(height).toBe(76);
    });

    it("should calculate consistent height for titles of same length", () => {
      const height1 = calculateNodeHeight("Short Quest Name");
      const height2 = calculateNodeHeight("Another Quest AA");
      expect(height1).toBe(height2);
    });

    it("should handle empty title", () => {
      const height = calculateNodeHeight("");
      // Empty title = 0 chars, ceil(0/15) = 0 lines, min(0,2) = 0, height = 58 + (0-1)*18 = 40
      expect(height).toBe(40);
    });
  });

  describe("touch target size validation", () => {
    /**
     * Check if an element size meets touch target accessibility guidelines
     * Minimum 44px for both width and height
     */
    function isValidTouchTarget(width: number, height: number): boolean {
      return width >= 44 && height >= 44;
    }

    it("should return true for exactly 44x44", () => {
      expect(isValidTouchTarget(44, 44)).toBe(true);
    });

    it("should return true for larger than minimum", () => {
      expect(isValidTouchTarget(48, 48)).toBe(true);
      expect(isValidTouchTarget(100, 100)).toBe(true);
    });

    it("should return false for smaller width", () => {
      expect(isValidTouchTarget(43, 48)).toBe(false);
    });

    it("should return false for smaller height", () => {
      expect(isValidTouchTarget(48, 43)).toBe(false);
    });

    it("should return false for both dimensions too small", () => {
      expect(isValidTouchTarget(30, 30)).toBe(false);
    });

    it("should handle edge case of 0", () => {
      expect(isValidTouchTarget(0, 0)).toBe(false);
    });

    it("should handle negative values", () => {
      expect(isValidTouchTarget(-10, 50)).toBe(false);
      expect(isValidTouchTarget(50, -10)).toBe(false);
    });
  });

  describe("transform attribute parsing", () => {
    /**
     * Parse x, y translation from ReactFlow transform attribute
     */
    function parseTranslateFromTransform(transform: string | null): {
      x: number;
      y: number;
    } {
      if (!transform) return { x: 0, y: 0 };

      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (!match) return { x: 0, y: 0 };

      return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
      };
    }

    it("should return origin for null transform", () => {
      expect(parseTranslateFromTransform(null)).toEqual({ x: 0, y: 0 });
    });

    it("should parse simple translate", () => {
      expect(parseTranslateFromTransform("translate(100, 200)")).toEqual({
        x: 100,
        y: 200,
      });
    });

    it("should parse negative coordinates", () => {
      expect(parseTranslateFromTransform("translate(-50, -100)")).toEqual({
        x: -50,
        y: -100,
      });
    });

    it("should parse decimal coordinates", () => {
      expect(parseTranslateFromTransform("translate(10.5, 20.75)")).toEqual({
        x: 10.5,
        y: 20.75,
      });
    });

    it("should handle translate with scale", () => {
      expect(
        parseTranslateFromTransform("translate(50, 100) scale(1.5)")
      ).toEqual({
        x: 50,
        y: 100,
      });
    });

    it("should return origin when translate not found", () => {
      expect(parseTranslateFromTransform("scale(1.5)")).toEqual({ x: 0, y: 0 });
    });

    it("should handle whitespace variations", () => {
      expect(parseTranslateFromTransform("translate( 30 , 40 )")).toEqual({
        x: 30,
        y: 40,
      });
    });
  });
});

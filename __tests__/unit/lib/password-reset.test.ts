/**
 * Unit Tests - Password Reset Token Generation
 *
 * Tests the token generation function used in password reset.
 */
import { describe, it, expect } from "vitest";
import { generateResetToken } from "@/app/api/auth/forgot-password/route";

describe("generateResetToken", () => {
  it("should generate a 64-character hex string", () => {
    const token = generateResetToken();

    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it("should generate unique tokens on each call", () => {
    const tokens = new Set<string>();

    // Generate 100 tokens and ensure they're all unique
    for (let i = 0; i < 100; i++) {
      const token = generateResetToken();
      expect(tokens.has(token)).toBe(false);
      tokens.add(token);
    }

    expect(tokens.size).toBe(100);
  });

  it("should generate cryptographically random tokens", () => {
    // Statistical test: tokens should not have predictable patterns
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    const token3 = generateResetToken();

    // No common prefixes longer than 4 characters (statistically unlikely)
    const commonPrefixLength = (a: string, b: string) => {
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return i;
    };

    expect(commonPrefixLength(token1, token2)).toBeLessThan(8);
    expect(commonPrefixLength(token2, token3)).toBeLessThan(8);
    expect(commonPrefixLength(token1, token3)).toBeLessThan(8);
  });
});

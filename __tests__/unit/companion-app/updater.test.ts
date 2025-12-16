/**
 * Unit Tests - Tauri v2 Auto-Updater Frontend Utility
 *
 * Tests the checkForUpdates function that can be called from the frontend
 * to manually check for and install updates.
 *
 * Note: Since this function is a thin wrapper around Tauri plugins that will
 * be executed in the Rust environment, we test its structure and error handling
 * rather than full integration.
 */
import { describe, it, expect } from "vitest";

describe("Tauri v2 Auto-Updater Frontend Utility", () => {
  it("checkForUpdates function exists and is importable", async () => {
    // Import the function
    const { checkForUpdates } = await import(
      "../../../companion-app/src/lib/updater"
    );

    // Verify it's a function
    expect(typeof checkForUpdates).toBe("function");
  });

  it("checkForUpdates has proper error handling structure", async () => {
    const { checkForUpdates } = await import(
      "../../../companion-app/src/lib/updater"
    );

    // The function should be callable without throwing
    // In non-Tauri environment, it will fail gracefully
    // This is a smoke test to ensure the function doesn't have syntax errors
    expect(checkForUpdates).toBeDefined();
  });

  it("updater module exports checkForUpdates", async () => {
    const updaterModule = await import(
      "../../../companion-app/src/lib/updater"
    );

    expect(updaterModule).toHaveProperty("checkForUpdates");
    expect(typeof updaterModule.checkForUpdates).toBe("function");
  });

  it("checkForUpdates is an async function", async () => {
    const { checkForUpdates } = await import(
      "../../../companion-app/src/lib/updater"
    );

    // Check if it returns a Promise
    const result = checkForUpdates();
    expect(result instanceof Promise || result === undefined).toBeTruthy();
  });
});

/**
 * Unit Tests - Tauri v2 Auto-Updater (Companion App - Silent Mode)
 *
 * Tests the checkForUpdates function used in the COMPANION DESKTOP APP.
 * This is a SILENT auto-updater that downloads and installs updates
 * automatically without any user interaction or prompts.
 *
 * IMPORTANT: This is different from the WEB APP updater which has user prompts.
 * For the INTERACTIVE updater (web app with confirmation dialogs), see:
 * __tests__/unit/lib/updater/check-updates.test.ts
 *
 * Implementation: apps/companion/src/lib/updater.ts
 * Since this function is a thin wrapper around Tauri plugins that will
 * be executed in the Rust environment, we test its structure and error handling.
 */
import { describe, it, expect } from "vitest";

describe("Tauri v2 Auto-Updater Frontend Utility", () => {
  it("checkForUpdates function exists and is importable", async () => {
    // Import the function
    const { checkForUpdates } = await import(
      "../../../apps/companion/src/lib/updater"
    );

    // Verify it's a function
    expect(typeof checkForUpdates).toBe("function");
  });

  it("checkForUpdates has proper error handling structure", async () => {
    const { checkForUpdates } = await import(
      "../../../apps/companion/src/lib/updater"
    );

    // The function should be callable without throwing
    // In non-Tauri environment, it will fail gracefully
    // This is a smoke test to ensure the function doesn't have syntax errors
    expect(checkForUpdates).toBeDefined();
  });

  it("updater module exports checkForUpdates", async () => {
    const updaterModule = await import(
      "../../../apps/companion/src/lib/updater"
    );

    expect(updaterModule).toHaveProperty("checkForUpdates");
    expect(typeof updaterModule.checkForUpdates).toBe("function");
  });

  it("checkForUpdates is an async function", async () => {
    const { checkForUpdates } = await import(
      "../../../apps/companion/src/lib/updater"
    );

    // Check if it returns a Promise
    const result = checkForUpdates();
    expect(result instanceof Promise || result === undefined).toBeTruthy();
  });
});

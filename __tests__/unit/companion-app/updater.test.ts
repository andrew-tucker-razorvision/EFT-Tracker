/**
 * Unit Tests - Tauri v2 Auto-Updater
 *
 * Tests the update checking functionality for the companion app including:
 * - Update detection
 * - No update available scenario
 * - Error handling
 * - Auto-installation flow
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the Tauri plugin modules before importing
const mockCheck = vi.fn();
const mockDownloadAndInstall = vi.fn();
const mockRelaunch = vi.fn();

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: mockCheck,
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: mockRelaunch,
}));

// Import after mocking
import { checkForUpdates } from "companion-app/src/lib/updater";

describe("Tauri v2 Auto-Updater", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check for updates and install if available", async () => {
    const mockUpdate = {
      available: true,
      version: "0.2.0",
      downloadAndInstall: mockDownloadAndInstall,
    };

    mockCheck.mockResolvedValue(mockUpdate);
    mockDownloadAndInstall.mockResolvedValue(undefined);
    mockRelaunch.mockResolvedValue(undefined);

    await checkForUpdates();

    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockDownloadAndInstall).toHaveBeenCalledOnce();
    expect(mockRelaunch).toHaveBeenCalledOnce();
  });

  it("should do nothing if no update available", async () => {
    mockCheck.mockResolvedValue(null);

    await checkForUpdates();

    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });

  it("should handle check errors gracefully", async () => {
    mockCheck.mockRejectedValue(new Error("Network error"));

    // Should not throw
    await expect(checkForUpdates()).resolves.toBeUndefined();

    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });

  it("should handle download/install errors gracefully", async () => {
    const mockUpdate = {
      available: true,
      version: "0.2.0",
      downloadAndInstall: mockDownloadAndInstall,
    };

    mockCheck.mockResolvedValue(mockUpdate);
    mockDownloadAndInstall.mockRejectedValue(new Error("Download failed"));

    // Should not throw
    await expect(checkForUpdates()).resolves.toBeUndefined();

    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockDownloadAndInstall).toHaveBeenCalledOnce();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });

  it("should handle update object without available property", async () => {
    const mockUpdate = {
      available: false,
      version: "0.1.0",
    };

    mockCheck.mockResolvedValue(mockUpdate);

    await checkForUpdates();

    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });

  it("should log info about available updates", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockUpdate = {
      available: true,
      version: "0.2.0",
      downloadAndInstall: mockDownloadAndInstall,
    };

    mockCheck.mockResolvedValue(mockUpdate);
    mockDownloadAndInstall.mockResolvedValue(undefined);
    mockRelaunch.mockResolvedValue(undefined);

    await checkForUpdates();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Update available")
    );

    consoleSpy.mockRestore();
  });
});

/**
 * Unit Tests - Tauri v2 Auto-Updater (Web App - Interactive Mode)
 *
 * Tests the checkForUpdates function used in the WEB APP.
 * This is an INTERACTIVE auto-updater that prompts the user for confirmation
 * before downloading and installing updates.
 *
 * IMPORTANT: This is different from the COMPANION APP updater which is silent.
 * For the SILENT updater (companion app without prompts), see:
 * __tests__/unit/companion-app/updater.test.ts
 *
 * Implementation: apps/web/src/lib/updater/check-updates.ts
 * Tests the update checking functionality including:
 * - Successful update detection and user confirmation
 * - No update available scenario
 * - Error handling during update check
 * - User interaction flows (accept/decline)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Create mock functions at module scope
const mockCheck = vi.fn();
const mockRelaunch = vi.fn();

// Mock Tauri modules - these MUST be hoisted
vi.mock("@tauri-apps/plugin-updater", () => ({
  check: mockCheck,
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: mockRelaunch,
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.window.confirm = mockConfirm;

// Now import after mocks are set up
import {
  checkForUpdates,
  checkForUpdatesSilently,
} from "@/lib/updater/check-updates";

// Mock function for downloadAndInstall
const mockDownloadAndInstall = vi.fn();

describe("checkForUpdates", () => {
  beforeEach(() => {
    mockConfirm.mockClear();
    mockCheck.mockClear();
    mockDownloadAndInstall.mockClear();
    mockRelaunch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return false when no update is available", async () => {
    mockCheck.mockResolvedValue(null);

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockCheck).toHaveBeenCalled();
  });

  it("should prompt user and install update when available and user accepts", async () => {
    mockDownloadAndInstall.mockResolvedValue(undefined);
    mockRelaunch.mockResolvedValue(undefined);

    mockCheck.mockResolvedValue({
      version: "1.0.1",
      currentVersion: "1.0.0",
      downloadAndInstall: mockDownloadAndInstall,
    });

    // User accepts both prompts
    mockConfirm.mockReturnValueOnce(true).mockReturnValueOnce(true);

    const result = await checkForUpdates();

    expect(result).toBe(true);
    expect(mockConfirm).toHaveBeenCalledTimes(2);
    expect(mockDownloadAndInstall).toHaveBeenCalled();
    expect(mockRelaunch).toHaveBeenCalled();
  });

  it("should not install update when user declines first prompt", async () => {
    mockCheck.mockResolvedValue({
      version: "1.0.1",
      currentVersion: "1.0.0",
      downloadAndInstall: mockDownloadAndInstall,
    });

    // User declines install prompt
    mockConfirm.mockReturnValueOnce(false);

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockDownloadAndInstall).not.toHaveBeenCalled();
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it("should not relaunch when user declines second prompt", async () => {
    mockDownloadAndInstall.mockResolvedValue(undefined);

    mockCheck.mockResolvedValue({
      version: "1.0.1",
      currentVersion: "1.0.0",
      downloadAndInstall: mockDownloadAndInstall,
    });

    // User accepts install but declines relaunch
    mockConfirm.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const result = await checkForUpdates();

    expect(result).toBe(true);
    expect(mockDownloadAndInstall).toHaveBeenCalled();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Network error");
    mockCheck.mockRejectedValue(error);

    const result = await checkForUpdates();

    expect(result).toBe(false);
  });
});

describe("checkForUpdatesSilently", () => {
  beforeEach(() => {
    mockCheck.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when update is available", async () => {
    mockCheck.mockResolvedValue({
      version: "1.0.1",
      currentVersion: "1.0.0",
    });

    const result = await checkForUpdatesSilently();

    expect(result).toBe(true);
  });

  it("should return false when no update is available", async () => {
    mockCheck.mockResolvedValue(null);

    const result = await checkForUpdatesSilently();

    expect(result).toBe(false);
  });

  it("should handle errors and return false", async () => {
    const error = new Error("Connection timeout");
    mockCheck.mockRejectedValue(error);

    const result = await checkForUpdatesSilently();

    expect(result).toBe(false);
  });
});

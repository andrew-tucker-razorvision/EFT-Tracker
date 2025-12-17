import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "./SettingsPanel";
import type { AppSettings } from "../hooks/useStore";
import * as autostartPlugin from "@tauri-apps/plugin-autostart";
import * as dialogPlugin from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/plugin-autostart");
vi.mock("@tauri-apps/plugin-dialog");

describe("SettingsPanel", () => {
  const mockSettings: AppSettings = {
    eftPath: "C:\\Battlestate Games\\EFT",
    enableNotifications: true,
    enableAutoWatch: false,
    enableAutostart: true,
    theme: "dark",
  };

  const mockOnUpdateSetting = vi.fn();
  const mockOnSetEftPath = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpdateSetting.mockResolvedValue(undefined);
    mockOnSetEftPath.mockResolvedValue(true);
  });

  it("renders settings panel with all options", () => {
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/eft path/i)).toBeInTheDocument();
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/auto-watch/i)).toBeInTheDocument();
    expect(screen.getByText(/autostart/i)).toBeInTheDocument();
  });

  it("displays current EFT path", () => {
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByDisplayValue("C:\\Battlestate Games\\EFT")).toBeInTheDocument();
  });

  it("toggles notification setting", async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const notificationToggle = screen.getByRole("checkbox", { name: /enable notifications/i });
    await user.click(notificationToggle);

    expect(mockOnUpdateSetting).toHaveBeenCalledWith("enableNotifications", false);
  });

  it("toggles auto-watch setting", async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const autoWatchToggle = screen.getByRole("checkbox", { name: /auto-watch/i });
    await user.click(autoWatchToggle);

    expect(mockOnUpdateSetting).toHaveBeenCalledWith("enableAutoWatch", true);
  });

  it("toggles autostart setting", async () => {
    const user = userEvent.setup();
    const mockEnable = vi.mocked(autostartPlugin.enable);
    const mockDisable = vi.mocked(autostartPlugin.disable);

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const autostartToggle = screen.getByRole("checkbox", { name: /launch at startup/i });
    await user.click(autostartToggle);

    // Should disable autostart (currently enabled)
    await waitFor(() => {
      expect(mockDisable).toHaveBeenCalled();
    });
  });

  it("updates EFT path when valid", async () => {
    const user = userEvent.setup();
    mockOnSetEftPath.mockResolvedValue(true);

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const pathInput = screen.getByDisplayValue("C:\\Battlestate Games\\EFT");
    await userEvent.clear(pathInput);
    await userEvent.type(pathInput, "D:\\EFT");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSetEftPath).toHaveBeenCalledWith("D:\\EFT");
  });

  it("shows error when EFT path is invalid", async () => {
    const user = userEvent.setup();
    mockOnSetEftPath.mockResolvedValue(false);

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const pathInput = screen.getByDisplayValue("C:\\Battlestate Games\\EFT");
    await userEvent.clear(pathInput);
    await userEvent.type(pathInput, "C:\\Invalid\\Path");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid eft installation path/i)).toBeInTheDocument();
    });
  });

  it("shows error when path is empty", async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const pathInput = screen.getByDisplayValue("C:\\Battlestate Games\\EFT");
    await userEvent.clear(pathInput);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(await screen.findByText(/please enter a path/i)).toBeInTheDocument();
  });

  it("opens file dialog when browse button is clicked", async () => {
    const user = userEvent.setup();
    const mockOpen = vi.mocked(dialogPlugin.open);
    mockOpen.mockResolvedValue("C:\\New\\EFT\\Path");

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const browseButton = screen.getByRole("button", { name: /browse/i });
    await user.click(browseButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  it("updates path input when file dialog returns path", async () => {
    const user = userEvent.setup();
    const mockOpen = vi.mocked(dialogPlugin.open);
    mockOpen.mockResolvedValue("D:\\Selected\\Path");

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const browseButton = screen.getByRole("button", { name: /browse/i });
    await user.click(browseButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("D:\\Selected\\Path")).toBeInTheDocument();
    });
  });

  it("calls onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it("shows loading state while validating EFT path", async () => {
    const user = userEvent.setup();
    mockOnSetEftPath.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const pathInput = screen.getByDisplayValue("C:\\Battlestate Games\\EFT");
    await userEvent.clear(pathInput);
    await userEvent.type(pathInput, "D:\\EFT");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Should show saving state
    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
  });

  it("shows success checkmark when path is valid", async () => {
    const user = userEvent.setup();
    mockOnSetEftPath.mockResolvedValue(true);

    render(
      <SettingsPanel
        settings={mockSettings}
        eftPath="C:\\Battlestate Games\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const pathInput = screen.getByDisplayValue("C:\\Battlestate Games\\EFT");
    await userEvent.clear(pathInput);
    await userEvent.type(pathInput, "D:\\EFT");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/✓/)).toBeInTheDocument();
    });
  });

  it("reflects current setting states in toggles", () => {
    const settings: AppSettings = {
      eftPath: "C:\\EFT",
      enableNotifications: false,
      enableAutoWatch: true,
      enableAutostart: false,
      theme: "dark",
    };

    render(
      <SettingsPanel
        settings={settings}
        eftPath="C:\\EFT"
        onUpdateSetting={mockOnUpdateSetting}
        onSetEftPath={mockOnSetEftPath}
        onBack={mockOnBack}
      />
    );

    const notificationToggle = screen.getByRole("checkbox", {
      name: /enable notifications/i,
    }) as HTMLInputElement;
    const autoWatchToggle = screen.getByRole("checkbox", {
      name: /auto-watch/i,
    }) as HTMLInputElement;

    expect(notificationToggle.checked).toBe(false);
    expect(autoWatchToggle.checked).toBe(true);
  });
});

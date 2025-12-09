import { useState, useEffect, useCallback } from "react";
import { Store } from "@tauri-apps/plugin-store";

const store = new Store("settings.json");

export interface AppSettings {
  companionToken: string | null;
  eftPath: string | null;
  autoStart: boolean;
  autoWatch: boolean;
  notifications: boolean;
  notificationSound: boolean;
}

const defaultSettings: AppSettings = {
  companionToken: null,
  eftPath: null,
  autoStart: false,
  autoWatch: true,
  notifications: true,
  notificationSound: true,
};

export function useStore() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await store.get<AppSettings>("settings");
        if (saved) {
          setSettings({ ...defaultSettings, ...saved });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save individual setting
  const setSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      try {
        await store.set("settings", newSettings);
        await store.save();
      } catch (error) {
        console.error(`Failed to save setting ${key}:`, error);
      }
    },
    [settings]
  );

  // Save all settings at once
  const saveSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      try {
        await store.set("settings", merged);
        await store.save();
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    [settings]
  );

  // Clear all settings
  const clearSettings = useCallback(async () => {
    setSettings(defaultSettings);
    try {
      await store.clear();
      await store.save();
    } catch (error) {
      console.error("Failed to clear settings:", error);
    }
  }, []);

  return {
    settings,
    loading,
    setSetting,
    saveSettings,
    clearSettings,
  };
}

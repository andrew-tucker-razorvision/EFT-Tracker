/**
 * Tauri Auto-Updater
 *
 * Checks for app updates from GitHub Releases and installs them automatically.
 *
 * This file is only used in the Tauri companion app, not the web version.
 */

/**
 * Check for updates and prompt user to install
 *
 * This should be called on app startup.
 *
 * @returns Promise<boolean> - true if update was installed, false otherwise
 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    // Dynamic import to avoid issues in web version
    const { checkUpdate, installUpdate } = await import(
      "@tauri-apps/api/updater"
    );
    const { relaunch } = await import("@tauri-apps/api/process");

    console.log("Checking for updates...");

    const { shouldUpdate, manifest } = await checkUpdate();

    if (shouldUpdate) {
      console.log(`Update available: ${manifest?.version}`);

      const shouldInstall = window.confirm(
        `A new version is available: ${manifest?.version}\n\n` +
          `Current version: ${manifest?.currentVersion || "unknown"}\n\n` +
          `Would you like to install the update now?`
      );

      if (shouldInstall) {
        console.log("Downloading and installing update...");

        // Install the update
        await installUpdate();

        // Prompt to relaunch
        const shouldRelaunch = window.confirm(
          "Update installed successfully!\n\n" +
            "The app will now restart to apply the update."
        );

        if (shouldRelaunch) {
          await relaunch();
        }

        return true;
      }
    } else {
      console.log("No updates available");
    }

    return false;
  } catch (error) {
    console.error("Update check failed:", error);
    return false;
  }
}

/**
 * Check for updates silently (no user prompts)
 *
 * Useful for background update checks.
 *
 * @returns Promise<boolean> - true if update is available, false otherwise
 */
export async function checkForUpdatesSilently(): Promise<boolean> {
  try {
    const { checkUpdate } = await import("@tauri-apps/api/updater");

    const { shouldUpdate } = await checkUpdate();

    return shouldUpdate;
  } catch (error) {
    console.error("Silent update check failed:", error);
    return false;
  }
}

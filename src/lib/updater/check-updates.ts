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
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    console.log("Checking for updates...");

    const update = await check();

    if (update) {
      console.log(`Update available: ${update.version}`);

      const shouldInstall = window.confirm(
        `A new version is available: ${update.version}\n\n` +
          `Current version: ${update.currentVersion}\n\n` +
          `Would you like to install the update now?`
      );

      if (shouldInstall) {
        console.log("Downloading and installing update...");

        // Download and install the update
        await update.downloadAndInstall();

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
    const { check } = await import("@tauri-apps/plugin-updater");

    const update = await check();

    return update !== null;
  } catch (error) {
    console.error("Silent update check failed:", error);
    return false;
  }
}

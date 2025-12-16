import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

/**
 * Check for updates and install if available
 * This function can be called from the frontend to manually check for updates
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const update = await check();
    if (update?.available) {
      console.log(`Update available: ${update.version}`);
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
    // Don't throw - allow app to continue even if update check fails
  }
}

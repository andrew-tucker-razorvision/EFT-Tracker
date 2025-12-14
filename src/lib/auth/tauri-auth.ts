/**
 * Tauri Authentication Helpers
 *
 * Handles authentication flow for the Tauri companion app.
 * OAuth flows open in the system browser, and the app polls for session status.
 */

import { tauriApiClient } from "../api/tauri-client";

/**
 * Open external browser for OAuth (Tauri only)
 */
export async function openOAuthWindow(
  provider: "google" | "discord"
): Promise<void> {
  // Dynamic import to avoid issues in web version
  const { open } = await import("@tauri-apps/plugin-shell");

  const authUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://learntotarkov.com"}/api/auth/signin/${provider}`;

  await open(authUrl);
}

/**
 * Check authentication status
 */
export async function checkAuthStatus(): Promise<{
  user: { id: string; email: string; name?: string } | null;
}> {
  try {
    const session = await tauriApiClient.get<{
      user?: { id: string; email: string; name?: string };
    }>("/api/auth/session");

    return {
      user: session.user || null,
    };
  } catch (error) {
    console.error("Failed to check auth status:", error);
    return { user: null };
  }
}

/**
 * Sign out the user
 */
export async function signOut(): Promise<void> {
  try {
    await tauriApiClient.post("/api/auth/signout", {});
  } catch (error) {
    console.error("Failed to sign out:", error);
    throw error;
  }
}

/**
 * Poll for authentication after OAuth window opens
 *
 * Call this after openOAuthWindow() to periodically check if the user
 * has completed authentication in the browser.
 */
export async function pollForAuth(
  maxAttempts = 60,
  intervalMs = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { user } = await checkAuthStatus();

    if (user) {
      return true; // Authentication successful
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false; // Timeout - user didn't complete auth
}

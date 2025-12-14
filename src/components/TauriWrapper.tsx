"use client";

import { useState } from "react";

/**
 * Tauri Wrapper Component
 *
 * Detects if the app is running in Tauri and wraps children with
 * Tauri-specific UI elements (e.g., custom window controls).
 */
export function TauriWrapper({ children }: { children: React.ReactNode }) {
  // Check if running in Tauri (only runs once on mount, no effect needed)
  const [isTauri] = useState(
    () => typeof window !== "undefined" && "__TAURI__" in window
  );

  // If not Tauri, just render children normally
  if (!isTauri) {
    return <>{children}</>;
  }

  // Tauri-specific rendering
  return (
    <div className="tauri-app">
      {/* Future: Add custom window controls here if needed */}
      {/* For now, just render children - Tauri handles window chrome */}
      {children}
    </div>
  );
}

/**
 * Hook to detect if running in Tauri
 */
export function useTauri() {
  // Check if running in Tauri (only runs once on mount, no effect needed)
  const [isTauri] = useState(
    () => typeof window !== "undefined" && "__TAURI__" in window
  );

  return { isTauri };
}

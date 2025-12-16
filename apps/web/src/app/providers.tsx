"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { StatsProvider } from "@/contexts/StatsContext";
import { checkForUpdates } from "@/lib/updater/check-updates";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Check for updates on app startup (Tauri only)
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      checkForUpdates().catch((error) => {
        console.error("Failed to check for updates:", error);
      });
    }
  }, []);

  return (
    <SessionProvider>
      <StatsProvider>
        {children}
        <Toaster richColors position="bottom-right" />
      </StatsProvider>
    </SessionProvider>
  );
}

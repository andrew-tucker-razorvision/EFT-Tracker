"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { StatsProvider } from "@/contexts/StatsContext";
import { UserPrefsProvider } from "@/providers/UserPrefsProvider";
import { checkForUpdates } from "@/lib/updater/check-updates";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // Check for updates on app startup (Tauri only)
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      checkForUpdates().catch((error) => {
        console.error("Failed to check for updates:", error);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <UserPrefsProvider>
          <StatsProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </StatsProvider>
        </UserPrefsProvider>
      </SessionProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

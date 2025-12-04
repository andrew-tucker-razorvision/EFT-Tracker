"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { StatsProvider } from "@/contexts/StatsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StatsProvider>
        {children}
        <Toaster richColors position="bottom-right" />
      </StatsProvider>
    </SessionProvider>
  );
}

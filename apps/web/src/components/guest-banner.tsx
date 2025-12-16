"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuestBanner() {
  const { status } = useSession();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if authenticated or dismissed
  if (status === "authenticated" || status === "loading" || dismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-3 py-2">
      <div className="container mx-auto flex items-center justify-between gap-2 text-sm">
        <span className="text-foreground">
          You&apos;re browsing as a guest. Your progress won&apos;t be saved.
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect mobile viewport (width < 768px).
 * Uses Tailwind's md breakpoint as the threshold.
 *
 * Returns `null` during SSR/hydration to prevent hydration mismatch,
 * then resolves to boolean after client-side hydration.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
